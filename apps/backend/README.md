# Anki Backend Server

A Go-based backend server for the Anki flashcard app with support for large .apkg file uploads (800MB+), spaced repetition using the SM-2 algorithm, and RESTful API for mobile clients.

## Features

- **Large File Upload Support**: Chunked upload support for .apkg files of any size
- **.apkg Parser**: Extracts SQLite database and media files from Anki packages
- **Spaced Repetition**: SM-2 algorithm implementation for optimal flashcard scheduling
- **RESTful API**: Clean API for mobile app integration
- **SQLite Storage**: Lightweight database for flashcards and user progress

## Project Structure

```
backend/
├── cmd/
│   └── server/          # Main application entry point
├── internal/
│   ├── api/             # HTTP handlers and routing
│   ├── models/          # Data models
│   ├── parser/          # .apkg parsing logic
│   ├── scheduler/       # Spaced repetition algorithm (SM-2)
│   └── storage/         # Database layer
└── pkg/
    └── apkg/            # Public .apkg parsing utilities
```

## Getting Started

### Prerequisites

- Go 1.21 or higher
- GCC (for SQLite compilation)

### Installation

1. Install dependencies:
```bash
cd backend
go mod download
```

2. Build the server:
```bash
go build -o server ./cmd/server
```

3. Run the server:
```bash
./server -port 8080 -db ./data/anki.db -uploads ./uploads
```

Or run directly:
```bash
go run ./cmd/server/main.go
```

## API Endpoints

### Health Check
```
GET /health
```

### User Management
```
POST /users
GET /users/:id
```

### File Upload
```
POST /upload                 # Single file upload
POST /upload/chunk          # Chunked upload for large files
```

**Chunked Upload Parameters:**
- `session_id`: Unique session identifier
- `chunk_index`: Current chunk number (0-based)
- `total_chunks`: Total number of chunks
- `file_name`: Original filename
- `chunk`: File chunk data

### Decks
```
GET /decks                  # Get user's decks
GET /decks/:id/cards        # Get all cards in a deck
```

### Reviews
```
GET /reviews/due            # Get cards due for review
POST /reviews               # Submit a review
```

**Review Request:**
```json
{
  "user_id": "uuid",
  "card_id": "uuid",
  "quality": 3              // 0-5 scale
}
```

**Quality Scale:**
- 0: Complete blackout
- 1: Incorrect, but correct answer remembered
- 2: Incorrect, correct answer seemed easy
- 3: Correct with difficulty
- 4: Correct with hesitation
- 5: Perfect response

## Development

### Running Tests
```bash
go test ./...
```

### Environment Variables
- `PORT`: Server port (default: 8080)
- `DB_PATH`: SQLite database path (default: ./data/anki.db)
- `UPLOAD_DIR`: Upload directory (default: ./uploads)

## .apkg File Format

An .apkg file is a ZIP archive containing:
- `collection.anki2` or `collection.anki21`: SQLite database with cards, notes, decks
- `media`: JSON file mapping media numbers to filenames
- Media files (images, audio, videos)

## Spaced Repetition Algorithm

This server uses the SM-2 (SuperMemo 2) algorithm, which is the basis for Anki's scheduling:

1. **First review**: Card shown again in 1 day
2. **Second review**: Card shown again in 6 days
3. **Subsequent reviews**: Interval multiplied by ease factor
4. **Failed cards**: Reset to beginning

The ease factor adjusts based on recall quality (0-5 scale).

## License

MIT
