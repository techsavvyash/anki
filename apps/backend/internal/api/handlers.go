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
	s.router.PUT("/decks/:id/topic", s.updateDeckTopic)

	// Subject routes
	s.router.POST("/subjects", s.createSubject)
	s.router.GET("/subjects", s.getUserSubjects)
	s.router.PUT("/subjects/:id", s.updateSubject)
	s.router.DELETE("/subjects/:id", s.deleteSubject)

	// Topic routes
	s.router.POST("/topics", s.createTopic)
	s.router.GET("/topics", s.getUserTopics)
	s.router.GET("/subjects/:id/topics", s.getSubjectTopics)
	s.router.PUT("/topics/:id", s.updateTopic)
	s.router.DELETE("/topics/:id", s.deleteTopic)

	// Review routes
	s.router.GET("/reviews/due", s.getDueCards)
	s.router.POST("/reviews", s.submitReview)

	// Card routes
	s.router.GET("/cards/:id", s.getCard)

	// Card note routes
	s.router.POST("/cards/:id/note", s.saveCardNote)
	s.router.GET("/cards/:id/note", s.getCardNote)
	s.router.DELETE("/cards/:id/note", s.deleteCardNote)
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

// Subject handlers
func (s *Server) createSubject(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Color       string `json:"color"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	subject := &models.Subject{
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
	}

	if subject.Color == "" {
		subject.Color = "#007AFF"
	}

	if err := s.storage.CreateSubject(subject); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subject"})
		return
	}

	c.JSON(http.StatusCreated, subject)
}

func (s *Server) getUserSubjects(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	subjects, err := s.storage.GetUserSubjects(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get subjects"})
		return
	}

	c.JSON(http.StatusOK, subjects)
}

func (s *Server) updateSubject(c *gin.Context) {
	subjectID := c.Param("id")

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Color       string `json:"color"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	subject := &models.Subject{
		ID:          subjectID,
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
	}

	if err := s.storage.UpdateSubject(subject); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update subject"})
		return
	}

	c.JSON(http.StatusOK, subject)
}

func (s *Server) deleteSubject(c *gin.Context) {
	subjectID := c.Param("id")

	if err := s.storage.DeleteSubject(subjectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete subject"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Subject deleted successfully"})
}

// Topic handlers
func (s *Server) createTopic(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	var req struct {
		SubjectID   string `json:"subject_id" binding:"required"`
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	topic := &models.Topic{
		SubjectID:   req.SubjectID,
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
	}

	if err := s.storage.CreateTopic(topic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create topic"})
		return
	}

	c.JSON(http.StatusCreated, topic)
}

func (s *Server) getUserTopics(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	topics, err := s.storage.GetUserTopics(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get topics"})
		return
	}

	c.JSON(http.StatusOK, topics)
}

func (s *Server) getSubjectTopics(c *gin.Context) {
	subjectID := c.Param("id")

	topics, err := s.storage.GetSubjectTopics(subjectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get topics"})
		return
	}

	c.JSON(http.StatusOK, topics)
}

func (s *Server) updateTopic(c *gin.Context) {
	topicID := c.Param("id")

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	topic := &models.Topic{
		ID:          topicID,
		Name:        req.Name,
		Description: req.Description,
	}

	if err := s.storage.UpdateTopic(topic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update topic"})
		return
	}

	c.JSON(http.StatusOK, topic)
}

func (s *Server) deleteTopic(c *gin.Context) {
	topicID := c.Param("id")

	if err := s.storage.DeleteTopic(topicID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete topic"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Topic deleted successfully"})
}

// Deck-Topic association
func (s *Server) updateDeckTopic(c *gin.Context) {
	deckID := c.Param("id")

	var req struct {
		TopicID string `json:"topic_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := s.storage.UpdateDeckTopic(deckID, req.TopicID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update deck topic"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deck topic updated successfully"})
}

// Card note handlers
func (s *Server) saveCardNote(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	cardID := c.Param("id")

	var req struct {
		Note string `json:"note" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	note := &models.CardNote{
		UserID: userID,
		CardID: cardID,
		Note:   req.Note,
	}

	if err := s.storage.SaveCardNote(note); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save note"})
		return
	}

	c.JSON(http.StatusOK, note)
}

func (s *Server) getCardNote(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	cardID := c.Param("id")

	note, err := s.storage.GetCardNote(userID, cardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get note"})
		return
	}

	if note == nil {
		c.JSON(http.StatusOK, gin.H{"note": ""})
		return
	}

	c.JSON(http.StatusOK, note)
}

func (s *Server) deleteCardNote(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	cardID := c.Param("id")

	if err := s.storage.DeleteCardNote(userID, cardID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete note"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Note deleted successfully"})
}
