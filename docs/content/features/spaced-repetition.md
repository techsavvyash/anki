---
title: Spaced Repetition Algorithm
---

# Spaced Repetition System (SM-2)

The Anki Flashcard app uses the **SuperMemo 2 (SM-2)** algorithm, a scientifically proven method for optimizing learning through spaced repetition.

## What is Spaced Repetition?

Spaced repetition is a learning technique that involves reviewing information at increasing intervals. The core principle is simple:

> **Review information just before you're about to forget it**

This maximizes retention while minimizing study time.

## The SM-2 Algorithm

### History

Developed by Piotr Woźniak in 1987 for the SuperMemo software, SM-2 has become the gold standard for spaced repetition algorithms.

### How It Works

The algorithm calculates the optimal time to review each card based on:

1. **Quality of recall** - How well you remembered the answer
2. **Previous performance** - Your history with this card
3. **Ease factor** - How "easy" this card is for you

## Core Concepts

### 1. Quality Rating (0-5)

After reviewing a card, you rate how well you recalled it:

| Rating | Meaning | Description |
|--------|---------|-------------|
| **0** | Complete blackout | No recall at all |
| **1** | Incorrect | Wrong answer, with partial recall |
| **2** | Incorrect (easy) | Wrong, but easy to remember now |
| **3** | Correct (hard) | Correct with serious difficulty |
| **4** | Correct (good) | Correct with some hesitation |
| **5** | Perfect | Perfect recall, no hesitation |

**Threshold**: Quality ≥ 3 is considered a "correct" response.

### 2. Ease Factor (E-Factor)

The ease factor determines how quickly intervals increase for a card.

**Initial Value**: 2.5

**Adjustment Formula**:
```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
```

Where:
- `EF'` = New ease factor
- `EF` = Current ease factor
- `q` = Quality rating (0-5)

**Constraints**:
- Minimum: 1.3
- No maximum (but typically stays between 1.3-2.5)

**Effect**:
- Quality 5: EF increases (card becomes easier)
- Quality 4: EF stays roughly the same
- Quality 3: EF decreases slightly
- Quality < 3: EF decreases significantly

### 3. Intervals

The time between reviews increases with each successful recall:

**First Correct Review** (n=1, q≥3):
- Interval: **1 day**
- State: New → Learning

**Second Correct Review** (n=2, q≥3):
- Interval: **6 days**
- State: Learning → Review

**Subsequent Reviews** (n>2, q≥3):
- Interval: `I(n) = I(n-1) × EF`
- State: Review (continues)

**Failed Review** (q<3):
- Interval: **0 days** (immediate re-study)
- Repetitions reset to 0
- State: Review → Relearning

## Card States

### New
- Never reviewed
- Waiting for first study session
- Interval: 0 days

### Learning
- First correct review completed
- Building initial memory
- Interval: 1 day

### Review
- Two or more correct reviews
- Long-term retention phase
- Interval: 6+ days (exponentially increasing)

### Relearning
- Failed a review (quality < 3)
- Reset to beginning
- Interval: 0 days

**State Diagram**:
```
New ──(q≥3)──> Learning ──(q≥3)──> Review ──(q≥3)──> Review
 │                │                    │
 │                │                    │
 │                └──(q<3)──> Relearning
 │                                     │
 └──────────────(q<3)──────────────────┘
```

## Algorithm Implementation

### Pseudocode

```python
def calculate_next_review(schedule, quality):
    # Update repetitions
    if quality >= 3:
        schedule.repetitions += 1
    else:
        schedule.repetitions = 0
        schedule.state = "relearning"

    # Calculate interval
    if schedule.repetitions == 0:
        interval = 0
    elif schedule.repetitions == 1:
        interval = 1
        schedule.state = "learning"
    elif schedule.repetitions == 2:
        interval = 6
        schedule.state = "review"
    else:
        interval = schedule.interval * schedule.ease_factor
        schedule.state = "review"

    # Update ease factor
    schedule.ease_factor = max(1.3,
        schedule.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    )

    # Calculate next review date
    schedule.next_review_at = now() + days(interval)

    return schedule
```

### Go Implementation

See `backend/internal/scheduler/sm2.go`:

```go
func CalculateNextReview(schedule *models.CardSchedule, quality int) *models.CardSchedule {
    newSchedule := &models.CardSchedule{
        UserID:       schedule.UserID,
        CardID:       schedule.CardID,
        EaseFactor:   schedule.EaseFactor,
        Interval:     schedule.Interval,
        Repetitions:  schedule.Repetitions,
        LastReviewAt: time.Now(),
        State:        schedule.State,
    }

    // Update repetitions
    if quality >= 3 {
        newSchedule.Repetitions++
    } else {
        newSchedule.Repetitions = 0
        newSchedule.State = "relearning"
    }

    // Calculate interval
    if newSchedule.Repetitions == 0 {
        newSchedule.Interval = 0
    } else if newSchedule.Repetitions == 1 {
        newSchedule.Interval = 1
        newSchedule.State = "learning"
    } else if newSchedule.Repetitions == 2 {
        newSchedule.Interval = 6
        newSchedule.State = "review"
    } else {
        newSchedule.Interval = int(float64(newSchedule.Interval) * newSchedule.EaseFactor)
        newSchedule.State = "review"
    }

    // Update ease factor
    newSchedule.EaseFactor = math.Max(
        MinEaseFactor,
        newSchedule.EaseFactor + (0.1 - float64(5-quality)*(0.08+float64(5-quality)*0.02)),
    )

    // Set next review date
    newSchedule.NextReviewAt = time.Now().Add(time.Duration(newSchedule.Interval) * 24 * time.Hour)

    return newSchedule
}
```

## Examples

### Example 1: Perfect Recall Path

**Card**: "What is the capital of France?"

| Review | Quality | Repetitions | Interval | EF | Next Review |
|--------|---------|-------------|----------|-----|-------------|
| 1 | 5 | 1 | 1 day | 2.6 | Tomorrow |
| 2 | 5 | 2 | 6 days | 2.7 | In 6 days |
| 3 | 5 | 3 | 16 days | 2.8 | In 16 days |
| 4 | 5 | 4 | 45 days | 2.9 | In 45 days |

**Result**: Card intervals grow rapidly with perfect recall.

### Example 2: Difficult Card

**Card**: "Translate: 'Although' in Spanish"

| Review | Quality | Repetitions | Interval | EF | Next Review |
|--------|---------|-------------|----------|-----|-------------|
| 1 | 3 | 1 | 1 day | 2.36 | Tomorrow |
| 2 | 2 | 0 | 0 days | 1.96 | Today |
| 3 | 3 | 1 | 1 day | 1.82 | Tomorrow |
| 4 | 4 | 2 | 6 days | 1.92 | In 6 days |
| 5 | 4 | 3 | 12 days | 2.02 | In 12 days |

**Result**: Difficult cards have shorter intervals and are reviewed more frequently.

### Example 3: Forgotten Card

**Card**: "Who wrote 'Hamlet'?"

| Review | Quality | Repetitions | Interval | EF | Next Review |
|--------|---------|-------------|----------|-----|-------------|
| 1 | 4 | 1 | 1 day | 2.5 | Tomorrow |
| 2 | 4 | 2 | 6 days | 2.5 | In 6 days |
| 3 | 5 | 3 | 15 days | 2.6 | In 15 days |
| 4 | 0 | 0 | 0 days | 1.7 | Today |
| 5 | 3 | 1 | 1 day | 1.56 | Tomorrow |

**Result**: Forgotten cards reset but retain a lower ease factor.

## Benefits of SM-2

### 1. Efficient Learning
- Study cards just before forgetting
- Minimize wasted reviews
- Maximize long-term retention

### 2. Personalized
- Adapts to individual card difficulty
- Adjusts based on your performance
- Different intervals for different cards

### 3. Proven Effectiveness
- Used by millions of learners
- 35+ years of research
- Scientific basis in memory research

### 4. Long-term Retention
- Intervals can extend to months/years
- Cards move to long-term memory
- Minimal maintenance reviews

## Best Practices

### 1. Be Honest with Ratings

**Don't**:
- Rate 5 when you hesitated
- Rate 3 when you didn't know

**Do**:
- Use the full 0-5 scale
- Be consistent with ratings
- Rate based on actual recall speed

### 2. Review Consistently

- Check for due cards daily
- Don't skip reviews
- Consistency > Marathon sessions

### 3. Keep Cards Simple

- One fact per card
- Clear, concise questions
- Avoid ambiguity

### 4. Use Custom Notes

- Add mnemonics for difficult cards
- Link to related concepts
- Record learning insights

## Advanced Topics

### Retention Rate

**Formula**:
```
Retention = (Correct Reviews) / (Total Reviews) × 100%
```

**Target**: 80-90% retention
- Below 80%: Cards too difficult or intervals too long
- Above 95%: Intervals too conservative, wasting time

### Interval Modification

The algorithm can be tuned by adjusting:

1. **Initial Intervals**: Default is 1, 6 days
2. **Ease Factor Range**: Default min is 1.3
3. **Ease Adjustment**: Default formula can be modified

### Forgetting Curve

The algorithm models the **Ebbinghaus Forgetting Curve**:

```
R(t) = e^(-t/S)
```

Where:
- `R(t)` = Retention at time t
- `S` = Strength of memory (related to EF)
- `t` = Time since learning

### Future Enhancements

**Planned improvements**:
- SM-3+ algorithms
- Machine learning optimization
- Group learning adjustments
- Time-of-day scheduling

## Research and References

**Original Paper**:
- Woźniak, P. (1990). "Optimization of learning"

**Further Reading**:
- [SuperMemo Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Anki Manual](https://docs.ankiweb.net/studying.html)
- [Spaced Repetition Research](https://www.gwern.net/Spaced-repetition)

## Testing

The SM-2 implementation is thoroughly tested. See [[../testing/index|Testing Guide]].

**Test Coverage**:
- All quality ratings (0-5)
- State transitions
- Ease factor adjustments
- Interval calculations
- Edge cases

**Example Test**:
```go
func TestCalculateNextReview_FirstCorrect(t *testing.T) {
    schedule := &models.CardSchedule{
        EaseFactor:  DefaultEaseFactor,
        Interval:    0,
        Repetitions: 0,
        State:       "new",
    }

    newSchedule := CalculateNextReview(schedule, 3)

    assert.Equal(t, 1, newSchedule.Repetitions)
    assert.Equal(t, 1, newSchedule.Interval)
    assert.Equal(t, "learning", newSchedule.State)
}
```

## Related Documentation

- [[../architecture/index|Architecture Overview]]
- [[../api/index|API Reference]]
- [[../testing/index|Testing Guide]]
- [[index|Features Overview]]
