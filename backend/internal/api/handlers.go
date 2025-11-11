package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/techsavvyash/anki-backend/internal/models"
	"github.com/techsavvyash/anki-backend/internal/scheduler"
	"github.com/techsavvyash/anki-backend/internal/storage"
	"github.com/techsavvyash/anki-backend/pkg/apkg"
)

type Server struct {
	storage    *storage.SQLiteStorage
	uploadDir  string
	router     *gin.Engine
}

func NewServer(store *storage.SQLiteStorage, uploadDir string) *Server {
	server := &Server{
		storage:   store,
		uploadDir: uploadDir,
		router:    gin.Default(),
	}

	server.setupRoutes()
	return server
}

func (s *Server) setupRoutes() {
	// Health check
	s.router.GET("/health", s.healthCheck)

	// User routes
	s.router.POST("/users", s.createUser)
	s.router.GET("/users/:id", s.getUser)

	// Upload routes
	s.router.POST("/upload", s.uploadApkg)
	s.router.POST("/upload/chunk", s.uploadChunk)

	// Deck routes
	s.router.GET("/decks", s.getUserDecks)
	s.router.GET("/decks/:id/cards", s.getDeckCards)

	// Review routes
	s.router.GET("/reviews/due", s.getDueCards)
	s.router.POST("/reviews", s.submitReview)

	// Card routes
	s.router.GET("/cards/:id", s.getCard)
}

func (s *Server) Run(addr string) error {
	return s.router.Run(addr)
}

// Health check
func (s *Server) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "healthy"})
}

// User handlers
func (s *Server) createUser(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := s.storage.CreateUser(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (s *Server) getUser(c *gin.Context) {
	userID := c.Param("id")

	user, err := s.storage.GetUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// Upload handlers
func (s *Server) uploadApkg(c *gin.Context) {
	// Get user ID from header or query param
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		userID = c.Query("user_id")
	}
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	// Parse multipart form with 100MB max memory
	if err := c.Request.ParseMultipartForm(100 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(s.uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Save file
	filename := uuid.New().String() + filepath.Ext(header.Filename)
	filepath := filepath.Join(s.uploadDir, filename)

	out, err := os.Create(filepath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Process the .apkg file
	go s.processApkg(userID, filepath, header.Filename)

	c.JSON(http.StatusAccepted, gin.H{
		"message": "File uploaded successfully, processing started",
		"file_id": filename,
	})
}

// uploadChunk handles chunked file uploads for large files
func (s *Server) uploadChunk(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	sessionID := c.PostForm("session_id")
	chunkIndexStr := c.PostForm("chunk_index")
	totalChunksStr := c.PostForm("total_chunks")
	fileName := c.PostForm("file_name")

	if sessionID == "" {
		sessionID = uuid.New().String()
	}

	chunkIndex, _ := strconv.Atoi(chunkIndexStr)
	totalChunks, _ := strconv.Atoi(totalChunksStr)

	file, _, err := c.Request.FormFile("chunk")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No chunk uploaded"})
		return
	}
	defer file.Close()

	// Create session directory
	sessionDir := filepath.Join(s.uploadDir, "chunks", sessionID)
	if err := os.MkdirAll(sessionDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session directory"})
		return
	}

	// Save chunk
	chunkPath := filepath.Join(sessionDir, fmt.Sprintf("chunk_%d", chunkIndex))
	out, err := os.Create(chunkPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save chunk"})
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save chunk"})
		return
	}

	// Check if all chunks are uploaded
	if chunkIndex == totalChunks-1 {
		// Combine chunks
		finalPath := filepath.Join(s.uploadDir, sessionID+filepath.Ext(fileName))
		if err := s.combineChunks(sessionDir, finalPath, totalChunks); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to combine chunks"})
			return
		}

		// Clean up chunks
		os.RemoveAll(sessionDir)

		// Process the .apkg file
		go s.processApkg(userID, finalPath, fileName)

		c.JSON(http.StatusOK, gin.H{
			"message":    "Upload completed, processing started",
			"session_id": sessionID,
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"message":    "Chunk uploaded successfully",
			"session_id": sessionID,
			"chunk":      chunkIndex,
		})
	}
}

func (s *Server) combineChunks(chunkDir, outputPath string, totalChunks int) error {
	outFile, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	for i := 0; i < totalChunks; i++ {
		chunkPath := filepath.Join(chunkDir, fmt.Sprintf("chunk_%d", i))
		chunkFile, err := os.Open(chunkPath)
		if err != nil {
			return err
		}

		if _, err := io.Copy(outFile, chunkFile); err != nil {
			chunkFile.Close()
			return err
		}
		chunkFile.Close()
	}

	return nil
}

func (s *Server) processApkg(userID, filePath, originalFileName string) {
	// Extract and parse .apkg file
	pkg, err := apkg.ExtractApkg(filePath)
	if err != nil {
		fmt.Printf("Failed to extract apkg: %v\n", err)
		return
	}
	defer pkg.Close()

	// Get decks
	decks, err := pkg.GetDecks()
	if err != nil {
		fmt.Printf("Failed to get decks: %v\n", err)
		return
	}

	// Get notes
	notes, err := pkg.GetNotes()
	if err != nil {
		fmt.Printf("Failed to get notes: %v\n", err)
		return
	}

	// Get cards
	cards, err := pkg.GetCards()
	if err != nil {
		fmt.Printf("Failed to get cards: %v\n", err)
		return
	}

	// Create deck in our database
	for _, ankiDeck := range decks {
		deck := &models.ImportedDeck{
			UserID:      userID,
			Name:        ankiDeck.Name,
			Description: ankiDeck.Desc,
			OriginalID:  ankiDeck.ID,
			CardCount:   len(cards),
		}

		if err := s.storage.CreateDeck(deck); err != nil {
			fmt.Printf("Failed to create deck: %v\n", err)
			continue
		}

		// Create a map of note ID to note
		noteMap := make(map[int64]apkg.Note)
		for _, note := range notes {
			noteMap[note.ID] = note
		}

		// Import cards
		for _, ankiCard := range cards {
			if ankiCard.DeckID != ankiDeck.ID {
				continue
			}

			note, exists := noteMap[ankiCard.NoteID]
			if !exists || len(note.Fields) < 2 {
				continue
			}

			// Create flashcard (assuming basic front/back format)
			flashcard := &models.Flashcard{
				DeckID:     deck.ID,
				NoteID:     note.ID,
				Front:      note.Fields[0],
				Back:       note.Fields[1],
				OriginalID: ankiCard.ID,
			}

			if err := s.storage.CreateFlashcard(flashcard); err != nil {
				fmt.Printf("Failed to create flashcard: %v\n", err)
				continue
			}

			// Initialize card schedule
			schedule := scheduler.InitializeCardSchedule(userID, flashcard.ID)
			if err := s.storage.CreateCardSchedule(schedule); err != nil {
				fmt.Printf("Failed to create card schedule: %v\n", err)
			}
		}
	}

	fmt.Printf("Successfully imported %d decks, %d cards\n", len(decks), len(cards))
}

// Deck handlers
func (s *Server) getUserDecks(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		userID = c.Query("user_id")
	}
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	decks, err := s.storage.GetUserDecks(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get decks"})
		return
	}

	c.JSON(http.StatusOK, decks)
}

func (s *Server) getDeckCards(c *gin.Context) {
	deckID := c.Param("id")

	cards, err := s.storage.GetDeckCards(deckID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cards"})
		return
	}

	c.JSON(http.StatusOK, cards)
}

// Review handlers
func (s *Server) getDueCards(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		userID = c.Query("user_id")
	}
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	schedules, err := s.storage.GetDueCards(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get due cards"})
		return
	}

	c.JSON(http.StatusOK, schedules)
}

func (s *Server) submitReview(c *gin.Context) {
	var req struct {
		UserID  string `json:"user_id" binding:"required"`
		CardID  string `json:"card_id" binding:"required"`
		Quality int    `json:"quality" binding:"required,min=0,max=5"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get current schedule
	schedule, err := s.storage.GetCardSchedule(req.UserID, req.CardID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card schedule not found"})
		return
	}

	// Calculate next review
	newSchedule := scheduler.CalculateNextReview(schedule, req.Quality)

	// Update schedule
	if err := s.storage.UpdateCardSchedule(newSchedule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update schedule"})
		return
	}

	// Log review
	log := &models.ReviewLog{
		UserID:  req.UserID,
		CardID:  req.CardID,
		Quality: req.Quality,
	}
	if err := s.storage.CreateReviewLog(log); err != nil {
		fmt.Printf("Failed to log review: %v\n", err)
	}

	c.JSON(http.StatusOK, newSchedule)
}

func (s *Server) getCard(c *gin.Context) {
	cardID := c.Param("id")

	// This would need to be implemented in storage
	// For now, return a placeholder
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented yet"})
}
