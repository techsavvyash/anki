# Anki Flashcard Monorepo

A full-stack spaced repetition flashcard application with support for large .apkg file imports (800MB+), organized as a modern TypeScript monorepo.

## 🎯 Features

- **iOS Mobile App** - Built with React Native and Expo
- **Go Backend** - High-performance server with large file support
- **Spaced Repetition** - SM-2 algorithm for optimal learning
- **Large File Support** - Chunked uploads for .apkg files 800MB+
- **.apkg Parser** - Full support for Anki package format
- **Multiple Decks** - Import and manage multiple flashcard decks
- **Progress Tracking** - Monitor your learning progress
- **Monorepo Structure** - Shared packages and efficient build system with Turborepo

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

- **Node.js** 18+ and **pnpm** 8+
- **Go** 1.21+ and **GCC** (for SQLite)
- **Expo CLI** for mobile development
- **iOS Simulator** (Xcode) or physical iOS device

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Build Shared Packages

```bash
pnpm build
```

### 3. Start Development

Run all apps in parallel:
```bash
pnpm dev
```

Or run individual apps:

**Backend:**
```bash
pnpm backend run
# or
cd apps/backend && make run
```

**Mobile App:**
```bash
pnpm mobile start
# or
cd apps/mobile && pnpm start
```

**Documentation:**
```bash
pnpm docs dev
# or
cd apps/docs && pnpm dev
```

### 4. Import Your First Deck

1. Tap "Import .apkg File" in the app
2. Select an .apkg file (even 800MB+ files work!)
3. Wait for processing
4. Start reviewing!

## 📁 Monorepo Structure

```
anki/
├── apps/                     # Applications
│   ├── backend/              # Go backend server
│   │   ├── cmd/server/       # Main application
│   │   ├── internal/
│   │   │   ├── api/          # HTTP handlers
│   │   │   ├── models/       # Data models
│   │   │   ├── scheduler/    # SM-2 algorithm
│   │   │   └── storage/      # Database layer
│   │   └── pkg/apkg/         # .apkg file parser
│   │
│   ├── mobile/               # React Native mobile app
│   │   ├── src/
│   │   │   ├── api/          # Backend API client
│   │   │   ├── screens/      # App screens
│   │   │   └── types/        # Mobile-specific types
│   │   └── App.tsx           # Main app component
│   │
│   └── docs/                 # Quartz documentation site
│       └── content/          # Documentation content
│
├── packages/                 # Shared packages
│   ├── types/                # @anki/types - Shared TypeScript types
│   │   └── src/index.ts      # Domain models (User, Deck, Card, etc.)
│   │
│   └── constants/            # @anki/constants - Shared constants
│       └── src/index.ts      # API config, SM-2 constants, etc.
│
├── package.json              # Root package.json with workspaces
├── pnpm-workspace.yaml       # pnpm workspace configuration
├── turbo.json                # Turborepo pipeline configuration
├── tsconfig.base.json        # Shared TypeScript configuration
└── README.md                 # This file
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

Edit `packages/constants/src/index.ts` or set environment variable:

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080',
  // ...
};
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

Run all tests:
```bash
pnpm test
```

Run tests for specific app:
```bash
pnpm --filter @anki/mobile test
cd apps/backend && make test
```

### Linting & Formatting

```bash
pnpm lint          # Lint all TypeScript code
pnpm format        # Format all code with Prettier
```

### Building for Production

Build all packages:
```bash
pnpm build
```

Build specific app:
```bash
pnpm --filter @anki/mobile build
cd apps/backend && make build
```

### Monorepo Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all packages |
| `pnpm dev` | Start all apps in dev mode |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint TypeScript code |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Clean build artifacts |
| `pnpm mobile <cmd>` | Run mobile app command |
| `pnpm docs <cmd>` | Run docs command |

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
