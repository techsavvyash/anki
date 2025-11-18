package storage

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/techsavvyash/anki-backend/internal/models"
)

func setupTestDB(t *testing.T) *SQLiteStorage {
	storage, err := NewSQLiteStorage(":memory:")
	require.NoError(t, err)
	return storage
}

func TestCreateUser(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, err := storage.CreateUser("test@example.com")
	require.NoError(t, err)
	assert.NotEmpty(t, user.ID)
	assert.Equal(t, "test@example.com", user.Email)
	assert.NotZero(t, user.CreatedAt)
}

func TestGetUser(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	// Create user
	user, err := storage.CreateUser("test@example.com")
	require.NoError(t, err)

	// Get user
	retrievedUser, err := storage.GetUser(user.ID)
	require.NoError(t, err)
	assert.Equal(t, user.ID, retrievedUser.ID)
	assert.Equal(t, user.Email, retrievedUser.Email)
}

func TestCreateSubject(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")

	subject := &models.Subject{
		UserID:      user.ID,
		Name:        "Languages",
		Description: "Language learning",
		Color:       "#FF6B6B",
	}

	err := storage.CreateSubject(subject)
	require.NoError(t, err)
	assert.NotEmpty(t, subject.ID)
	assert.Equal(t, "Languages", subject.Name)
	assert.Equal(t, "#FF6B6B", subject.Color)
}

func TestGetUserSubjects(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")

	// Create multiple subjects
	subject1 := &models.Subject{UserID: user.ID, Name: "Languages", Color: "#FF6B6B"}
	subject2 := &models.Subject{UserID: user.ID, Name: "Medicine", Color: "#4ECDC4"}

	storage.CreateSubject(subject1)
	storage.CreateSubject(subject2)

	// Get subjects
	subjects, err := storage.GetUserSubjects(user.ID)
	require.NoError(t, err)
	assert.Len(t, subjects, 2)

	// Should be sorted by name
	names := []string{subjects[0].Name, subjects[1].Name}
	assert.Contains(t, names, "Languages")
	assert.Contains(t, names, "Medicine")
}

func TestUpdateSubject(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")

	subject := &models.Subject{UserID: user.ID, Name: "Languages", Color: "#FF6B6B"}
	storage.CreateSubject(subject)

	// Update subject
	subject.Name = "Updated Languages"
	subject.Color = "#00D9FF"
	err := storage.UpdateSubject(subject)
	require.NoError(t, err)

	// Verify update
	subjects, _ := storage.GetUserSubjects(user.ID)
	assert.Equal(t, "Updated Languages", subjects[0].Name)
	assert.Equal(t, "#00D9FF", subjects[0].Color)
}

func TestDeleteSubject(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")

	subject := &models.Subject{UserID: user.ID, Name: "Languages", Color: "#FF6B6B"}
	storage.CreateSubject(subject)

	// Delete subject
	err := storage.DeleteSubject(subject.ID)
	require.NoError(t, err)

	// Verify deletion
	subjects, _ := storage.GetUserSubjects(user.ID)
	assert.Len(t, subjects, 0)
}

func TestCreateTopic(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	subject := &models.Subject{UserID: user.ID, Name: "Languages", Color: "#FF6B6B"}
	storage.CreateSubject(subject)

	topic := &models.Topic{
		SubjectID:   subject.ID,
		UserID:      user.ID,
		Name:        "Spanish",
		Description: "Spanish language",
	}

	err := storage.CreateTopic(topic)
	require.NoError(t, err)
	assert.NotEmpty(t, topic.ID)
	assert.Equal(t, subject.ID, topic.SubjectID)
	assert.Equal(t, "Spanish", topic.Name)
}

func TestGetSubjectTopics(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	subject := &models.Subject{UserID: user.ID, Name: "Languages", Color: "#FF6B6B"}
	storage.CreateSubject(subject)

	// Create topics
	topic1 := &models.Topic{SubjectID: subject.ID, UserID: user.ID, Name: "Spanish"}
	topic2 := &models.Topic{SubjectID: subject.ID, UserID: user.ID, Name: "French"}
	storage.CreateTopic(topic1)
	storage.CreateTopic(topic2)

	// Get topics
	topics, err := storage.GetSubjectTopics(subject.ID)
	require.NoError(t, err)
	assert.Len(t, topics, 2)
}

func TestUpdateTopic(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	subject := &models.Subject{UserID: user.ID, Name: "Languages", Color: "#FF6B6B"}
	storage.CreateSubject(subject)

	topic := &models.Topic{SubjectID: subject.ID, UserID: user.ID, Name: "Spanish"}
	storage.CreateTopic(topic)

	// Update topic
	topic.Name = "Spanish (Advanced)"
	topic.Description = "Advanced Spanish"
	err := storage.UpdateTopic(topic)
	require.NoError(t, err)

	// Verify update
	topics, _ := storage.GetSubjectTopics(subject.ID)
	assert.Equal(t, "Spanish (Advanced)", topics[0].Name)
	assert.Equal(t, "Advanced Spanish", topics[0].Description)
}

func TestDeleteTopic(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	subject := &models.Subject{UserID: user.ID, Name: "Languages", Color: "#FF6B6B"}
	storage.CreateSubject(subject)

	topic := &models.Topic{SubjectID: subject.ID, UserID: user.ID, Name: "Spanish"}
	storage.CreateTopic(topic)

	// Delete topic
	err := storage.DeleteTopic(topic.ID)
	require.NoError(t, err)

	// Verify deletion
	topics, _ := storage.GetSubjectTopics(subject.ID)
	assert.Len(t, topics, 0)
}

func TestCreateDeckWithTopic(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	subject := &models.Subject{UserID: user.ID, Name: "Languages", Color: "#FF6B6B"}
	storage.CreateSubject(subject)
	topic := &models.Topic{SubjectID: subject.ID, UserID: user.ID, Name: "Spanish"}
	storage.CreateTopic(topic)

	deck := &models.ImportedDeck{
		UserID:      user.ID,
		TopicID:     &topic.ID,
		Name:        "Spanish Vocabulary",
		Description: "Common words",
		CardCount:   100,
	}

	err := storage.CreateDeck(deck)
	require.NoError(t, err)
	assert.NotEmpty(t, deck.ID)
	assert.Equal(t, &topic.ID, deck.TopicID)
}

func TestUpdateDeckTopic(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	subject := &models.Subject{UserID: user.ID, Name: "Languages", Color: "#FF6B6B"}
	storage.CreateSubject(subject)
	topic1 := &models.Topic{SubjectID: subject.ID, UserID: user.ID, Name: "Spanish"}
	topic2 := &models.Topic{SubjectID: subject.ID, UserID: user.ID, Name: "French"}
	storage.CreateTopic(topic1)
	storage.CreateTopic(topic2)

	deck := &models.ImportedDeck{UserID: user.ID, TopicID: &topic1.ID, Name: "Test Deck"}
	storage.CreateDeck(deck)

	// Change topic
	err := storage.UpdateDeckTopic(deck.ID, topic2.ID)
	require.NoError(t, err)

	// Verify update
	decks, _ := storage.GetUserDecks(user.ID)
	assert.Equal(t, &topic2.ID, decks[0].TopicID)
}

func TestSaveCardNote(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	deck := &models.ImportedDeck{UserID: user.ID, Name: "Test Deck"}
	storage.CreateDeck(deck)
	card := &models.Flashcard{DeckID: deck.ID, Front: "Front", Back: "Back"}
	storage.CreateFlashcard(card)

	note := &models.CardNote{
		UserID: user.ID,
		CardID: card.ID,
		Note:   "This is my note",
	}

	err := storage.SaveCardNote(note)
	require.NoError(t, err)
	assert.NotEmpty(t, note.ID)
	assert.NotZero(t, note.CreatedAt)
	assert.NotZero(t, note.UpdatedAt)
}

func TestGetCardNote(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	deck := &models.ImportedDeck{UserID: user.ID, Name: "Test Deck"}
	storage.CreateDeck(deck)
	card := &models.Flashcard{DeckID: deck.ID, Front: "Front", Back: "Back"}
	storage.CreateFlashcard(card)

	note := &models.CardNote{UserID: user.ID, CardID: card.ID, Note: "Test note"}
	storage.SaveCardNote(note)

	// Get note
	retrievedNote, err := storage.GetCardNote(user.ID, card.ID)
	require.NoError(t, err)
	assert.NotNil(t, retrievedNote)
	assert.Equal(t, "Test note", retrievedNote.Note)
}

func TestGetCardNoteNonExistent(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")

	// Get note that doesn't exist
	note, err := storage.GetCardNote(user.ID, "nonexistent-card-id")
	require.NoError(t, err)
	assert.Nil(t, note) // Should return nil, not error
}

func TestUpdateCardNote(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	deck := &models.ImportedDeck{UserID: user.ID, Name: "Test Deck"}
	storage.CreateDeck(deck)
	card := &models.Flashcard{DeckID: deck.ID, Front: "Front", Back: "Back"}
	storage.CreateFlashcard(card)

	// Create note
	note := &models.CardNote{UserID: user.ID, CardID: card.ID, Note: "Original note"}
	storage.SaveCardNote(note)
	originalUpdatedAt := note.UpdatedAt

	// Wait a bit to ensure timestamp changes
	time.Sleep(10 * time.Millisecond)

	// Update note
	note.Note = "Updated note"
	err := storage.SaveCardNote(note)
	require.NoError(t, err)

	// Verify update
	retrievedNote, _ := storage.GetCardNote(user.ID, card.ID)
	assert.Equal(t, "Updated note", retrievedNote.Note)
	assert.True(t, retrievedNote.UpdatedAt.After(originalUpdatedAt))
}

func TestDeleteCardNote(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	deck := &models.ImportedDeck{UserID: user.ID, Name: "Test Deck"}
	storage.CreateDeck(deck)
	card := &models.Flashcard{DeckID: deck.ID, Front: "Front", Back: "Back"}
	storage.CreateFlashcard(card)

	note := &models.CardNote{UserID: user.ID, CardID: card.ID, Note: "Test note"}
	storage.SaveCardNote(note)

	// Delete note
	err := storage.DeleteCardNote(user.ID, card.ID)
	require.NoError(t, err)

	// Verify deletion
	retrievedNote, _ := storage.GetCardNote(user.ID, card.ID)
	assert.Nil(t, retrievedNote)
}

func TestCreateCardSchedule(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	deck := &models.ImportedDeck{UserID: user.ID, Name: "Test Deck"}
	storage.CreateDeck(deck)
	card := &models.Flashcard{DeckID: deck.ID, Front: "Front", Back: "Back"}
	storage.CreateFlashcard(card)

	now := time.Now()
	schedule := &models.CardSchedule{
		UserID:       user.ID,
		CardID:       card.ID,
		EaseFactor:   2.5,
		Interval:     0,
		Repetitions:  0,
		NextReviewAt: now,
		LastReviewAt: now,
		State:        "new",
		UpdatedAt:    now,
	}

	err := storage.CreateCardSchedule(schedule)
	require.NoError(t, err)
	assert.NotEmpty(t, schedule.ID)
}

func TestGetDueCards(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	deck := &models.ImportedDeck{UserID: user.ID, Name: "Test Deck"}
	storage.CreateDeck(deck)
	card1 := &models.Flashcard{DeckID: deck.ID, Front: "Front1", Back: "Back1"}
	card2 := &models.Flashcard{DeckID: deck.ID, Front: "Front2", Back: "Back2"}
	storage.CreateFlashcard(card1)
	storage.CreateFlashcard(card2)

	// Create schedules - one due, one not due
	now := time.Now()
	schedule1 := &models.CardSchedule{
		UserID:       user.ID,
		CardID:       card1.ID,
		EaseFactor:   2.5,
		Interval:     0,
		Repetitions:  0,
		NextReviewAt: now.Add(-1 * time.Hour), // Due
		LastReviewAt: now,
		State:        "new",
		UpdatedAt:    now,
	}
	schedule2 := &models.CardSchedule{
		UserID:       user.ID,
		CardID:       card2.ID,
		EaseFactor:   2.5,
		Interval:     0,
		Repetitions:  0,
		NextReviewAt: now.Add(24 * time.Hour), // Not due
		LastReviewAt: now,
		State:        "new",
		UpdatedAt:    now,
	}

	storage.CreateCardSchedule(schedule1)
	storage.CreateCardSchedule(schedule2)

	// Get due cards
	dueCards, err := storage.GetDueCards(user.ID)
	require.NoError(t, err)
	assert.Len(t, dueCards, 1)
	assert.Equal(t, card1.ID, dueCards[0].CardID)
}

func TestUpdateCardSchedule(t *testing.T) {
	storage := setupTestDB(t)
	defer storage.Close()

	user, _ := storage.CreateUser("test@example.com")
	deck := &models.ImportedDeck{UserID: user.ID, Name: "Test Deck"}
	storage.CreateDeck(deck)
	card := &models.Flashcard{DeckID: deck.ID, Front: "Front", Back: "Back"}
	storage.CreateFlashcard(card)

	now := time.Now()
	schedule := &models.CardSchedule{
		UserID:       user.ID,
		CardID:       card.ID,
		EaseFactor:   2.5,
		Interval:     0,
		Repetitions:  0,
		NextReviewAt: now,
		LastReviewAt: now,
		State:        "new",
		UpdatedAt:    now,
	}
	storage.CreateCardSchedule(schedule)

	// Update schedule
	schedule.Interval = 1
	schedule.Repetitions = 1
	schedule.State = "learning"
	err := storage.UpdateCardSchedule(schedule)
	require.NoError(t, err)

	// Verify update
	retrievedSchedule, _ := storage.GetCardSchedule(user.ID, card.ID)
	assert.Equal(t, 1, retrievedSchedule.Interval)
	assert.Equal(t, 1, retrievedSchedule.Repetitions)
	assert.Equal(t, "learning", retrievedSchedule.State)
}
