package main

import (
	"flag"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/techsavvyash/anki-backend/internal/api"
	"github.com/techsavvyash/anki-backend/internal/storage"
)

func main() {
	// Parse command line flags
	port := flag.String("port", "8080", "Server port")
	dbPath := flag.String("db", "./data/anki.db", "Path to SQLite database")
	uploadDir := flag.String("uploads", "./uploads", "Upload directory")
	flag.Parse()

	// Ensure data directory exists
	if err := os.MkdirAll("./data", 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	// Ensure upload directory exists
	if err := os.MkdirAll(*uploadDir, 0755); err != nil {
		log.Fatalf("Failed to create upload directory: %v", err)
	}

	// Initialize storage
	store, err := storage.NewSQLiteStorage(*dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}
	defer store.Close()

	// Create server
	server := api.NewServer(store, *uploadDir)

	// Enable CORS for React Native app
	server.Router().Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "X-User-ID", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Start server
	log.Printf("Starting server on port %s...", *port)
	if err := server.Run(":" + *port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
