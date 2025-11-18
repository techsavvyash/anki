---
title: API Reference
---

# API Reference

Complete documentation for the Anki Flashcard backend API.

## Base URL

```
http://localhost:8080
```

In production, replace with your deployed URL.

## Authentication

Currently using simple header-based authentication:

```http
X-User-ID: <user-uuid>
```

**Planned**: JWT token-based authentication

## Response Format

All responses are JSON:

**Success Response**:
```json
{
  "id": "uuid",
  "name": "value",
  ...
}
```

**Error Response**:
```json
{
  "error": "Error message description"
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |

## API Endpoints

### Health Check

#### GET /health

Check if the server is running.

**Response**:
```json
{
  "status": "ok"
}
```

**Example**:
```bash
curl http://localhost:8080/health
```

---

### User Management

#### POST /users

Create a new user.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**: `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Example**:
```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

#### GET /users/:id

Get user by ID.

**Parameters**:
- `id` (path): User UUID

**Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "created_at": "2025-01-15T10:30:00Z"
}
```

---

### Subject Management

#### POST /subjects

Create a new subject.

**Headers**:
```
X-User-ID: <user-uuid>
```

**Request Body**:
```json
{
  "name": "Languages",
  "description": "Foreign language learning",
  "color": "#FF5733"
}
```

**Response**: `201 Created`
```json
{
  "id": "subject-uuid",
  "user_id": "user-uuid",
  "name": "Languages",
  "description": "Foreign language learning",
  "color": "#FF5733",
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### GET /subjects

Get all subjects for the authenticated user.

**Headers**:
```
X-User-ID: <user-uuid>
```

**Response**: `200 OK`
```json
[
  {
    "id": "subject-1",
    "name": "Languages",
    "description": "Foreign language learning",
    "color": "#FF5733",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

#### PUT /subjects/:id

Update a subject.

**Parameters**:
- `id` (path): Subject UUID

**Request Body**:
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "color": "#00FF00"
}
```

**Response**: `200 OK`

#### DELETE /subjects/:id

Delete a subject.

**Parameters**:
- `id` (path): Subject UUID

**Response**: `200 OK`

---

### Topic Management

#### POST /topics

Create a new topic within a subject.

**Headers**:
```
X-User-ID: <user-uuid>
```

**Request Body**:
```json
{
  "subject_id": "subject-uuid",
  "name": "Spanish",
  "description": "Spanish language learning"
}
```

**Response**: `201 Created`
```json
{
  "id": "topic-uuid",
  "subject_id": "subject-uuid",
  "user_id": "user-uuid",
  "name": "Spanish",
  "description": "Spanish language learning",
  "created_at": "2025-01-15T10:30:00Z"
}
```

#### GET /topics

Get all topics for the authenticated user.

**Response**: `200 OK`
```json
[
  {
    "id": "topic-1",
    "subject_id": "subject-1",
    "name": "Spanish",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

#### GET /subjects/:id/topics

Get all topics for a specific subject.

**Parameters**:
- `id` (path): Subject UUID

**Response**: `200 OK`
```json
[
  {
    "id": "topic-1",
    "subject_id": "subject-1",
    "name": "Spanish",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

#### PUT /topics/:id

Update a topic.

**Response**: `200 OK`

#### DELETE /topics/:id

Delete a topic.

**Response**: `200 OK`

---

### Deck Management

#### POST /upload

Upload an .apkg file.

**Headers**:
```
X-User-ID: <user-uuid>
Content-Type: multipart/form-data
```

**Request Body** (multipart):
- `file`: The .apkg file

**Response**: `201 Created`
```json
{
  "deck_id": "deck-uuid",
  "name": "Spanish Vocabulary",
  "card_count": 1000
}
```

**Example**:
```bash
curl -X POST http://localhost:8080/upload \
  -H "X-User-ID: user-uuid" \
  -F "file=@spanish.apkg"
```

#### POST /upload/chunk

Upload a file chunk (for large files).

**Headers**:
```
X-User-ID: <user-uuid>
Content-Type: multipart/form-data
```

**Request Body** (multipart):
- `chunk`: File chunk data
- `session_id`: Upload session ID
- `chunk_index`: Chunk number (0-based)
- `total_chunks`: Total number of chunks
- `file_name`: Original filename

**Response**: `200 OK`
```json
{
  "session_id": "session-uuid",
  "chunk_index": 0,
  "received": true
}
```

**On Last Chunk**: `201 Created`
```json
{
  "deck_id": "deck-uuid",
  "name": "Spanish Vocabulary",
  "card_count": 1000,
  "complete": true
}
```

#### GET /decks

Get all decks for the authenticated user.

**Headers**:
```
X-User-ID: <user-uuid>
```

**Response**: `200 OK`
```json
[
  {
    "id": "deck-1",
    "name": "Spanish Vocabulary",
    "description": "1000 most common Spanish words",
    "card_count": 1000,
    "topic_id": "topic-1",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

#### GET /decks/:id/cards

Get all cards in a deck.

**Parameters**:
- `id` (path): Deck UUID

**Response**: `200 OK`
```json
[
  {
    "id": "card-1",
    "deck_id": "deck-1",
    "front": "Hello",
    "back": "Hola",
    "original_id": 1234,
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

#### PUT /decks/:id/topic

Assign a deck to a topic.

**Parameters**:
- `id` (path): Deck UUID

**Request Body**:
```json
{
  "topic_id": "topic-uuid"
}
```

**Response**: `200 OK`

---

### Card Management

#### GET /cards/:id

Get a specific card.

**Parameters**:
- `id` (path): Card UUID

**Response**: `200 OK`
```json
{
  "id": "card-1",
  "deck_id": "deck-1",
  "front": "Hello",
  "back": "Hola",
  "original_id": 1234,
  "created_at": "2025-01-15T10:30:00Z"
}
```

---

### Card Notes

#### POST /cards/:id/note

Add or update a custom note for a card.

**Parameters**:
- `id` (path): Card UUID

**Headers**:
```
X-User-ID: <user-uuid>
```

**Request Body**:
```json
{
  "note": "Remember: Hola is informal, Buenos días is formal"
}
```

**Response**: `201 Created` or `200 OK`
```json
{
  "id": "note-uuid",
  "user_id": "user-uuid",
  "card_id": "card-uuid",
  "note": "Remember: Hola is informal, Buenos días is formal",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### GET /cards/:id/note

Get the custom note for a card.

**Parameters**:
- `id` (path): Card UUID

**Response**: `200 OK`
```json
{
  "id": "note-uuid",
  "note": "Remember: Hola is informal, Buenos días is formal",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### DELETE /cards/:id/note

Delete a custom note.

**Parameters**:
- `id` (path): Card UUID

**Response**: `200 OK`

---

### Review System

#### GET /reviews/due

Get all cards due for review.

**Headers**:
```
X-User-ID: <user-uuid>
```

**Query Parameters**:
- `deck_id` (optional): Filter by specific deck

**Response**: `200 OK`
```json
[
  {
    "id": "card-1",
    "deck_id": "deck-1",
    "front": "Hello",
    "back": "Hola",
    "next_review_at": "2025-01-15T10:00:00Z",
    "state": "review"
  }
]
```

#### POST /reviews

Submit a review for a card.

**Headers**:
```
X-User-ID: <user-uuid>
```

**Request Body**:
```json
{
  "user_id": "user-uuid",
  "card_id": "card-uuid",
  "quality": 4
}
```

Quality scale:
- `0`: Complete blackout
- `1`: Incorrect with partial recall
- `2`: Incorrect but easy to remember
- `3`: Correct with difficulty
- `4`: Correct with hesitation
- `5`: Perfect recall

**Response**: `201 Created`
```json
{
  "review_id": "review-uuid",
  "next_review_at": "2025-01-20T10:00:00Z",
  "interval": 5,
  "ease_factor": 2.6
}
```

#### GET /reviews/history

Get review history.

**Headers**:
```
X-User-ID: <user-uuid>
```

**Query Parameters**:
- `card_id` (optional): Filter by card
- `deck_id` (optional): Filter by deck
- `limit` (optional): Max results (default: 100)

**Response**: `200 OK`
```json
[
  {
    "id": "review-1",
    "card_id": "card-1",
    "quality": 4,
    "timestamp": "2025-01-15T10:30:00Z"
  }
]
```

---

## Error Codes

### 400 Bad Request

**Causes**:
- Invalid JSON
- Missing required fields
- Invalid field values

**Example**:
```json
{
  "error": "Invalid request body: missing required field 'email'"
}
```

### 404 Not Found

**Causes**:
- Resource doesn't exist
- Invalid UUID

**Example**:
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error

**Causes**:
- Database error
- File system error
- Unexpected server error

**Example**:
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

**Current**: No rate limiting

**Planned**:
- 100 requests/minute per user
- 1000 requests/hour per user
- Burst allowance: 10 requests

## Pagination

**Planned** for list endpoints:

```http
GET /decks?page=1&limit=20
```

**Response headers**:
```
X-Total-Count: 150
X-Page: 1
X-Per-Page: 20
Link: </decks?page=2&limit=20>; rel="next"
```

## Filtering & Sorting

**Planned**:

```http
GET /cards?deck_id=deck-1&sort=created_at&order=desc
```

## Webhooks

**Planned**: Event notifications for:
- Review completed
- Deck imported
- Card added

## SDK / Client Libraries

**Available**:
- JavaScript/TypeScript (in `mobile/src/api/client.ts`)

**Planned**:
- Python SDK
- Go SDK
- REST documentation (OpenAPI/Swagger)

## Related Documentation

- [[endpoints|Full Endpoint Reference]]
- [[authentication|Authentication Details]]
- [[../features/spaced-repetition|SM-2 Algorithm]]
- [[../architecture/data-model|Data Model]]
