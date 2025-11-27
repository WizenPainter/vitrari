package main

import (
	"database/sql"
	"encoding/csv"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Read extracted herrajes CSV
	file, err := os.Open("/tmp/herrajes_extracted.csv")
	if err != nil {
		log.Fatalf("Failed to open CSV: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatalf("Failed to read CSV: %v", err)
	}

	// Connect to database
	dbPath := filepath.Join("database", "glass_optimizer.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Skip header
	count := 0
	for _, record := range records[1:] {
		if len(record) < 5 {
			continue
		}

		code := strings.TrimSpace(record[0])
		name := strings.TrimSpace(record[1])
		category := strings.TrimSpace(record[2])
		material := strings.TrimSpace(record[3])
		finish := strings.TrimSpace(record[4])

		// Parse numeric fields
		minThickness := 0.0
		maxThickness := 0.0
		positions := 1
		holeSize := 0.0

		if len(record) > 5 {
			minThickness, _ = strconv.ParseFloat(record[5], 64)
		}
		if len(record) > 6 {
			maxThickness, _ = strconv.ParseFloat(record[6], 64)
		}
		if len(record) > 7 {
			positions, _ = strconv.Atoi(record[7])
		}
		if len(record) > 8 {
			holeSize, _ = strconv.ParseFloat(record[8], 64)
		}

		// Skip empty/invalid entries
		if code == "" || name == "" || len(name) > 255 {
			continue
		}

		// Skip if product code appears to be noise
		if strings.Contains(name, "www.herralum") || strings.Contains(name, "/herralum") || name == "1pz" {
			continue
		}

		// Skip very common material/finish lines that got misclassified
		if name == "Satinado" || name == "Cromado" || name == "Pulido" || strings.Contains(name, "AISI") {
			continue
		}

		// Default values
		if holeSize == 0 {
			if strings.Contains(category, "spider") {
				holeSize = 8.0
			} else if strings.Contains(category, "bracket") {
				holeSize = 10.0
			}
		}

		if minThickness == 0 && maxThickness == 0 {
			minThickness = 6.0
			maxThickness = 12.0
		}

		// Check if already exists
		var exists int
		err := db.QueryRow("SELECT COUNT(*) FROM herrajes WHERE code = ?", code).Scan(&exists)
		if err != nil {
			continue
		}

		if exists > 0 {
			continue
		}

		// Insert
		_, err = db.Exec(`
			INSERT INTO herrajes (
				code, name, description, category, material, finish,
				hole_size, min_thickness, max_thickness, positions,
				hole_pattern, max_load, notes, active, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`,
			code, name, "", category, material, finish,
			holeSize, minThickness, maxThickness, positions,
			"single", 100.0, "", // defaults
		)

		if err == nil {
			count++
		}
	}

	log.Printf("Successfully added %d herrajes to database\n", count)
}
