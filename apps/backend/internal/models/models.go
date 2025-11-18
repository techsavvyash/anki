package models

import "time"

// User represents a user in the system
type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// Subject represents a broad category (e.g., "Languages", "Medicine")
type Subject struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Color       string    `json:"color"` // Hex color for UI
	CreatedAt   time.Time `json:"created_at"`
}

// Topic represents a specific topic within a subject (e.g., "Spanish Vocabulary", "Anatomy")
type Topic struct {
	ID          string    `json:"id"`
	SubjectID   string    `json:"subject_id"`
	UserID      string    `json:"user_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// ImportedDeck represents an imported Anki deck
type ImportedDeck struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	TopicID     *string   `json:"topic_id,omitempty"` // Optional: deck can belong to a topic
	Name        string    `json:"name"`
	Description string    `json:"description"`
	OriginalID  int64     `json:"original_id"` // Original Anki deck ID
	CardCount   int       `json:"card_count"`
	CreatedAt   time.Time `json:"created_at"`
}

// Flashcard represents a flashcard in the system
type Flashcard struct {
	ID         string    `json:"id"`
	DeckID     string    `json:"deck_id"`
	NoteID     int64     `json:"note_id"`
	Front      string    `json:"front"`
	Back       string    `json:"back"`
	OriginalID int64     `json:"original_id"` // Original Anki card ID
	CreatedAt  time.Time `json:"created_at"`
}

// ReviewLog represents a review session for a card
type ReviewLog struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	CardID     string    `json:"card_id"`
	Quality    int       `json:"quality"` // 0-5 (Anki/SM-2 quality scale)
	ReviewedAt time.Time `json:"reviewed_at"`
}

// CardSchedule represents the scheduling data for spaced repetition
type CardSchedule struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	CardID       string    `json:"card_id"`
	EaseFactor   float64   `json:"ease_factor"`   // Ease factor (starts at 2.5)
	Interval     int       `json:"interval"`      // Days until next review
	Repetitions  int       `json:"repetitions"`   // Number of consecutive correct reviews
	NextReviewAt time.Time `json:"next_review_at"`
	LastReviewAt time.Time `json:"last_review_at"`
	State        string    `json:"state"` // new, learning, review, relearning
	UpdatedAt    time.Time `json:"updated_at"`
}

// CardNote represents a custom note added by user for a card
type CardNote struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	CardID    string    `json:"card_id"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// UploadSession represents an ongoing file upload
type UploadSession struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	FileName   string    `json:"file_name"`
	FileSize   int64     `json:"file_size"`
	FilePath   string    `json:"file_path"`
	Status     string    `json:"status"` // uploading, processing, completed, failed
	Progress   float64   `json:"progress"`
	CreatedAt  time.Time `json:"created_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	Error      string    `json:"error,omitempty"`
}
