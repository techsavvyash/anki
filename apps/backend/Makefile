.PHONY: test test-coverage test-verbose run build clean

# Run all tests
test:
	go test ./... -v

# Run tests with coverage
test-coverage:
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Run tests with verbose output
test-verbose:
	go test ./... -v -count=1

# Run tests for a specific package
test-storage:
	go test ./internal/storage/... -v

test-scheduler:
	go test ./internal/scheduler/... -v

test-api:
	go test ./internal/api/... -v

# Run the server
run:
	go run ./cmd/server/main.go

# Build the server
build:
	go build -o bin/server ./cmd/server/main.go

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

# Download dependencies
deps:
	go mod download
	go mod tidy

# Run linter
lint:
	golangci-lint run

# Run tests in watch mode (requires entr)
watch:
	find . -name '*.go' | entr -c make test
