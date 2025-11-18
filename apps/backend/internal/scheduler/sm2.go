package scheduler

import (
	"math"
	"time"

	"github.com/techsavvyash/anki-backend/internal/models"
)

// SM2 implements the SuperMemo 2 (SM-2) spaced repetition algorithm
// This is the algorithm originally used by Anki (with some modifications)

const (
	MinEaseFactor     = 1.3
	DefaultEaseFactor = 2.5
	EasyBonus         = 1.3
	IntervalModifier  = 1.0
)

// CalculateNextReview calculates the next review schedule based on SM-2
// quality: 0-5 scale
//   0: Complete blackout
//   1: Incorrect response, but correct one remembered
//   2: Incorrect response, correct one seemed easy to recall
//   3: Correct response, but with difficulty
//   4: Correct response, with some hesitation
//   5: Perfect response
func CalculateNextReview(schedule *models.CardSchedule, quality int) *models.CardSchedule {
	now := time.Now()

	// Clone the schedule to avoid modifying the original
	newSchedule := *schedule
	newSchedule.LastReviewAt = now

	// Quality < 3 means the card was recalled incorrectly
	if quality < 3 {
		// Reset to beginning
		newSchedule.Repetitions = 0
		newSchedule.Interval = 0
		newSchedule.State = "relearning"
		// Review again in 1 minute for learning, or 10 minutes for relearning
		if schedule.State == "new" {
			newSchedule.NextReviewAt = now.Add(1 * time.Minute)
		} else {
			newSchedule.NextReviewAt = now.Add(10 * time.Minute)
		}
	} else {
		// Card was recalled correctly
		newSchedule.Repetitions++

		// Update ease factor
		// EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
		easeDelta := 0.1 - float64(5-quality)*(0.08+float64(5-quality)*0.02)
		newSchedule.EaseFactor += easeDelta

		// Ensure ease factor doesn't go below minimum
		if newSchedule.EaseFactor < MinEaseFactor {
			newSchedule.EaseFactor = MinEaseFactor
		}

		// Calculate interval based on repetition count
		switch newSchedule.Repetitions {
		case 1:
			// First correct review: 1 day
			newSchedule.Interval = 1
			newSchedule.State = "learning"
		case 2:
			// Second correct review: 6 days
			newSchedule.Interval = 6
			newSchedule.State = "review"
		default:
			// Subsequent reviews: multiply previous interval by ease factor
			newSchedule.Interval = int(math.Round(float64(schedule.Interval) * newSchedule.EaseFactor * IntervalModifier))
			newSchedule.State = "review"
		}

		// Apply easy bonus if quality is 5
		if quality == 5 {
			newSchedule.Interval = int(math.Round(float64(newSchedule.Interval) * EasyBonus))
		}

		// Set next review time
		newSchedule.NextReviewAt = now.Add(time.Duration(newSchedule.Interval) * 24 * time.Hour)
	}

	newSchedule.UpdatedAt = now
	return &newSchedule
}

// GetDueCards returns cards that are due for review
func GetDueCards(schedules []models.CardSchedule) []models.CardSchedule {
	now := time.Now()
	var dueCards []models.CardSchedule

	for _, schedule := range schedules {
		if schedule.NextReviewAt.Before(now) || schedule.NextReviewAt.Equal(now) {
			dueCards = append(dueCards, schedule)
		}
	}

	return dueCards
}

// InitializeCardSchedule creates initial scheduling data for a new card
func InitializeCardSchedule(userID, cardID string) *models.CardSchedule {
	now := time.Now()
	return &models.CardSchedule{
		UserID:       userID,
		CardID:       cardID,
		EaseFactor:   DefaultEaseFactor,
		Interval:     0,
		Repetitions:  0,
		NextReviewAt: now, // Available for immediate review
		LastReviewAt: now,
		State:        "new",
		UpdatedAt:    now,
	}
}
