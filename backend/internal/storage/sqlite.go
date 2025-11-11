package storage

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
	"github.com/techsavvyash/anki-backend/internal/models"
)

type SQLiteStorage struct {
	db *sql.DB
}

func NewSQLiteStorage(dbPath string) (*SQLiteStorage, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	storage := &SQLiteStorage{db: db}
	if err := storage.initSchema(); err != nil {
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return storage, nil
}

func (s *SQLiteStorage) initSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		email TEXT UNIQUE NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS decks (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		name TEXT NOT NULL,
		description TEXT,
		original_id INTEGER,
		card_count INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS flashcards (
		id TEXT PRIMARY KEY,
		deck_id TEXT NOT NULL,
		note_id INTEGER,
		front TEXT NOT NULL,
		back TEXT NOT NULL,
		original_id INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (deck_id) REFERENCES decks(id)
	);

	CREATE TABLE IF NOT EXISTS card_schedules (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		card_id TEXT NOT NULL,
		ease_factor REAL DEFAULT 2.5,
		interval INTEGER DEFAULT 0,
		repetitions INTEGER DEFAULT 0,
		next_review_at DATETIME NOT NULL,
		last_review_at DATETIME NOT NULL,
		state TEXT DEFAULT 'new',
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id),
		FOREIGN KEY (card_id) REFERENCES flashcards(id),
		UNIQUE(user_id, card_id)
	);

	CREATE TABLE IF NOT EXISTS review_logs (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		card_id TEXT NOT NULL,
		quality INTEGER NOT NULL,
		reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id),
		FOREIGN KEY (card_id) REFERENCES flashcards(id)
	);

	CREATE TABLE IF NOT EXISTS upload_sessions (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		file_name TEXT NOT NULL,
		file_size INTEGER,
		file_path TEXT,
		status TEXT DEFAULT 'uploading',
		progress REAL DEFAULT 0,
		error TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		completed_at DATETIME,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

	CREATE INDEX IF NOT EXISTS idx_schedules_next_review ON card_schedules(user_id, next_review_at);
	CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON flashcards(deck_id);
	`

	_, err := s.db.Exec(schema)
	return err
}

// User operations
func (s *SQLiteStorage) CreateUser(email string) (*models.User, error) {
	user := &models.User{
		ID:        uuid.New().String(),
		Email:     email,
		CreatedAt: time.Now(),
	}

	_, err := s.db.Exec(
		"INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)",
		user.ID, user.Email, user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *SQLiteStorage) GetUser(id string) (*models.User, error) {
	user := &models.User{}
	err := s.db.QueryRow(
		"SELECT id, email, created_at FROM users WHERE id = ?", id,
	).Scan(&user.ID, &user.Email, &user.CreatedAt)

	if err != nil {
		return nil, err
	}
	return user, nil
}

// Deck operations
func (s *SQLiteStorage) CreateDeck(deck *models.ImportedDeck) error {
	deck.ID = uuid.New().String()
	deck.CreatedAt = time.Now()

	_, err := s.db.Exec(`
		INSERT INTO decks (id, user_id, name, description, original_id, card_count, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		deck.ID, deck.UserID, deck.Name, deck.Description, deck.OriginalID, deck.CardCount, deck.CreatedAt,
	)
	return err
}

func (s *SQLiteStorage) GetUserDecks(userID string) ([]models.ImportedDeck, error) {
	rows, err := s.db.Query(`
		SELECT id, user_id, name, description, original_id, card_count, created_at
		FROM decks WHERE user_id = ?
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var decks []models.ImportedDeck
	for rows.Next() {
		var deck models.ImportedDeck
		err := rows.Scan(
			&deck.ID, &deck.UserID, &deck.Name, &deck.Description,
			&deck.OriginalID, &deck.CardCount, &deck.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		decks = append(decks, deck)
	}

	return decks, rows.Err()
}

// Flashcard operations
func (s *SQLiteStorage) CreateFlashcard(card *models.Flashcard) error {
	card.ID = uuid.New().String()
	card.CreatedAt = time.Now()

	_, err := s.db.Exec(`
		INSERT INTO flashcards (id, deck_id, note_id, front, back, original_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		card.ID, card.DeckID, card.NoteID, card.Front, card.Back, card.OriginalID, card.CreatedAt,
	)
	return err
}

func (s *SQLiteStorage) GetDeckCards(deckID string) ([]models.Flashcard, error) {
	rows, err := s.db.Query(`
		SELECT id, deck_id, note_id, front, back, original_id, created_at
		FROM flashcards WHERE deck_id = ?
	`, deckID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cards []models.Flashcard
	for rows.Next() {
		var card models.Flashcard
		err := rows.Scan(
			&card.ID, &card.DeckID, &card.NoteID, &card.Front,
			&card.Back, &card.OriginalID, &card.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		cards = append(cards, card)
	}

	return cards, rows.Err()
}

// Card schedule operations
func (s *SQLiteStorage) CreateCardSchedule(schedule *models.CardSchedule) error {
	schedule.ID = uuid.New().String()

	_, err := s.db.Exec(`
		INSERT INTO card_schedules
		(id, user_id, card_id, ease_factor, interval, repetitions, next_review_at, last_review_at, state, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		schedule.ID, schedule.UserID, schedule.CardID, schedule.EaseFactor,
		schedule.Interval, schedule.Repetitions, schedule.NextReviewAt,
		schedule.LastReviewAt, schedule.State, schedule.UpdatedAt,
	)
	return err
}

func (s *SQLiteStorage) UpdateCardSchedule(schedule *models.CardSchedule) error {
	schedule.UpdatedAt = time.Now()

	_, err := s.db.Exec(`
		UPDATE card_schedules SET
			ease_factor = ?, interval = ?, repetitions = ?,
			next_review_at = ?, last_review_at = ?, state = ?, updated_at = ?
		WHERE id = ?`,
		schedule.EaseFactor, schedule.Interval, schedule.Repetitions,
		schedule.NextReviewAt, schedule.LastReviewAt, schedule.State,
		schedule.UpdatedAt, schedule.ID,
	)
	return err
}

func (s *SQLiteStorage) GetDueCards(userID string) ([]models.CardSchedule, error) {
	rows, err := s.db.Query(`
		SELECT id, user_id, card_id, ease_factor, interval, repetitions,
			   next_review_at, last_review_at, state, updated_at
		FROM card_schedules
		WHERE user_id = ? AND next_review_at <= datetime('now')
		ORDER BY next_review_at ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []models.CardSchedule
	for rows.Next() {
		var schedule models.CardSchedule
		err := rows.Scan(
			&schedule.ID, &schedule.UserID, &schedule.CardID, &schedule.EaseFactor,
			&schedule.Interval, &schedule.Repetitions, &schedule.NextReviewAt,
			&schedule.LastReviewAt, &schedule.State, &schedule.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		schedules = append(schedules, schedule)
	}

	return schedules, rows.Err()
}

func (s *SQLiteStorage) GetCardSchedule(userID, cardID string) (*models.CardSchedule, error) {
	schedule := &models.CardSchedule{}
	err := s.db.QueryRow(`
		SELECT id, user_id, card_id, ease_factor, interval, repetitions,
			   next_review_at, last_review_at, state, updated_at
		FROM card_schedules
		WHERE user_id = ? AND card_id = ?
	`, userID, cardID).Scan(
		&schedule.ID, &schedule.UserID, &schedule.CardID, &schedule.EaseFactor,
		&schedule.Interval, &schedule.Repetitions, &schedule.NextReviewAt,
		&schedule.LastReviewAt, &schedule.State, &schedule.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return schedule, nil
}

// Review log operations
func (s *SQLiteStorage) CreateReviewLog(log *models.ReviewLog) error {
	log.ID = uuid.New().String()
	log.ReviewedAt = time.Now()

	_, err := s.db.Exec(`
		INSERT INTO review_logs (id, user_id, card_id, quality, reviewed_at)
		VALUES (?, ?, ?, ?, ?)`,
		log.ID, log.UserID, log.CardID, log.Quality, log.ReviewedAt,
	)
	return err
}

func (s *SQLiteStorage) Close() error {
	return s.db.Close()
}
