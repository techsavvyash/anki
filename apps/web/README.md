# Anki Web - Mobile-Friendly Flashcard App

A modern, responsive web application for spaced repetition learning, built with React and TypeScript.

## Features

### 🎯 Spaced Repetition Learning
- **SM-2 Algorithm**: Intelligent scheduling based on the SuperMemo 2 algorithm
- **Quality Ratings**: 4-level quality assessment (Again, Hard, Good, Easy)
- **Card States**: Tracks new, learning, review, and relearning states
- **Progress Tracking**: View due cards and review statistics

### 📚 Deck Management
- **Import .apkg Files**: Upload standard Anki deck files (up to 100MB)
- **Chunked Upload**: Large files (≥50MB) are automatically uploaded in 5MB chunks
- **Deck Browsing**: View all imported decks with responsive grid layout
- **Card Details**: Browse individual cards with expandable views

### 📁 Hierarchical Organization
- **Subject → Topic → Deck**: Three-level organizational structure
- **Color-Coded Subjects**: Choose from 10 vibrant colors for easy identification
- **Topic Management**: Group related decks by topics within subjects

### 📝 Custom Notes
- **Personal Annotations**: Add your own notes to any flashcard
- **Per-Card Notes**: Notes are saved per user per card
- **Easy Editing**: In-line editing with save/cancel controls

### 📱 Mobile-First Design
- **Responsive Layout**: Optimized for phone, tablet, and desktop
- **Touch-Friendly**: Large tap targets and smooth animations
- **Bottom Navigation**: Easy thumb-zone navigation on mobile
- **PWA Support**: Install as a progressive web app for app-like experience

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Routing**: React Router 6
- **State Management**: Zustand
- **HTTP Client**: Axios
- **PWA**: vite-plugin-pwa

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Backend API running on `http://localhost:8080`

### Installation

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Start development server
pnpm --filter @anki/web dev
```

Or from this directory:

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
# Build the app
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
apps/web/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── BottomNavigation.tsx
│   │   ├── Card.tsx
│   │   ├── Layout.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── TopBar.tsx
│   ├── screens/             # Main application screens
│   │   ├── HomeScreen.tsx
│   │   ├── DecksScreen.tsx
│   │   ├── DeckDetailScreen.tsx
│   │   ├── ReviewScreen.tsx
│   │   ├── UploadScreen.tsx
│   │   └── OrganizeScreen.tsx
│   ├── services/            # API client and services
│   │   └── api.ts
│   ├── store/               # Zustand state management
│   │   ├── useUserStore.ts
│   │   ├── useDecksStore.ts
│   │   ├── useReviewStore.ts
│   │   └── useOrganizationStore.ts
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles and Tailwind
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Lint code with ESLint
- `pnpm type-check` - Check TypeScript types

## Features Overview

### Home Screen
- Dashboard with due card count
- Quick action buttons for common tasks
- Simple statistics

### Decks Screen
- Grid layout of all imported decks
- Responsive design (1 column on mobile, 2-3 on tablet/desktop)
- Empty state with upload prompt

### Review Screen
- Flashcard interface with front/back
- Progress bar showing completion
- 4-level quality rating buttons
- Automatic next card navigation
- Completion celebration screen

### Upload Screen
- Drag-and-drop file upload
- File validation (.apkg only, max 100MB)
- Progress bar for upload tracking
- Automatic chunking for large files
- Success/error feedback

### Organize Screen
- Create subjects with custom colors
- Create topics within subjects
- Hierarchical view of organization
- Color-coded subject indicators

### Deck Detail Screen
- View all cards in a deck
- Expandable card views
- Add/edit personal notes per card
- Card front/back preview

## Mobile Optimizations

- **Safe Areas**: Respects iOS notch and Android system bars
- **Touch Targets**: Minimum 44x44px tap areas
- **Animations**: Smooth transitions with hardware acceleration
- **Loading States**: Skeleton screens and spinners
- **Offline Support**: PWA with service worker caching
- **Responsive Images**: Optimized for different screen sizes

## API Integration

The app connects to the Go backend API at `http://localhost:8080`. Key endpoints used:

- `POST /users` - Create user
- `GET /users/:id` - Get user details
- `POST /upload` - Direct file upload
- `POST /upload/chunk` - Chunked file upload
- `GET /decks` - List decks
- `GET /decks/:id/cards` - Get deck cards
- `GET /reviews/due` - Get due cards
- `POST /reviews` - Submit review
- `GET /subjects` - List subjects
- `POST /subjects` - Create subject
- `GET /topics` - List topics
- `POST /topics` - Create topic
- `POST /cards/:id/note` - Save card note
- `GET /cards/:id/note` - Get card note

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Progressive Web App

The app can be installed on mobile devices and desktops:

1. Visit the app in a supported browser
2. Look for the "Install" or "Add to Home Screen" prompt
3. Follow the installation steps

Features when installed:
- App-like experience without browser UI
- Offline support for visited pages
- Faster loading with cached assets
- Push notifications (future feature)

## License

Part of the Anki monorepo project.
