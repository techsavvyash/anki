---
title: Testing
---

# Testing Guide

Comprehensive testing documentation for the Anki Flashcard application, covering backend (Go) and frontend (React Native) testing strategies.

## Overview

The project includes:
- **Backend Unit Tests** - Go with testify
- **Frontend Unit Tests** - Jest + React Native Testing Library
- **E2E Tests** - Detox for visual and integration testing
- **Coverage Goals** - >80% backend, >75% frontend

## Quick Start

### Run All Tests

**Backend**:
```bash
cd backend
make test
```

**Frontend**:
```bash
cd mobile
npm test
```

**E2E**:
```bash
cd mobile
npm run e2e:build
npm run e2e:test
```

## Backend Testing

### Framework

- **Go Testing**: Native Go testing package
- **Testify**: Assertion and mocking library
- **Coverage**: Built-in go coverage tools

### Test Structure

```
backend/
├── internal/
│   ├── storage/
│   │   ├── sqlite.go
│   │   └── sqlite_test.go      # Storage tests
│   └── scheduler/
│       ├── sm2.go
│       └── sm2_test.go          # Algorithm tests
└── Makefile                      # Test commands
```

### Storage Tests

**File**: `backend/internal/storage/sqlite_test.go`

**Coverage** (20+ test cases):
- User CRUD operations
- Subject management
- Topic management with hierarchy
- Deck operations
- Card notes (upsert pattern)
- Card schedules
- Review logs

**Example Test**:
```go
func TestSaveCardNote(t *testing.T) {
    storage := setupTestDB(t)
    defer storage.Close()

    // Create test data
    user, _ := storage.CreateUser("test@example.com")
    deck := &models.ImportedDeck{
        UserID: user.ID,
        Name:   "Test Deck",
    }
    storage.CreateDeck(deck)

    card := &models.Flashcard{
        DeckID: deck.ID,
        Front:  "Front",
        Back:   "Back",
    }
    storage.CreateFlashcard(card)

    // Test create
    note := &models.CardNote{
        UserID: user.ID,
        CardID: card.ID,
        Note:   "This is my note",
    }
    err := storage.SaveCardNote(note)

    require.NoError(t, err)
    assert.NotEmpty(t, note.ID)

    // Test update (upsert)
    note.Note = "Updated note"
    err = storage.SaveCardNote(note)

    require.NoError(t, err)

    // Verify update
    retrieved, _ := storage.GetCardNote(user.ID, card.ID)
    assert.Equal(t, "Updated note", retrieved.Note)
}
```

### Scheduler Tests

**File**: `backend/internal/scheduler/sm2_test.go`

**Coverage** (10+ test cases):
- First review behavior
- Quality ratings (0-5)
- Ease factor adjustments
- Interval calculations
- State transitions
- Reset logic for failures

**Example Test**:
```go
func TestCalculateNextReview_FirstCorrect(t *testing.T) {
    schedule := &models.CardSchedule{
        UserID:       "user1",
        CardID:       "card1",
        EaseFactor:   DefaultEaseFactor,
        Interval:     0,
        Repetitions:  0,
        NextReviewAt: time.Now(),
        State:        "new",
    }

    // First correct review (quality 3)
    newSchedule := CalculateNextReview(schedule, 3)

    assert.Equal(t, 1, newSchedule.Repetitions)
    assert.Equal(t, 1, newSchedule.Interval)
    assert.Equal(t, "learning", newSchedule.State)
    assert.True(t, newSchedule.NextReviewAt.After(schedule.NextReviewAt))
}
```

### Running Backend Tests

```bash
cd backend

# Run all tests
make test

# With coverage report
make test-coverage
# Opens coverage.html in browser

# Specific test suite
make test-storage
make test-scheduler

# Verbose output
make test-verbose

# Watch mode (requires entr)
find . -name "*.go" | entr -c make test
```

### Test Coverage

```bash
# Generate coverage
go test ./... -coverprofile=coverage.out

# View in browser
go tool cover -html=coverage.out

# Coverage by package
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out
```

**Current Coverage**:
- Storage: ~85%
- Scheduler: ~90%
- Overall: ~82%

## Frontend Testing

### Frameworks

- **Jest**: Test runner
- **jest-expo**: Expo preset
- **React Native Testing Library**: Component testing
- **Detox**: E2E testing

### Test Structure

```
mobile/
├── src/
│   ├── utils/
│   │   └── __tests__/
│   │       ├── responsive.test.ts
│   │       └── styles.test.ts
│   ├── api/
│   │   └── __tests__/
│   │       └── client.test.ts
│   └── components/
│       └── __tests__/
│           └── Grid.test.tsx
├── e2e/
│   ├── app.test.js
│   └── ipad.test.js
└── jest.setup.js
```

### Unit Tests

#### Utilities Tests

**Responsive Utils** (`src/utils/__tests__/responsive.test.ts`):
```typescript
describe('responsive utilities', () => {
  it('should detect iPad correctly', () => {
    Platform.isPad = true;
    const result = isIPad();
    expect(result).toBe(true);
  });

  it('should calculate responsive font sizes', () => {
    const result = responsiveFontSize(16);
    expect(result).toBeGreaterThan(0);
  });
});
```

**Styles Utils** (`src/utils/__tests__/styles.test.ts`):
```typescript
describe('styles utilities', () => {
  it('should create responsive styles', () => {
    const styles = createResponsiveStyles({
      container: { padding: 10 }
    });
    expect(styles.container).toBeDefined();
  });
});
```

#### API Client Tests

**File**: `src/api/__tests__/client.test.ts`

```typescript
describe('ApiClient', () => {
  it('should create user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockAxiosInstance.post.mockResolvedValueOnce({ data: mockUser });

    const result = await apiClient.createUser('test@example.com');

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/users',
      { email: 'test@example.com' }
    );
    expect(result).toEqual(mockUser);
  });

  it('should upload file with progress', async () => {
    const onProgress = jest.fn();
    await apiClient.uploadApkg('file://path', 'deck.apkg', onProgress);

    const config = mockAxiosInstance.post.mock.calls[0][2];
    config.onUploadProgress({ loaded: 50, total: 100 });

    expect(onProgress).toHaveBeenCalledWith(50);
  });
});
```

#### Component Tests

**Grid Component** (`src/components/__tests__/Grid.test.tsx`):
```typescript
describe('Grid Component', () => {
  const mockData = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ];

  it('should render all items', () => {
    const { getByTestId } = render(
      <Grid data={mockData} renderItem={mockRenderItem} />
    );

    mockData.forEach((item) => {
      expect(getByTestId(`item-${item.id}`)).toBeTruthy();
    });
  });

  it('should render 2 columns when specified', () => {
    const { UNSAFE_getAllByType } = render(
      <Grid data={mockData} renderItem={mockRenderItem} numColumns={2} />
    );

    const rows = UNSAFE_getAllByType(View).filter(
      (node) => node.props.style?.flexDirection === 'row'
    );
    expect(rows.length).toBe(1); // 2 items, 2 columns = 1 row
  });
});
```

### Running Frontend Tests

```bash
cd mobile

# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific file
npm test -- responsive.test.ts

# Update snapshots
npm test -- -u
```

## E2E Testing

### Configuration

**Detox** (`.detoxrc.js`):
```javascript
module.exports = {
  testRunner: {
    args: {
      config: 'e2e/jest.config.js'
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/...',
      build: 'xcodebuild ...'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 14' }
    },
    ipad: {
      type: 'ios.simulator',
      device: { type: 'iPad Pro (12.9-inch)' }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'ios.ipad.debug': {
      device: 'ipad',
      app: 'ios.debug'
    }
  }
};
```

### E2E Test Examples

**Main App Flow** (`e2e/app.test.js`):
```javascript
describe('Home Screen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should show home screen on launch', async () => {
    await expect(element(by.text('Anki Flashcards'))).toBeVisible();
  });

  it('should navigate to decks screen', async () => {
    await element(by.text('Browse All Decks')).tap();
    await expect(element(by.text('My Decks'))).toBeVisible();
  });
});
```

**iPad Tests** (`e2e/ipad.test.js`):
```javascript
describe('iPad Layout - Portrait', () => {
  beforeEach(async () => {
    await device.setOrientation('portrait');
  });

  it('should display 2-column grid in portrait', async () => {
    await element(by.text('Browse All Decks')).tap();
    await expect(element(by.id('decks-grid'))).toBeVisible();
  });
});

describe('iPad Layout - Landscape', () => {
  beforeEach(async () => {
    await device.setOrientation('landscape');
  });

  it('should display 3-column grid in landscape', async () => {
    await element(by.text('Browse All Decks')).tap();
    await expect(element(by.id('decks-grid'))).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
cd mobile

# Build for testing
npm run e2e:build

# Run tests
npm run e2e:test

# iPad tests
detox test --configuration ios.ipad.debug

# With logs
detox test --loglevel trace

# Record video
detox test --record-videos all
```

## Test Best Practices

### Backend

1. **Isolation**: Use in-memory database per test
2. **Cleanup**: Always close DB connections
3. **Assertions**: Use testify's require for critical checks
4. **Coverage**: Aim for >80%
5. **Edge Cases**: Test error conditions

**Example**:
```go
func TestStorageOperation(t *testing.T) {
    // Setup
    storage := setupTestDB(t)
    defer storage.Close()  // Always cleanup

    // Execute
    result, err := storage.SomeOperation()

    // Assert
    require.NoError(t, err)      // Critical
    assert.NotNil(t, result)     // Non-critical
    assert.Equal(t, expected, result)
}
```

### Frontend

1. **Mocking**: Mock external dependencies
2. **User Perspective**: Test behavior, not implementation
3. **Async**: Use waitFor for async operations
4. **Accessibility**: Use testID for reliable selectors
5. **Cleanup**: Let Testing Library handle it

**Example**:
```typescript
it('should handle async data loading', async () => {
  const { getByText, findByText } = render(<Component />);

  // Initial state
  expect(getByText('Loading...')).toBeTruthy();

  // Wait for data
  const element = await findByText('Data loaded');
  expect(element).toBeTruthy();
});
```

### E2E

1. **Reliability**: Use stable selectors (testID, text)
2. **Independence**: Tests should work in any order
3. **Timeouts**: Set appropriate waits
4. **Cleanup**: Reset app state between tests

**Example**:
```javascript
describe('Feature', () => {
  beforeEach(async () => {
    await device.reloadReactNative(); // Fresh start
  });

  it('should complete user flow', async () => {
    await element(by.id('button')).tap();
    await waitFor(element(by.text('Success')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## CI/CD Integration

### GitHub Actions

**Example** (`.github/workflows/test.yml`):
```yaml
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
      - uses: codecov/codecov-action@v2

  frontend:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd mobile && npm install
      - run: cd mobile && npm test -- --coverage
      - run: cd mobile && npm run e2e:build
      - run: cd mobile && npm run e2e:test
```

## Coverage Reports

### Backend

```bash
# Generate HTML report
make test-coverage

# View report
open coverage.html

# Console summary
go tool cover -func=coverage.out
```

**Example Output**:
```
github.com/techsavvyash/anki-backend/internal/storage    85.2%
github.com/techsavvyash/anki-backend/internal/scheduler  90.1%
total:                                                   82.7%
```

### Frontend

```bash
# Generate coverage
npm run test:coverage

# Opens in browser
open coverage/lcov-report/index.html
```

## Debugging Tests

### Backend

```bash
# Run specific test
go test -v ./internal/storage -run TestSaveCardNote

# With race detector
go test -race ./...

# Print statements
t.Logf("Value: %v", value)
```

### Frontend

```bash
# Debug mode
npm test -- --debug

# Specific test
npm test -- responsive.test.ts --verbose

# Console logs
console.log('Component:', component.toJSON());
```

### E2E

```bash
# Detailed logs
detox test --loglevel trace

# Screenshots on failure
detox test --take-screenshots failing

# Artifacts
detox test --artifacts-location ./e2e-artifacts
```

## Coverage Goals

| Layer | Current | Goal |
|-------|---------|------|
| Backend Storage | 85% | >80% |
| Backend Scheduler | 90% | >80% |
| Frontend Utils | 75% | >75% |
| Frontend Components | 70% | >75% |
| E2E Critical Flows | 80% | >80% |

## Related Documentation

- [[unit-tests|Unit Testing Details]]
- [[e2e-tests|E2E Testing Guide]]
- [[../api/index|API Reference]]
- [[../getting-started/development|Development Guide]]
