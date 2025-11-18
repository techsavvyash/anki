# @anki/types

Shared TypeScript types for the Anki monorepo.

## Usage

```typescript
import { User, Deck, Flashcard, CardSchedule } from '@anki/types';
```

## Types

- **User**: User account information
- **Subject**: Top-level organization unit
- **Topic**: Mid-level organization unit (belongs to Subject)
- **Deck**: Collection of flashcards (belongs to Topic)
- **Flashcard**: Individual flashcard with front/back
- **CardNote**: Custom user notes for cards
- **CardSchedule**: Spaced repetition schedule data
- **ReviewLog**: History of card reviews
- **CardState**: Type for card state ('new' | 'learning' | 'review' | 'relearning')
