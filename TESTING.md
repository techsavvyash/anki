# Testing Documentation

This document describes the comprehensive testing setup for the Anki flashcard application, covering backend (Go) and frontend (React Native) testing.

## Overview

The project includes:
- **Backend Unit Tests** (Go with testify)
- **Frontend Unit Tests** (Jest + React Native Testing Library)
- **E2E/Visual Tests** (Detox)

## Backend Testing (Go)

### Test Framework

- **testify**: Assertion and mocking library
- **Go testing package**: Native Go testing

### Test Coverage

#### Storage Layer (`backend/internal/storage/sqlite_test.go`)

Comprehensive tests for all database operations:

- **User Operations**: Create, get users
- **Subject Operations**: Create, list, update, delete subjects
- **Topic Operations**: Create, list by subject, update, delete topics
- **Deck Operations**: Create, list, update deck-topic associations
- **Card Operations**: Create flashcards, get deck cards
- **Card Notes**: Save (upsert), get, delete custom notes
- **Card Schedule**: Create, update, get schedules
- **Review Logs**: Create, get review history

**Test Highlights**:
- Upsert pattern testing for card notes
- Hierarchical data integrity (Subject → Topic → Deck)
- Timestamp verification
- Edge cases (empty results, not found)

#### Scheduler (`backend/internal/scheduler/sm2_test.go`)

Tests for the SM-2 spaced repetition algorithm:

- **New Cards**: First review behavior
- **Quality Ratings**: All quality levels (0-5)
- **Ease Factor**: Adjustments and minimum threshold (1.3)
- **Intervals**: 1 day → 6 days → calculated intervals
- **State Transitions**: new → learning → review → relearning
- **Time Progression**: Next review date calculations
- **Reset Logic**: Failed reviews (quality < 3)

### Running Backend Tests

```bash
# Run all tests
cd backend
make test

# Run with coverage
make test-coverage

# Run specific test suites
make test-storage
make test-scheduler

# Verbose output
make test-verbose
```

### Test Output

```bash
# Example output
=== RUN   TestCreateUser
--- PASS: TestCreateUser (0.00s)
=== RUN   TestSaveCardNote
--- PASS: TestSaveCardNote (0.01s)
=== RUN   TestCalculateNextReview_FirstCorrect
--- PASS: TestCalculateNextReview_FirstCorrect (0.00s)
PASS
coverage: 85.2% of statements
```

## Frontend Testing (React Native)

### Test Frameworks

- **Jest**: Test runner with jest-expo preset
- **React Native Testing Library**: Component testing
- **Detox**: E2E and visual testing

### Test Coverage

#### Utilities

**`src/utils/__tests__/responsive.test.ts`**
- Device detection (tablet, iPad)
- Responsive sizing (width, height, font)
- Spacing calculations
- Grid column calculations
- Card max width calculations
- Orientation detection
- Landscape/portrait modes

**`src/utils/__tests__/styles.test.ts`**
- Responsive style creation
- Phone vs tablet style merging
- Common styles verification
- Typography styles
- Button styles
- Layout helpers

#### API Client

**`src/api/__tests__/client.test.ts`**
- Axios instance configuration
- Request interceptors (user ID injection)
- User management (create, get, set ID)
- File upload (direct and chunked)
- Progress callbacks
- Deck operations (list, get cards)
- Review operations (get due, submit)
- Card operations
- Health check
- Error handling

#### Components

**`src/components/__tests__/Grid.test.tsx`**
- Multi-column grid rendering
- Dynamic column counts (1, 2, 3)
- Custom gap spacing
- Empty data handling
- Empty column filling
- Custom styles
- Correct index passing
- Edge cases (single item, exact matches)

### E2E/Visual Testing

**`e2e/app.test.js`**
- Home screen navigation
- Decks screen functionality
- Upload screen interface
- Review flow
- Subject organization
- Navigation between screens

**`e2e/ipad.test.js`**
- iPad portrait layout (2 columns)
- iPad landscape layout (3 columns)
- Orientation change handling
- Responsive font sizes
- Touch target sizing
- Split view support

### Running Frontend Tests

#### Unit Tests

```bash
cd mobile

# Run all tests
npm test

# Watch mode (for development)
npm run test:watch

# With coverage
npm run test:coverage
```

#### E2E Tests

```bash
# Build the app for testing
npm run e2e:build

# Run E2E tests
npm run e2e:test

# Run on iPad simulator
detox test --configuration ios.ipad.debug

# Run release build
npm run e2e:test:release
```

### Test Configuration

#### Jest (`mobile/package.json`)

```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": [
      "@testing-library/jest-native/extend-expect",
      "<rootDir>/jest.setup.js"
    ],
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/types/**/*"
    ]
  }
}
```

#### Detox (`.detoxrc.js`)

Configured for:
- iPhone 14 simulator
- iPad Pro (12.9-inch) simulator
- Debug and release builds
- Landscape and portrait testing

## Test Best Practices

### Backend (Go)

1. **Isolation**: Each test uses a fresh in-memory database
2. **Cleanup**: Proper database closure in teardown
3. **Assertions**: Use testify's require/assert for clear error messages
4. **Coverage**: Aim for >80% code coverage
5. **Edge Cases**: Test error conditions, empty results, invalid inputs

### Frontend (React Native)

1. **Mocking**: Mock external dependencies (AsyncStorage, Expo modules)
2. **Accessibility**: Use testID for reliable element selection
3. **User Perspective**: Test behavior, not implementation
4. **Async**: Properly handle async operations with waitFor
5. **Cleanup**: Auto-cleanup with Testing Library

### E2E Testing

1. **Reliability**: Use stable selectors (testID, text)
2. **Independence**: Each test should work in isolation
3. **Timeouts**: Set appropriate timeouts for async operations
4. **Device Testing**: Test on both iPhone and iPad simulators
5. **Orientation**: Test both portrait and landscape modes

## Continuous Integration

### Recommended CI Setup

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-go@v2
        with:
          go-version: '1.21'
      - run: cd backend && make test-coverage

  frontend:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd mobile && npm install
      - run: cd mobile && npm test -- --coverage
      - run: cd mobile && npm run e2e:build
      - run: cd mobile && npm run e2e:test
```

## Coverage Goals

- **Backend**: >80% statement coverage
- **Frontend**: >75% statement coverage
- **E2E**: Critical user flows covered

## Test Data

### Backend

Tests use in-memory SQLite databases with fresh data per test:
- Test user: `test@example.com`
- Sample subjects: Languages, Medicine
- Sample topics: Spanish, French, Anatomy
- Sample decks: Spanish Vocabulary (100 cards)

### Frontend

Mock data for:
- Users with IDs
- Decks with various card counts
- Cards with front/back content
- Subjects and topics for organization
- Review schedules

## Debugging Tests

### Backend

```bash
# Run specific test
go test -v ./internal/storage -run TestSaveCardNote

# With race detection
go test -race ./...

# With CPU profiling
go test -cpuprofile cpu.prof ./...
```

### Frontend

```bash
# Run specific test file
npm test -- responsive.test.ts

# Update snapshots
npm test -- -u

# Debug in Chrome
npm test -- --debug
```

### E2E

```bash
# Run with logs
detox test --loglevel trace

# Take screenshots on failure
detox test --take-screenshots failing

# Record video
detox test --record-videos all
```

## Known Issues and Limitations

1. **Backend**: File upload tests use mock data (not actual .apkg files)
2. **Frontend**: Some native modules require mocking
3. **E2E**: Requires iOS Simulator (macOS only)
4. **Visual**: Screenshot comparison not yet automated

## Future Improvements

- [ ] Add screenshot regression testing
- [ ] Increase backend test coverage to >90%
- [ ] Add integration tests for full API flows
- [ ] Add performance benchmarks
- [ ] Add Android E2E tests
- [ ] Implement visual regression testing with Percy/Chromatic
- [ ] Add mutation testing
- [ ] Add load testing for file uploads

## Resources

- [Go Testing Package](https://pkg.go.dev/testing)
- [Testify Documentation](https://github.com/stretchr/testify)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [Jest Documentation](https://jestjs.io/)
