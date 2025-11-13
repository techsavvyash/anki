# Anki Flashcard App

A full-stack spaced repetition flashcard application with support for large .apkg file imports (800MB+).

## 🎯 Features

- **iOS Mobile App** - Built with React Native and Expo
- **Go Backend** - High-performance server with large file support
- **Spaced Repetition** - SM-2 algorithm for optimal learning
- **Large File Support** - Chunked uploads for .apkg files 800MB+
- **.apkg Parser** - Full support for Anki package format
- **Multiple Decks** - Import and manage multiple flashcard decks
- **Progress Tracking** - Monitor your learning progress

## 🏗️ Architecture

```
┌─────────────────┐
│  iOS App        │
│  (React Native) │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│  Go Backend     │
│  - API Server   │
│  - .apkg Parser │
│  - SM-2 Engine  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SQLite DB      │
│  - Users        │
│  - Decks        │
│  - Cards        │
│  - Schedules    │
└─────────────────┘
```

## 📖 Documentation

**Comprehensive documentation is available in the `docs/` directory**, powered by [Quartz 4](https://quartz.jzhao.xyz/).

**View locally**:
```bash
cd docs
npx quartz build --serve
```

**Documentation includes**:
- 📘 [Getting Started](docs/content/getting-started/index.md) - Setup and installation
- 🏗️ [Architecture](docs/content/architecture/index.md) - System design and architecture
- ✨ [Features](docs/content/features/index.md) - Complete feature documentation
- 🔌 [API Reference](docs/content/api/index.md) - Backend API documentation
- 🧪 [Testing](docs/content/testing/index.md) - Test suite and quality assurance
- 🚀 [Deployment](docs/content/deployment/index.md) - Production deployment guide

## 📋 Prerequisites

### Backend
- Go 1.21+
- GCC (for SQLite)

### Mobile App
- Node.js 18+
- Expo CLI
- iOS Simulator (Xcode) or physical iOS device

## 🚀 Quick Start

### 1. Start the Backend

```bash
cd backend
go mod download
go run ./cmd/server/main.go
```

The backend will start on `http://localhost:8080`

### 2. Start the Mobile App

```bash
cd mobile
npm install
npm start
```

Then press `i` for iOS Simulator or scan QR code for physical device.

### 3. Import Your First Deck

1. Tap "Import .apkg File" in the app
2. Select an .apkg file (even 800MB+ files work!)
3. Wait for processing
4. Start reviewing!

## 📁 Project Structure

```
anki/
├── backend/              # Go backend server
│   ├── cmd/
│   │   └── server/      # Main application
│   ├── internal/
│   │   ├── api/         # HTTP handlers
│   │   ├── models/      # Data models
│   │   ├── scheduler/   # SM-2 algorithm
│   │   └── storage/     # Database layer
│   └── pkg/
│       └── apkg/        # .apkg file parser
│
├── mobile/              # React Native mobile app
│   ├── src/
│   │   ├── api/         # Backend API client
│   │   ├── screens/     # App screens
│   │   └── types/       # TypeScript types
│   └── App.tsx          # Main app component
│
└── README.md            # This file
```

## 🎓 How It Works

### .apkg File Format

An `.apkg` file is a ZIP archive containing:
- `collection.anki2` - SQLite database with cards, notes, and decks
- `media` - JSON mapping of media files
- Media files (images, audio, videos)

### Spaced Repetition (SM-2 Algorithm)

The app uses the SuperMemo 2 algorithm:

1. **New Card** → Review in 1 day
2. **Second Review** → Review in 6 days
3. **Subsequent Reviews** → Interval × Ease Factor

Quality ratings affect the ease factor:
- **0 (Again)**: Reset card, review in <1 minute
- **1-2 (Hard)**: Reduce ease factor
- **3 (Good)**: Standard interval increase
- **4-5 (Easy)**: Increase ease factor and interval

### File Upload Strategy

- **Small files (<50MB)**: Direct upload
- **Large files (≥50MB)**: Chunked upload with 5MB chunks
- **Progress tracking**: Real-time upload progress
- **Background processing**: .apkg parsing happens asynchronously

## 🔧 Configuration

### Backend Configuration

```bash
./server -port 8080 -db ./data/anki.db -uploads ./uploads
```

Options:
- `-port`: Server port (default: 8080)
- `-db`: SQLite database path
- `-uploads`: Upload directory

### Mobile App Configuration

Edit `mobile/src/api/client.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8080'; // Change this
```

## 📊 API Documentation

### Endpoints

#### User Management
- `POST /users` - Create user
- `GET /users/:id` - Get user

#### File Upload
- `POST /upload` - Upload .apkg file
- `POST /upload/chunk` - Chunked upload

#### Decks
- `GET /decks` - List user decks
- `GET /decks/:id/cards` - Get deck cards

#### Reviews
- `GET /reviews/due` - Get cards due for review
- `POST /reviews` - Submit card review

See `backend/README.md` for detailed API documentation.

## 🧪 Development

### Running Tests

Backend:
```bash
cd backend
go test ./...
```

### Building for Production

Backend:
```bash
cd backend
go build -o server ./cmd/server
```

Mobile (iOS):
```bash
cd mobile
eas build --platform ios
```

## 🎨 Screenshots

(Add screenshots of your app here)

## 🔮 Future Enhancements

- [ ] Android support
- [ ] Media file support (images, audio)
- [ ] Custom study modes
- [ ] Statistics and analytics
- [ ] Cloud sync
- [ ] Offline mode with local caching
- [ ] Dark mode
- [ ] Card editing
- [ ] Custom card templates

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Anki for the .apkg format specification
- SuperMemo for the SM-2 algorithm
- The open-source community

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Note**: This app is designed for personal use and learning. For production deployment, additional security measures, error handling, and optimizations are recommended.
