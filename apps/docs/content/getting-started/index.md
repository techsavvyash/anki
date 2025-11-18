---
title: Getting Started
---

# Getting Started with Anki Flashcard App

Welcome! This guide will help you set up and start using the Anki Flashcard application.

## Prerequisites

Before you begin, ensure you have:

- **Backend**:
  - Go 1.21 or higher
  - SQLite 3.x

- **Frontend**:
  - Node.js 18.x or higher
  - npm 9.3.1 or higher
  - iOS Simulator (for development)
  - Xcode (for iOS builds)

## Quick Start

Get running in 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/techsavvyash/anki.git
cd anki

# 2. Start the backend
cd backend
go mod download
go run cmd/server/main.go

# 3. Start the mobile app (in a new terminal)
cd mobile
npm install
npm start
```

The backend will be running at `http://localhost:8080` and Expo will open the React Native app.

## Detailed Setup

### Backend Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   go mod download
   ```

2. **Initialize Database**:
   The database will be created automatically on first run at `./anki.db`

3. **Run the Server**:
   ```bash
   go run cmd/server/main.go
   ```

   Or build and run:
   ```bash
   go build -o anki-server cmd/server/main.go
   ./anki-server
   ```

4. **Verify Installation**:
   ```bash
   curl http://localhost:8080/health
   # Should return: {"status":"ok"}
   ```

### Mobile Setup

1. **Install Dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Configure Backend URL**:
   Edit `mobile/src/api/client.ts`:
   ```typescript
   const API_BASE_URL = 'http://localhost:8080';
   ```

3. **Start Development Server**:
   ```bash
   npm start
   ```

4. **Run on iOS**:
   ```bash
   npm run ios
   ```

   Or for iPad:
   ```bash
   npm run ios -- --simulator="iPad Pro (12.9-inch) (6th generation)"
   ```

## First Steps

### 1. Create a User

The app will create a user automatically on first launch, or you can create one manually:

```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

### 2. Upload Your First Deck

1. Open the app
2. Tap "Import Deck"
3. Select an `.apkg` file
4. Wait for upload and processing
5. Start reviewing!

### 3. Organize Your Decks

1. Create a Subject (e.g., "Languages")
2. Create a Topic (e.g., "Spanish")
3. Assign your deck to the topic
4. Browse by hierarchy

### 4. Start Studying

1. Navigate to "Review"
2. Study cards due today
3. Rate your knowledge (0-5)
4. Add custom notes as needed

## Development Workflow

### Backend Development

```bash
# Run tests
cd backend
make test

# Run with hot reload (using air)
go install github.com/cosmtrek/air@latest
air

# Check coverage
make test-coverage
```

### Frontend Development

```bash
# Run in development mode
npm start

# Run tests in watch mode
npm run test:watch

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## Common Issues

### Port Already in Use

If port 8080 is in use:

```bash
# Find the process
lsof -i :8080

# Kill it
kill -9 <PID>

# Or change the port in backend/cmd/server/main.go
```

### Database Locked

If you see "database is locked":

```bash
# Stop all running instances
killall anki-server

# Remove the lock
rm anki.db-shm anki.db-wal

# Restart the server
```

### iOS Simulator Issues

```bash
# Reset the simulator
xcrun simctl erase all

# Reinstall the app
npm run ios
```

## Next Steps

- [[installation|Full Installation Guide]] - Detailed installation
- [[development|Development Guide]] - Contributing
- [[configuration|Configuration]] - Customize settings
- [[../architecture/overview|Architecture]] - Understand the system

## Environment Variables

### Backend

```bash
# Optional environment variables
export PORT=8080
export DB_PATH=./anki.db
export UPLOAD_DIR=./uploads
export MAX_UPLOAD_SIZE=1073741824  # 1GB
```

### Frontend

```bash
# Expo environment
export EXPO_PUBLIC_API_URL=http://localhost:8080
```

## Troubleshooting

### Backend Not Connecting

1. Check if the server is running: `curl http://localhost:8080/health`
2. Verify the port isn't blocked by firewall
3. Check logs for errors

### Frontend Can't Reach Backend

1. Ensure `API_BASE_URL` is correct in `client.ts`
2. For iOS simulator, use `localhost` not `127.0.0.1`
3. For physical device, use your computer's IP address

### Upload Fails

1. Check file size (max 1GB by default)
2. Verify file is a valid `.apkg` file
3. Check disk space
4. Review server logs

## Resources

- [Go Documentation](https://go.dev/doc/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Anki File Format](https://github.com/ankitects/anki/blob/main/docs/file-format.md)

## Support

Need help?

- Check the [[../testing/index|Testing Guide]]
- Review [[../api/index|API Documentation]]
- Open an [issue on GitHub](https://github.com/techsavvyash/anki/issues)
