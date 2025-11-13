---
title: Anki Flashcard Application
---

# Welcome to Anki Flashcard App Documentation

A comprehensive mobile and desktop application for viewing and studying Anki flashcards with advanced spaced repetition, large file support, and powerful organization features.

## Quick Links

- [[getting-started/index|Getting Started]] - Set up and run the application
- [[architecture/index|Architecture]] - Understand the system design
- [[features/index|Features]] - Explore all capabilities
- [[api/index|API Reference]] - Backend API documentation
- [[testing/index|Testing]] - Test suite and quality assurance
- [[deployment/index|Deployment]] - Deploy to production

## Overview

This application provides a modern, efficient way to study flashcards from Anki's `.apkg` files with support for:

- **Large Files**: Upload and process `.apkg` files up to 800MB+
- **iOS & iPad Optimized**: Native iOS app with full iPad support including landscape mode
- **Spaced Repetition**: SM-2 algorithm for optimal learning
- **Custom Notes**: Add personal notes to cards during review
- **Hierarchical Organization**: Subject → Topic → Deck structure
- **Offline First**: Works seamlessly without internet connection

## Technology Stack

### Backend
- **Go 1.21** - High-performance backend
- **Gin** - Web framework
- **SQLite** - Embedded database
- **SM-2 Algorithm** - Spaced repetition

### Frontend
- **React Native 0.73** - Cross-platform mobile framework
- **Expo 50.0** - Development tooling
- **TypeScript** - Type-safe development
- **Axios** - HTTP client

## Project Structure

```
anki/
├── backend/          # Go backend
│   ├── cmd/         # Application entry points
│   ├── internal/    # Core logic
│   │   ├── api/     # HTTP handlers
│   │   ├── models/  # Data models
│   │   ├── parser/  # .apkg parser
│   │   ├── scheduler/ # SM-2 implementation
│   │   └── storage/ # Database layer
│   └── tests/       # Backend tests
├── mobile/          # React Native app
│   ├── src/
│   │   ├── api/     # API client
│   │   ├── components/ # Reusable components
│   │   ├── screens/ # App screens
│   │   ├── types/   # TypeScript types
│   │   └── utils/   # Utilities
│   └── e2e/         # E2E tests
└── docs/            # Documentation (this site)
```

## Getting Started

Choose your path:

1. **[[getting-started/quickstart|Quick Start]]** - Get running in 5 minutes
2. **[[getting-started/installation|Full Installation]]** - Detailed setup guide
3. **[[getting-started/development|Development Guide]]** - Contributing and development

## Key Features

### 📱 iPad Optimization
- Responsive 2-3 column grid layouts
- Landscape and portrait support
- Adaptive font sizes and spacing
- Full orientation change handling

### 📚 Organization
- Three-tier hierarchy (Subject → Topic → Deck)
- Color-coded subjects
- Custom tags and filtering
- Search across all content

### 🧠 Smart Learning
- SM-2 spaced repetition algorithm
- Quality ratings (0-5)
- Learning state tracking
- Review history and statistics

### 📝 Custom Notes
- Add personal notes to any card
- Persistent across reviews
- Quick edit during study
- Markdown support

### 📤 Large File Support
- Chunked uploads (5MB chunks)
- Progress tracking
- Resume interrupted uploads
- Memory-efficient processing

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/techsavvyash/anki/issues)
- **Discussions**: [GitHub Discussions](https://github.com/techsavvyash/anki/discussions)
- **License**: MIT

## Next Steps

- Read the [[architecture/overview|Architecture Overview]]
- Explore [[features/spaced-repetition|Spaced Repetition]]
- Check out [[api/endpoints|API Endpoints]]
- Run the [[testing/unit-tests|Test Suite]]

---

*Documentation built with [Quartz 4](https://quartz.jzhao.xyz/)*
