---
title: Architecture Overview
---

# Architecture Overview

The Anki Flashcard application follows a **client-server architecture** with a Go backend and React Native frontend, designed for performance, scalability, and offline-first capabilities.

## High-Level Architecture

```
┌─────────────────────────────────────┐
│     React Native Mobile App         │
│  ┌──────────────────────────────┐  │
│  │   UI Components & Screens    │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │    API Client (Axios)        │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │   Local Storage (AsyncStorage)│  │
│  └──────────────────────────────┘  │
└─────────────┬───────────────────────┘
              │ HTTP/REST
              │
┌─────────────▼───────────────────────┐
│         Go Backend Server           │
│  ┌──────────────────────────────┐  │
│  │     API Layer (Gin)          │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │    Business Logic Layer      │  │
│  │  ┌────────────────────────┐  │  │
│  │  │  .apkg Parser          │  │  │
│  │  │  SM-2 Scheduler        │  │  │
│  │  │  File Processor        │  │  │
│  │  └────────────────────────┘  │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │    Storage Layer (SQLite)    │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Design Principles

### 1. **Separation of Concerns**
- **Frontend**: UI/UX, user interactions, local state
- **Backend**: Business logic, data processing, persistence
- Clear API boundaries between layers

### 2. **Offline-First**
- Local caching of decks and cards
- Sync when connection available
- Queue reviews for later submission

### 3. **Scalability**
- Stateless API design
- Chunked file uploads for large files
- Efficient database queries with indexes

### 4. **Type Safety**
- TypeScript on frontend
- Strongly-typed Go on backend
- Shared type definitions

### 5. **Testability**
- Unit tests for all layers
- Integration tests for API
- E2E tests for critical flows

## Component Architecture

### Backend Components

#### [[backend-overview|API Layer]]
**Technology**: Gin Web Framework

**Responsibilities**:
- HTTP request handling
- Request validation
- Response formatting
- CORS configuration
- Rate limiting

**Key Files**:
- `internal/api/server.go` - Server setup
- `internal/api/handlers.go` - Request handlers
- `internal/api/middleware.go` - Middleware

#### [[backend-overview#Business Logic|Business Logic Layer]]

**Components**:

1. **Parser** (`internal/parser/`)
   - Extracts data from .apkg files
   - Validates file structure
   - Processes media files

2. **Scheduler** (`internal/scheduler/`)
   - Implements SM-2 algorithm
   - Calculates review intervals
   - Manages card states

3. **Storage** (`internal/storage/`)
   - Database operations
   - Query optimization
   - Transaction management

#### [[data-model|Data Models]]

**Core Entities**:
- User
- Subject
- Topic
- Deck
- Card
- CardNote
- CardSchedule
- ReviewLog

### Frontend Components

#### [[frontend-overview|Screen Layer]]

**Screens**:
- `HomeScreen` - Dashboard and overview
- `DecksScreen` - Browse all decks
- `DeckDetailScreen` - View single deck
- `ReviewScreen` - Study cards
- `UploadScreen` - Import .apkg files
- `SubjectsScreen` - Organize by subject
- `TopicDetailScreen` - View topic cards

#### [[frontend-overview#Components|Component Layer]]

**Reusable Components**:
- `Grid` - Multi-column layouts
- `Card` - Flashcard display
- `Button` - Styled buttons
- `Input` - Form inputs

#### [[frontend-overview#Utils|Utilities]]

- **Responsive** - Device detection, sizing
- **Styles** - Shared styling utilities
- **API Client** - Backend communication

## Data Flow

### Upload Flow

```
User Selects File
       ↓
Read File Metadata
       ↓
Chunk File (5MB)
       ↓
Upload Chunks → Backend
       ↓
Backend Assembles File
       ↓
Parse .apkg (ZIP)
       ↓
Extract SQLite DB
       ↓
Import to Main DB
       ↓
Return Deck Info
       ↓
Update UI
```

### Review Flow

```
User Requests Review
       ↓
Fetch Due Cards ← Backend
       ↓
Display Card Front
       ↓
User Reveals Answer
       ↓
Display Card Back
       ↓
User Rates Quality (0-5)
       ↓
Calculate Next Review ← SM-2
       ↓
Save Review Log → Backend
       ↓
Update Schedule → Backend
       ↓
Next Card
```

### Organization Flow

```
Create Subject
       ↓
Save to Backend
       ↓
Create Topic (linked to Subject)
       ↓
Save to Backend
       ↓
Upload Deck
       ↓
Assign to Topic
       ↓
Update Deck Metadata
       ↓
Display in Hierarchy
```

## Database Schema

### Entity Relationships

```
User
 ├── Subjects
 │    └── Topics
 │         └── Decks
 │              └── Cards
 │                   ├── CardSchedules
 │                   ├── CardNotes
 │                   └── ReviewLogs
 └── ReviewLogs
```

### Key Tables

**users**
- Primary: User accounts
- Fields: id, email, created_at

**subjects**
- Primary: Top-level categories
- Fields: id, user_id, name, description, color

**topics**
- Primary: Subcategories
- Fields: id, subject_id, user_id, name, description

**decks**
- Primary: Imported .apkg decks
- Fields: id, user_id, topic_id, name, card_count

**cards**
- Primary: Individual flashcards
- Fields: id, deck_id, front, back, original_id

**card_schedules**
- Primary: SM-2 scheduling data
- Fields: id, user_id, card_id, ease_factor, interval, next_review_at

**card_notes**
- Primary: User custom notes
- Fields: id, user_id, card_id, note

**review_logs**
- Primary: Review history
- Fields: id, user_id, card_id, quality, timestamp

See [[data-model|Full Data Model]] for details.

## API Design

### RESTful Principles

- **Resources**: Nouns (users, decks, cards)
- **Methods**: HTTP verbs (GET, POST, PUT, DELETE)
- **Stateless**: No session state on server
- **HATEOAS**: Links in responses (planned)

### Endpoint Structure

```
/users              - User management
/subjects           - Subject CRUD
/topics             - Topic CRUD
/decks              - Deck operations
/cards              - Card operations
/reviews            - Review submissions
/upload             - File uploads
/health             - Health check
```

See [[../api/endpoints|API Endpoints]] for full reference.

## Security Considerations

### Authentication
- User ID in request headers
- Planned: JWT tokens
- Planned: OAuth integration

### Data Validation
- Input sanitization
- Type checking
- Size limits

### File Upload Security
- File type validation
- Size restrictions
- Virus scanning (planned)

### Database Security
- Prepared statements (prevent SQL injection)
- Row-level security
- Audit logging (planned)

## Performance Optimization

### Backend
- **Database Indexing**: Indexed foreign keys and frequently queried fields
- **Connection Pooling**: Reuse database connections
- **Chunked Uploads**: Handle large files efficiently
- **Compression**: Gzip responses

### Frontend
- **Lazy Loading**: Load screens on demand
- **Image Optimization**: Compress and cache media
- **Virtualized Lists**: Render only visible items
- **Debouncing**: Rate-limit search queries

### Caching Strategy
- **Browser Cache**: Static assets
- **AsyncStorage**: User data, decks
- **HTTP Cache**: API responses with ETags

## Scalability Plan

### Horizontal Scaling
- Stateless API servers
- Load balancer (nginx/HAProxy)
- Database replication

### Vertical Scaling
- Increase server resources
- Optimize queries
- Add caching layer (Redis)

### Future Enhancements
- Microservices architecture
- Event-driven updates
- GraphQL API
- Real-time sync with WebSockets

## Technology Choices

### Why Go for Backend?
- **Performance**: Fast compilation and execution
- **Concurrency**: Goroutines for parallel processing
- **Simplicity**: Easy to maintain
- **Tooling**: Excellent standard library

### Why React Native?
- **Cross-platform**: iOS and Android from one codebase
- **Performance**: Native components
- **Community**: Large ecosystem
- **Expo**: Faster development

### Why SQLite?
- **Embedded**: No separate database server
- **Portable**: Single file database
- **Fast**: Optimized for mobile
- **Reliable**: ACID compliant

## Deployment Architecture

### Development
```
Developer Machine
  ├── Backend (localhost:8080)
  ├── Mobile App (Expo)
  └── Database (local file)
```

### Production
```
Cloud Infrastructure
  ├── API Servers (multiple instances)
  ├── Load Balancer
  ├── Database (managed service)
  ├── File Storage (S3/similar)
  └── CDN (static assets)
```

See [[../deployment/index|Deployment Guide]] for details.

## Related Documentation

- [[backend-overview|Backend Details]]
- [[frontend-overview|Frontend Details]]
- [[data-model|Data Model]]
- [[../api/endpoints|API Reference]]
- [[../features/spaced-repetition|SM-2 Algorithm]]
