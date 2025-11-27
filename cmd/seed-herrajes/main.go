package main

import (
	"database/sql"
	"log"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	dbPath := filepath.Join("database", "glass_optimizer.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	herrajes := []map[string]interface{}{
		// Arañas Mérida
		{
			"code":              "1214104",
			"name":              "Araña 1214 AISI 304",
			"description":       "Araña 1214 de acero inoxidable AISI 304. Para instalación en fachadas de cristal.",
			"category":          "spider",
			"material":          "Acero inoxidable AISI 304",
			"finish":            "Satinado",
			"hole_size":         8.0,
			"countersink_size":  0.0,
			"min_thickness":     6.0,
			"max_thickness":     9.0,
			"positions":         4,
			"hole_pattern":      "grid",
			"max_load":          150.0,
			"notes":             "Múltiplo: 1pz. No usar limpiadores base cloro.",
		},
		{
			"code":              "1213102",
			"name":              "Araña baby Mérida 2 patas AISI 304",
			"description":       "Araña baby Mérida de 2 patas con portacostillas. Acero inoxidable AISI 304.",
			"category":          "spider",
			"material":          "Acero inoxidable AISI 304",
			"finish":            "Satinado",
			"hole_size":         8.0,
			"countersink_size":  0.0,
			"min_thickness":     6.0,
			"max_thickness":     9.0,
			"positions":         2,
			"hole_pattern":      "pair",
			"max_load":          100.0,
			"notes":             "Para instalación en interiores. Modulaciones máximo 1.20 x 3.00m. Múltiplo: 1pz.",
		},
		{
			"code":              "1201102",
			"name":              "Araña Querétaro 2 patas AISI 304",
			"description":       "Araña Querétaro de 2 patas con portacostilla. Acero inoxidable AISI 304.",
			"category":          "spider",
			"material":          "Acero inoxidable AISI 304",
			"finish":            "Satinado",
			"hole_size":         10.0,
			"countersink_size":  0.0,
			"min_thickness":     9.5,
			"max_thickness":     19.0,
			"positions":         2,
			"hole_pattern":      "pair",
			"max_load":          150.0,
			"notes":             "Para instalación en exteriores. Compatible con rótulas 120305BSA y 1203ESTSA. Múltiplo: 1pz.",
		},
		{
			"code":              "1201104",
			"name":              "Araña Querétaro 4 patas AISI 304",
			"description":       "Araña Querétaro de 4 patas con portacostilla. Acero inoxidable AISI 304.",
			"category":          "spider",
			"material":          "Acero inoxidable AISI 304",
			"finish":            "Satinado",
			"hole_size":         10.0,
			"countersink_size":  0.0,
			"min_thickness":     9.5,
			"max_thickness":     19.0,
			"positions":         4,
			"hole_pattern":      "grid",
			"max_load":          200.0,
			"notes":             "Para instalación en exteriores. Compatible con rótulas 120305BSA y 1203ESTSA. Múltiplo: 1pz.",
		},
		{
			"code":              "1202102",
			"name":              "Araña Querétaro para viga 1 pata AISI 304",
			"description":       "Araña Querétaro para viga de 1 pata. Acero inoxidable AISI 304.",
			"category":          "spider",
			"material":          "Acero inoxidable AISI 304",
			"finish":            "Satinado",
			"hole_size":         10.0,
			"countersink_size":  0.0,
			"min_thickness":     9.5,
			"max_thickness":     19.0,
			"positions":         1,
			"hole_pattern":      "single",
			"max_load":          150.0,
			"notes":             "Para instalación en exteriores, conectada a vigas. Múltiplo: 1pz.",
		},
		// Soportes/Brackets
		{
			"code":              "1203104",
			"name":              "Soporte con rótula 1203 AISI 304",
			"description":       "Soporte con rótula de acero inoxidable AISI 304. Permite ajuste angular.",
			"category":          "bracket",
			"material":          "Acero inoxidable AISI 304",
			"finish":            "Satinado",
			"hole_size":         10.0,
			"countersink_size":  0.0,
			"min_thickness":     9.5,
			"max_thickness":     19.0,
			"positions":         1,
			"hole_pattern":      "single",
			"max_load":          200.0,
			"notes":             "Soporte estándar con capacidad de rotación. Múltiplo: 1pz.",
		},
		{
			"code":              "120305104",
			"name":              "Soporte con rótula avellanada 120305 AISI 304",
			"description":       "Soporte con rótula avellanada de acero inoxidable AISI 304. Incluye avellanado de 13mm.",
			"category":          "bracket",
			"material":          "Acero inoxidable AISI 304",
			"finish":            "Satinado",
			"hole_size":         10.0,
			"countersink_size":  13.0,
			"countersink_type":  "cone",
			"min_thickness":     9.5,
			"max_thickness":     19.0,
			"positions":         1,
			"hole_pattern":      "single",
			"max_load":          200.0,
			"notes":             "Soporte con rótula y avellanado. Múltiplo: 1pz.",
		},
		{
			"code":              "1203104ESTSA",
			"name":              "Soporte estándar 1203 AISI 304",
			"description":       "Soporte estándar de acero inoxidable AISI 304. Sin rótula.",
			"category":          "bracket",
			"material":          "Acero inoxidable AISI 304",
			"finish":            "Satinado",
			"hole_size":         10.0,
			"countersink_size":  13.0,
			"countersink_type":  "cone",
			"min_thickness":     9.0,
			"max_thickness":     24.0,
			"positions":         1,
			"hole_pattern":      "single",
			"max_load":          250.0,
			"notes":             "Soporte estándar fijo. Múltiplo: 1pz.",
		},
	}

	for _, h := range herrajes {
		// Check if already exists
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM herrajes WHERE code = ?", h["code"]).Scan(&count)
		if err != nil {
			log.Printf("Error checking herraje %s: %v", h["code"], err)
			continue
		}

		if count > 0 {
			log.Printf("Herraje %s already exists, skipping", h["code"])
			continue
		}

		// Insert herraje
		_, err = db.Exec(`
			INSERT INTO herrajes (
				code, name, description, category, material, finish,
				hole_size, countersink_size, countersink_type,
				min_thickness, max_thickness, positions, hole_pattern, max_load,
				notes, active, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`,
			h["code"], h["name"], h["description"], h["category"], h["material"], h["finish"],
			h["hole_size"], h["countersink_size"], h["countersink_type"],
			h["min_thickness"], h["max_thickness"], h["positions"], h["hole_pattern"], h["max_load"],
			h["notes"],
		)

		if err != nil {
			log.Printf("Error inserting herraje %s: %v", h["code"], err)
		} else {
			log.Printf("Added herraje: %s - %s", h["code"], h["name"])
		}
	}

	log.Println("Herraje seeding completed")
}
