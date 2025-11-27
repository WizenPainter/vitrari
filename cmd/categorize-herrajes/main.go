package main

import (
	"database/sql"
	"log"
	"path/filepath"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	dbPath := filepath.Join("database", "glass_optimizer.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Get all herrajes with 'other' category
	rows, err := db.Query("SELECT id, name, description FROM herrajes WHERE category = 'other'")
	if err != nil {
		log.Fatalf("Failed to query herrajes: %v", err)
	}
	defer rows.Close()

	categorizations := map[string]string{
		// Spiders/Arañas
		"araña":           "spider",
		"spider":          "spider",
		"mérida":          "spider",
		"querétaro":       "spider",
		"merida":          "spider",
		"baby merida":     "spider",

		// Brackets/Soportes
		"soporte":         "bracket",
		"rótula":          "bracket",
		"rotula":          "bracket",
		"bracket":         "bracket",
		"apoyo":           "bracket",

		// Connectors/Conectores
		"conector":        "connector",
		"connector":       "connector",
		"clip":            "connector",
		"bisagra":         "connector",
		"gancho":          "connector",

		// Washers/Rondanas
		"rondana":         "washer",
		"washer":          "washer",
		"tuerca":          "washer",
		"nut":             "washer",

		// Pins/Pasadores
		"pasador":         "pin",
		"pin":             "pin",
		"tornillo":        "pin",
		"screw":           "pin",

		// Adjusters
		"ajustador":       "adjuster",
		"adjuster":        "adjuster",
		"regulador":       "adjuster",
	}

	count := 0
	for rows.Next() {
		var id int
		var name, description string
		if err := rows.Scan(&id, &name, &description); err != nil {
			continue
		}

		nameLower := strings.ToLower(name + " " + description)
		newCategory := ""

		for keyword, category := range categorizations {
			if strings.Contains(nameLower, keyword) {
				newCategory = category
				break
			}
		}

		if newCategory != "" {
			_, err := db.Exec("UPDATE herrajes SET category = ? WHERE id = ?", newCategory, id)
			if err == nil {
				count++
			}
		}
	}

	log.Printf("Recategorized %d herrajes\n", count)

	// Show distribution
	rows2, _ := db.Query("SELECT category, COUNT(*) as count FROM herrajes GROUP BY category ORDER BY count DESC")
	defer rows2.Close()

	log.Println("\nNew distribution:")
	for rows2.Next() {
		var category string
		var cnt int
		rows2.Scan(&category, &cnt)
		log.Printf("  %s: %d", category, cnt)
	}
}
