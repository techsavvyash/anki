---
title: Features
---

# Features Overview

The Anki Flashcard application provides a comprehensive set of features for effective flashcard learning with modern UX and powerful organization tools.

## Core Features

### 📱 Cross-Platform Mobile App

- **iOS Native Support**: Optimized for iPhone and iPad
- **Responsive Design**: Adapts to all screen sizes
- **Offline-First**: Study without internet connection
- **Native Performance**: Fast, smooth interactions

### 📚 Large File Support

- **Upload Huge Decks**: Process .apkg files up to 800MB+
- **Chunked Uploads**: Resume interrupted uploads
- **Progress Tracking**: Real-time upload progress
- **Memory Efficient**: Stream processing for large files

**Technical Details**: [[large-file-support|Large File Support]]

### 🧠 Spaced Repetition

- **SM-2 Algorithm**: Scientifically proven learning intervals
- **Quality Ratings**: 0-5 scale for accurate tracking
- **State Management**: New → Learning → Review → Relearning
- **Optimal Scheduling**: Cards appear when you need to review them

**Learn More**: [[spaced-repetition|Spaced Repetition System]]

### 🗂️ Hierarchical Organization

Organize your learning materials with a three-tier system:

```
Subject (e.g., "Languages")
  └── Topic (e.g., "Spanish")
      └── Deck (e.g., "Spanish 1000 Most Common Words")
```

**Features**:
- Color-coded subjects for visual organization
- Filter and browse by hierarchy
- Quick navigation between levels
- Bulk operations on topics

**Details**: [[organization|Organization System]]

### ✍️ Custom Notes

- **Personal Annotations**: Add notes to any card
- **Persistent**: Notes saved across reviews
- **Quick Edit**: Add notes during study session
- **Markdown Support**: Rich text formatting (planned)
- **Search**: Find cards by note content

**Guide**: [[custom-notes|Custom Notes Feature]]

### 📊 iPad Optimization

Full optimization for iPad with responsive layouts:

- **Multi-Column Grids**: 2 columns (portrait), 3 columns (landscape)
- **Landscape Support**: Full landscape mode with adapted UI
- **Larger Touch Targets**: Easier interaction on tablets
- **Adaptive Spacing**: Increased padding and margins
- **Responsive Typography**: 1.2x font scaling for readability
- **Orientation Detection**: Seamless transitions

**Technical**: [[ipad-optimization|iPad Optimization]]

### 🔍 Search & Discovery

- **Full-Text Search**: Search cards, decks, and notes
- **Filter by Tags**: Organize with custom tags
- **Recent Decks**: Quick access to frequently used decks
- **Due Count**: See cards due today
- **Progress Stats**: Track learning progress

### 📈 Statistics & Analytics

- **Review History**: Complete log of all reviews
- **Performance Metrics**: Success rates, streak tracking
- **Time Statistics**: Time spent studying per deck
- **Calendar View**: Visual heatmap of study sessions (planned)
- **Forecast**: Predict future review load (planned)

**Guide**: [[statistics|Statistics & Analytics]]

### 🎨 Customization

- **Dark Mode**: Comfortable studying in low light
- **Custom Colors**: Assign colors to subjects
- **Font Scaling**: Adjust text size
- **Card Templates**: Customize card display (planned)
- **Themes**: Multiple color schemes (planned)

### 🔄 Data Management

- **Import .apkg**: Standard Anki package format
- **Export Data**: Backup your progress (planned)
- **Sync**: Cloud sync across devices (planned)
- **Bulk Operations**: Manage multiple decks at once

## Feature Details

### Deck Management

**View Deck Details**:
- Card count and statistics
- Last studied date
- Cards due today
- Progress percentage

**Deck Actions**:
- Rename deck
- Delete deck
- Assign to topic
- Export deck (planned)

### Card Review Interface

**During Review**:
1. View card front (question)
2. Think about the answer
3. Reveal card back (answer)
4. Rate your knowledge (0-5)
5. Add custom notes (optional)
6. Move to next card

**Quality Ratings**:
- **0**: Complete blackout - no recall
- **1**: Incorrect - with partial recall
- **2**: Incorrect - but easy to remember
- **3**: Correct - with difficulty
- **4**: Correct - with hesitation
- **5**: Perfect recall - easy

**Keyboard Shortcuts** (planned):
- Space: Reveal answer
- 0-5: Rate card
- N: Add note
- S: Skip card

### Organization Features

**Subjects**:
- Create unlimited subjects
- Assign custom colors
- Edit name and description
- View all topics in subject
- Delete subject (cascade or reassign)

**Topics**:
- Create topics within subjects
- Assign multiple decks
- View combined statistics
- Bulk review all topic cards
- Reorder topics

**Decks**:
- Optional topic assignment
- Unassigned decks in root
- Move between topics
- Clone decks (planned)

### Custom Notes System

**Add Notes**:
1. During review, tap "Add Note"
2. Enter your note
3. Save - note persists with card
4. View/edit on future reviews

**Use Cases**:
- Mnemonics to remember answers
- Additional context or examples
- Links to related concepts
- Personal reminders

**Search Notes**: Find cards by note content

### File Upload Process

**Step-by-Step**:
1. Tap "Import Deck"
2. Select .apkg file from device
3. File is chunked (5MB pieces)
4. Chunks uploaded with progress
5. Backend assembles and validates
6. SQLite database extracted
7. Cards imported to main database
8. Media files processed
9. Deck appears in list

**Supported**:
- ✅ .apkg files (Anki package)
- ✅ Large files (800MB+)
- ✅ Progress tracking
- ✅ Resume on failure

**Planned**:
- 🔲 .apkg export
- 🔲 .csv import
- 🔲 Shared deck downloads

## Advanced Features

### SM-2 Algorithm Details

The app uses the **SuperMemo 2 (SM-2)** algorithm with these parameters:

**Initial Values**:
- Ease Factor: 2.5
- Interval: 0 days
- Repetitions: 0

**On First Correct Review** (quality ≥ 3):
- Interval: 1 day
- State: Learning

**On Second Correct Review**:
- Interval: 6 days
- State: Review

**Subsequent Reviews**:
- Interval = Previous Interval × Ease Factor
- Ease Factor adjusted by quality
- Minimum Ease Factor: 1.3

**On Incorrect Review** (quality < 3):
- State: Relearning
- Interval: 0 days
- Repetitions: 0

**Learn More**: [[spaced-repetition|Spaced Repetition Deep Dive]]

### Performance Optimizations

**Backend**:
- Database indexes on foreign keys
- Prepared statements for queries
- Connection pooling
- Gzip compression
- Chunked file processing

**Frontend**:
- Virtual scrolling for long lists
- Image lazy loading
- Debounced search
- Cached API responses
- Optimized re-renders

### Offline Capabilities

**What Works Offline**:
- ✅ Browse decks and cards
- ✅ Study and review cards
- ✅ Add custom notes
- ✅ View statistics
- ✅ Search local data

**Requires Connection**:
- ❌ Upload new decks
- ❌ Sync with server
- ❌ Download shared decks

**Sync Strategy** (planned):
- Queue reviews while offline
- Sync on reconnection
- Conflict resolution
- Delta sync for efficiency

## Accessibility Features

**Current**:
- High contrast mode (dark mode)
- Adjustable font sizes
- Touch target sizing
- Clear visual hierarchy

**Planned**:
- Screen reader support
- Voice input for ratings
- Keyboard navigation
- Color blind modes

## Future Features

### Short Term (Next 3 Months)
- 🔲 Markdown support in notes
- 🔲 Card preview in deck list
- 🔲 Bulk deck import
- 🔲 Statistics dashboard
- 🔲 Export functionality

### Medium Term (3-6 Months)
- 🔲 Cloud sync
- 🔲 Shared decks marketplace
- 🔲 Audio card support
- 🔲 Image occlusion
- 🔲 Cloze deletions

### Long Term (6+ Months)
- 🔲 Android support
- 🔲 Web app version
- 🔲 Collaborative decks
- 🔲 AI-generated cards
- 🔲 Gamification elements

## Feature Comparison

| Feature | Anki Desktop | This App |
|---------|-------------|----------|
| iOS Native | ❌ | ✅ |
| iPad Optimized | ❌ | ✅ |
| Large File Support | ⚠️ Limited | ✅ 800MB+ |
| SM-2 Algorithm | ✅ | ✅ |
| Custom Notes | ❌ | ✅ |
| Hierarchical Org | ❌ | ✅ Subject→Topic→Deck |
| Offline First | ✅ | ✅ |
| Dark Mode | ✅ | ✅ |
| Sync | ✅ AnkiWeb | 🔲 Planned |

## Related Documentation

- [[spaced-repetition|Spaced Repetition Algorithm]]
- [[organization|Organization System]]
- [[custom-notes|Custom Notes]]
- [[ipad-optimization|iPad Features]]
- [[../api/endpoints|API Endpoints]]
