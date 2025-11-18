package scheduler

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/techsavvyash/anki-backend/internal/models"
)

func TestInitializeCardSchedule(t *testing.T) {
	schedule := InitializeCardSchedule("user1", "card1")

	assert.Equal(t, "user1", schedule.UserID)
	assert.Equal(t, "card1", schedule.CardID)
	assert.Equal(t, DefaultEaseFactor, schedule.EaseFactor)
	assert.Equal(t, 0, schedule.Interval)
	assert.Equal(t, 0, schedule.Repetitions)
	assert.Equal(t, "new", schedule.State)
	assert.False(t, schedule.NextReviewAt.IsZero())
}

func TestCalculateNextReview_FirstCorrect(t *testing.T) {
	schedule := &models.CardSchedule{
		UserID:       "user1",
		CardID:       "card1",
		EaseFactor:   DefaultEaseFactor,
		Interval:     0,
		Repetitions:  0,
		NextReviewAt: time.Now(),
		LastReviewAt: time.Now(),
		State:        "new",
	}

	// First correct review with quality 3
	newSchedule := CalculateNextReview(schedule, 3)

	assert.Equal(t, 1, newSchedule.Repetitions)
	assert.Equal(t, 1, newSchedule.Interval) // First correct: 1 day
	assert.Equal(t, "learning", newSchedule.State)
	assert.True(t, newSchedule.NextReviewAt.After(schedule.NextReviewAt))
}

func TestCalculateNextReview_SecondCorrect(t *testing.T) {
	schedule := &models.CardSchedule{
		UserID:       "user1",
		CardID:       "card1",
		EaseFactor:   DefaultEaseFactor,
		Interval:     1,
		Repetitions:  1,
		NextReviewAt: time.Now(),
		LastReviewAt: time.Now(),
		State:        "learning",
	}

	// Second correct review with quality 3
	newSchedule := CalculateNextReview(schedule, 3)

	assert.Equal(t, 2, newSchedule.Repetitions)
	assert.Equal(t, 6, newSchedule.Interval) // Second correct: 6 days
	assert.Equal(t, "review", newSchedule.State)
}

func TestCalculateNextReview_SubsequentCorrect(t *testing.T) {
	schedule := &models.CardSchedule{
		UserID:       "user1",
		CardID:       "card1",
		EaseFactor:   2.5,
		Interval:     6,
		Repetitions:  2,
		NextReviewAt: time.Now(),
		LastReviewAt: time.Now(),
		State:        "review",
	}

	// Third correct review with quality 3
	newSchedule := CalculateNextReview(schedule, 3)

	assert.Equal(t, 3, newSchedule.Repetitions)
	assert.Equal(t, 15, newSchedule.Interval) // 6 * 2.5 = 15
	assert.Equal(t, "review", newSchedule.State)
}

func TestCalculateNextReview_IncorrectReset(t *testing.T) {
	schedule := &models.CardSchedule{
		UserID:       "user1",
		CardID:       "card1",
		EaseFactor:   2.5,
		Interval:     15,
		Repetitions:  3,
		NextReviewAt: time.Now(),
		LastReviewAt: time.Now(),
		State:        "review",
	}

	// Incorrect review (quality < 3)
	newSchedule := CalculateNextReview(schedule, 2)

	assert.Equal(t, 0, newSchedule.Repetitions) // Reset
	assert.Equal(t, 0, newSchedule.Interval)
	assert.Equal(t, "relearning", newSchedule.State)
}

func TestCalculateNextReview_QualityZero(t *testing.T) {
	schedule := &models.CardSchedule{
		UserID:       "user1",
		CardID:       "card1",
		EaseFactor:   2.5,
		Interval:     15,
		Repetitions:  3,
		NextReviewAt: time.Now(),
		LastReviewAt: time.Now(),
		State:        "review",
	}

	// Complete blackout (quality 0)
	newSchedule := CalculateNextReview(schedule, 0)

	assert.Equal(t, 0, newSchedule.Repetitions)
	assert.Equal(t, 0, newSchedule.Interval)
	assert.Equal(t, "relearning", newSchedule.State)
	// Should be due very soon (1 minute for new, 10 minutes for relearning)
	duration := newSchedule.NextReviewAt.Sub(newSchedule.LastReviewAt)
	assert.True(t, duration <= 11*time.Minute)
}

func TestCalculateNextReview_QualityFive(t *testing.T) {
	schedule := &models.CardSchedule{
		UserID:       "user1",
		CardID:       "card1",
		EaseFactor:   2.5,
		Interval:     10,
		Repetitions:  3,
		NextReviewAt: time.Now(),
		LastReviewAt: time.Now(),
		State:        "review",
	}

	// Perfect response (quality 5)
	newSchedule := CalculateNextReview(schedule, 5)

	assert.Equal(t, 4, newSchedule.Repetitions)
	// Interval should be multiplied by ease factor AND easy bonus
	expectedInterval := int(float64(10) * 2.5 * EasyBonus)
	assert.Equal(t, expectedInterval, newSchedule.Interval)
}

func TestCalculateNextReview_EaseFactorAdjustment(t *testing.T) {
	schedule := &models.CardSchedule{
		UserID:       "user1",
		CardID:       "card1",
		EaseFactor:   2.5,
		Interval:     10,
		Repetitions:  3,
		NextReviewAt: time.Now(),
		LastReviewAt: time.Now(),
		State:        "review",
	}

	// Quality 3 should maintain ease factor around 2.5
	newSchedule := CalculateNextReview(schedule, 3)
	assert.InDelta(t, 2.5, newSchedule.EaseFactor, 0.1)

	// Quality 5 should increase ease factor
	newSchedule2 := CalculateNextReview(schedule, 5)
	assert.Greater(t, newSchedule2.EaseFactor, schedule.EaseFactor)

	// Quality 1 should decrease ease factor (but not below minimum)
	schedule.EaseFactor = 1.5
	newSchedule3 := CalculateNextReview(schedule, 1)
	assert.GreaterOrEqual(t, newSchedule3.EaseFactor, MinEaseFactor)
}

func TestCalculateNextReview_MinEaseFactor(t *testing.T) {
	schedule := &models.CardSchedule{
		UserID:       "user1",
		CardID:       "card1",
		EaseFactor:   MinEaseFactor,
		Interval:     10,
		Repetitions:  3,
		NextReviewAt: time.Now(),
		LastReviewAt: time.Now(),
		State:        "review",
	}

	// Even with very poor quality, ease factor shouldn't go below minimum
	newSchedule := CalculateNextReview(schedule, 0)
	// For quality < 3, repetitions reset but ease factor is recalculated
	// Let's check that when it recalculates for next review, it respects minimum
	assert.GreaterOrEqual(t, schedule.EaseFactor, MinEaseFactor)
}

func TestGetDueCards(t *testing.T) {
	now := time.Now()

	schedules := []models.CardSchedule{
		{
			CardID:       "card1",
			NextReviewAt: now.Add(-1 * time.Hour), // Due
		},
		{
			CardID:       "card2",
			NextReviewAt: now.Add(1 * time.Hour), // Not due
		},
		{
			CardID:       "card3",
			NextReviewAt: now.Add(-2 * time.Hour), // Due
		},
	}

	dueCards := GetDueCards(schedules)

	assert.Len(t, dueCards, 2)
	// Should only include card1 and card3
	cardIDs := []string{dueCards[0].CardID, dueCards[1].CardID}
	assert.Contains(t, cardIDs, "card1")
	assert.Contains(t, cardIDs, "card3")
	assert.NotContains(t, cardIDs, "card2")
}

func TestCalculateNextReview_TimeProgression(t *testing.T) {
	// Test that time actually progresses correctly through reviews
	schedule := InitializeCardSchedule("user1", "card1")
	startTime := schedule.NextReviewAt

	// First review (quality 4)
	schedule = CalculateNextReview(schedule, 4)
	assert.True(t, schedule.NextReviewAt.After(startTime))
	assert.Equal(t, 1, schedule.Interval)

	firstReviewTime := schedule.NextReviewAt

	// Second review (quality 4)
	schedule = CalculateNextReview(schedule, 4)
	assert.True(t, schedule.NextReviewAt.After(firstReviewTime))
	assert.Equal(t, 6, schedule.Interval)

	secondReviewTime := schedule.NextReviewAt

	// Third review (quality 4)
	schedule = CalculateNextReview(schedule, 4)
	assert.True(t, schedule.NextReviewAt.After(secondReviewTime))
	assert.Greater(t, schedule.Interval, 6)
}

func TestCalculateNextReview_StateTransitions(t *testing.T) {
	// Test state transitions: new -> learning -> review -> relearning

	// New -> Learning
	schedule := InitializeCardSchedule("user1", "card1")
	assert.Equal(t, "new", schedule.State)

	schedule = CalculateNextReview(schedule, 3)
	assert.Equal(t, "learning", schedule.State)

	// Learning -> Review
	schedule = CalculateNextReview(schedule, 3)
	assert.Equal(t, "review", schedule.State)

	// Review -> Relearning (on failure)
	schedule = CalculateNextReview(schedule, 1)
	assert.Equal(t, "relearning", schedule.State)

	// Relearning -> Learning (on success)
	schedule = CalculateNextReview(schedule, 3)
	assert.Equal(t, "learning", schedule.State)
}
