# Anki Mobile App

A React Native/Expo iOS app for viewing Anki flashcards with spaced repetition learning, fully optimized for both iPhone and iPad.

## Features

- 📱 **iOS-first design** with React Native + Expo
- 📦 **Import large .apkg files** (800MB+) with chunked upload
- 🧠 **Spaced repetition** using SM-2 algorithm
- 📚 **Multiple deck support**
- 🎯 **Clean, intuitive flashcard interface**
- 📊 **Progress tracking**
- 🔄 **Sync with backend server**
- 📲 **iPad optimized** with responsive layouts and landscape support

## iPad Optimizations

The app is fully optimized for iPad with the following features:

### 📐 Responsive Layouts
- **Grid views**: 2-3 columns for decks (depending on orientation)
- **Larger cards**: Better use of screen real estate
- **Bigger fonts and spacing**: Optimized for comfortable reading
- **Adaptive components**: All screens adjust to iPad screen size

### 🔄 Landscape Support
- **Automatic adaptation**: Layouts change based on orientation
- **Full landscape support**: All features work in any orientation
- **Dynamic columns**: Grid layouts adjust from portrait to landscape
- **Optimized review**: Review buttons spread out in landscape mode

### 🎨 iPad-Specific Features
- Larger touch targets for easier interaction
- Enhanced shadows and border radius for premium feel
- Side-by-side buttons in landscape
- Centered content with max-width constraints
- iPad-specific tips and information sections

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or physical iOS device
- Running backend server (see `../backend/README.md`)

## Getting Started

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Backend URL

Edit `src/api/client.ts` and update the `API_BASE_URL`:

```typescript
const API_BASE_URL = 'http://your-backend-url:8080';
```

For iOS Simulator: `http://localhost:8080`
For physical device: Use your computer's IP address (e.g., `http://192.168.1.100:8080`)

### 3. Run the App

```bash
npm start
```

Then press `i` to open in iOS Simulator, or scan the QR code with Expo Go app on your physical device.

## Project Structure

```
mobile/
├── src/
│   ├── api/              # API client for backend communication
│   ├── components/       # Reusable UI components
│   ├── screens/          # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── DecksScreen.tsx
│   │   ├── DeckDetailScreen.tsx
│   │   ├── ReviewScreen.tsx
│   │   └── UploadScreen.tsx
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── App.tsx               # Main app component
└── app.json              # Expo configuration
```

## Screens

### Home Screen
- Overview of cards due for review
- Quick access to review, decks, and import

### Decks Screen
- List all imported decks
- View deck statistics
- Navigate to deck details

### Deck Detail Screen
- View all cards in a deck
- Browse card content
- Start reviewing the deck

### Review Screen
- Flashcard review interface
- SM-2 spaced repetition
- Quality rating (Again, Hard, Good, Easy)
- Progress tracking

### Upload Screen
- Import .apkg files
- Support for large files (800MB+)
- Chunked upload with progress indicator

## Building for Production

### iOS

1. Configure your app in `app.json` (bundle identifier, etc.)

2. Build for iOS:
```bash
expo build:ios
```

Or with EAS Build:
```bash
eas build --platform ios
```

## API Integration

The app communicates with the Go backend server. Make sure the backend is running before using the app.

### Key API Endpoints Used:

- `POST /users` - Create user
- `GET /decks` - List user decks
- `GET /decks/:id/cards` - Get deck cards
- `POST /upload` - Upload .apkg file
- `POST /upload/chunk` - Chunked upload
- `GET /reviews/due` - Get cards due for review
- `POST /reviews` - Submit card review

## Spaced Repetition

The app uses the SM-2 algorithm for spaced repetition:

- **Again (0)**: Card shown again in <1 minute
- **Hard (2)**: Card shown in <6 minutes
- **Good (3)**: Card shown after calculated interval
- **Easy (5)**: Card shown after extended interval

The algorithm adjusts intervals based on your performance.

## File Upload

For large .apkg files:
- Files < 50MB: Direct upload
- Files ≥ 50MB: Chunked upload (5MB chunks)

Progress is tracked in real-time.

## Development

### Running on iOS Simulator

```bash
npm run ios
```

### Running on Physical Device

1. Install Expo Go from App Store
2. Run `npm start`
3. Scan QR code with Camera app
4. Open in Expo Go

### Debugging

- Shake device or press Cmd+D in simulator
- Enable Remote JS Debugging
- Use React Native Debugger or Chrome DevTools

## Troubleshooting

### Backend Connection Issues

- Ensure backend server is running
- Check `API_BASE_URL` in `src/api/client.ts`
- For iOS Simulator, use `localhost`
- For physical device, use your computer's local IP

### File Upload Fails

- Check file size limits
- Verify backend upload directory permissions
- Check network connection

### App Crashes

- Clear Expo cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## License

MIT
