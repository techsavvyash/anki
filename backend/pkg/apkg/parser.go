package apkg

import (
	"archive/zip"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

// ApkgPackage represents a parsed .apkg file
type ApkgPackage struct {
	CollectionDB *sql.DB
	MediaFiles   map[string]string // media number -> filename
	ExtractPath  string
}

// Card represents a flashcard from Anki
type Card struct {
	ID       int64  `json:"id"`
	NoteID   int64  `json:"note_id"`
	DeckID   int64  `json:"deck_id"`
	Ord      int    `json:"ord"`
	Type     int    `json:"type"`
	Queue    int    `json:"queue"`
	Due      int    `json:"due"`
	Interval int    `json:"interval"`
	Factor   int    `json:"factor"`
	Reps     int    `json:"reps"`
	Lapses   int    `json:"lapses"`
	Left     int    `json:"left"`
	ODue     int    `json:"odue"`
	ODid     int64  `json:"odid"`
	Flags    int    `json:"flags"`
	Data     string `json:"data"`
}

// Note represents a note in Anki
type Note struct {
	ID     int64    `json:"id"`
	GUID   string   `json:"guid"`
	Mid    int64    `json:"mid"` // model id
	Mod    int64    `json:"mod"`
	USN    int      `json:"usn"`
	Tags   string   `json:"tags"`
	Fields []string `json:"fields"`
	Sfld   string   `json:"sfld"` // sort field
	Csum   int64    `json:"csum"`
	Flags  int      `json:"flags"`
	Data   string   `json:"data"`
}

// Deck represents an Anki deck
type Deck struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Desc string `json:"desc"`
}

// Model represents a note type/template in Anki
type Model struct {
	ID     int64    `json:"id"`
	Name   string   `json:"name"`
	Fields []string `json:"fields"`
	CSS    string   `json:"css"`
}

// ExtractApkg extracts an .apkg file to a temporary directory
func ExtractApkg(apkgPath string) (*ApkgPackage, error) {
	// Create temporary directory for extraction
	extractPath := filepath.Join(os.TempDir(), "anki_"+filepath.Base(apkgPath))
	if err := os.MkdirAll(extractPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create extract directory: %w", err)
	}

	// Open the .apkg file (which is a ZIP archive)
	r, err := zip.OpenReader(apkgPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open apkg file: %w", err)
	}
	defer r.Close()

	var collectionPath string
	mediaMapPath := ""

	// Extract all files
	for _, f := range r.File {
		fpath := filepath.Join(extractPath, f.Name)

		// Create directory if needed
		if f.FileInfo().IsDir() {
			os.MkdirAll(fpath, os.ModePerm)
			continue
		}

		// Create parent directory
		if err := os.MkdirAll(filepath.Dir(fpath), os.ModePerm); err != nil {
			return nil, err
		}

		// Extract file
		outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return nil, err
		}

		rc, err := f.Open()
		if err != nil {
			outFile.Close()
			return nil, err
		}

		_, err = io.Copy(outFile, rc)
		outFile.Close()
		rc.Close()

		if err != nil {
			return nil, err
		}

		// Track important files
		if strings.HasPrefix(f.Name, "collection.anki") {
			collectionPath = fpath
		} else if f.Name == "media" {
			mediaMapPath = fpath
		}
	}

	if collectionPath == "" {
		return nil, fmt.Errorf("collection database not found in .apkg file")
	}

	// Open the SQLite database
	db, err := sql.Open("sqlite3", collectionPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open collection database: %w", err)
	}

	// Parse media mapping
	mediaFiles := make(map[string]string)
	if mediaMapPath != "" {
		data, err := os.ReadFile(mediaMapPath)
		if err == nil {
			json.Unmarshal(data, &mediaFiles)
		}
	}

	return &ApkgPackage{
		CollectionDB: db,
		MediaFiles:   mediaFiles,
		ExtractPath:  extractPath,
	}, nil
}

// GetDecks retrieves all decks from the collection
func (p *ApkgPackage) GetDecks() ([]Deck, error) {
	// In Anki, decks are stored in the 'col' table as JSON in the 'decks' field
	var decksJSON string
	err := p.CollectionDB.QueryRow("SELECT decks FROM col").Scan(&decksJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to query decks: %w", err)
	}

	var decksMap map[string]interface{}
	if err := json.Unmarshal([]byte(decksJSON), &decksMap); err != nil {
		return nil, fmt.Errorf("failed to parse decks JSON: %w", err)
	}

	var decks []Deck
	for _, deckData := range decksMap {
		deckMap := deckData.(map[string]interface{})
		deck := Deck{
			ID:   int64(deckMap["id"].(float64)),
			Name: deckMap["name"].(string),
		}
		if desc, ok := deckMap["desc"].(string); ok {
			deck.Desc = desc
		}
		decks = append(decks, deck)
	}

	return decks, nil
}

// GetCards retrieves all cards from the collection
func (p *ApkgPackage) GetCards() ([]Card, error) {
	rows, err := p.CollectionDB.Query(`
		SELECT id, nid, did, ord, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data
		FROM cards
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query cards: %w", err)
	}
	defer rows.Close()

	var cards []Card
	for rows.Next() {
		var card Card
		err := rows.Scan(
			&card.ID, &card.NoteID, &card.DeckID, &card.Ord, &card.Type,
			&card.Queue, &card.Due, &card.Interval, &card.Factor, &card.Reps,
			&card.Lapses, &card.Left, &card.ODue, &card.ODid, &card.Flags, &card.Data,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan card: %w", err)
		}
		cards = append(cards, card)
	}

	return cards, rows.Err()
}

// GetNotes retrieves all notes from the collection
func (p *ApkgPackage) GetNotes() ([]Note, error) {
	rows, err := p.CollectionDB.Query(`
		SELECT id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data
		FROM notes
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query notes: %w", err)
	}
	defer rows.Close()

	var notes []Note
	for rows.Next() {
		var note Note
		var fldsStr string
		err := rows.Scan(
			&note.ID, &note.GUID, &note.Mid, &note.Mod, &note.USN,
			&note.Tags, &fldsStr, &note.Sfld, &note.Csum, &note.Flags, &note.Data,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan note: %w", err)
		}

		// Fields are separated by \x1f character in Anki
		note.Fields = strings.Split(fldsStr, "\x1f")
		notes = append(notes, note)
	}

	return notes, rows.Err()
}

// GetModels retrieves all models (note types) from the collection
func (p *ApkgPackage) GetModels() ([]Model, error) {
	var modelsJSON string
	err := p.CollectionDB.QueryRow("SELECT models FROM col").Scan(&modelsJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to query models: %w", err)
	}

	var modelsMap map[string]interface{}
	if err := json.Unmarshal([]byte(modelsJSON), &modelsMap); err != nil {
		return nil, fmt.Errorf("failed to parse models JSON: %w", err)
	}

	var models []Model
	for _, modelData := range modelsMap {
		modelMap := modelData.(map[string]interface{})
		model := Model{
			ID:   int64(modelMap["id"].(float64)),
			Name: modelMap["name"].(string),
		}

		// Extract field names
		if flds, ok := modelMap["flds"].([]interface{}); ok {
			for _, fld := range flds {
				fldMap := fld.(map[string]interface{})
				model.Fields = append(model.Fields, fldMap["name"].(string))
			}
		}

		// Extract CSS
		if css, ok := modelMap["css"].(string); ok {
			model.CSS = css
		}

		models = append(models, model)
	}

	return models, nil
}

// Close closes the database and cleans up extracted files
func (p *ApkgPackage) Close() error {
	if p.CollectionDB != nil {
		p.CollectionDB.Close()
	}
	// Optionally remove extracted files
	// os.RemoveAll(p.ExtractPath)
	return nil
}
