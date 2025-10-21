package storage

import (
	"database/sql"
	_ "embed"
	"log/slog"

	_ "github.com/mattn/go-sqlite3"
)

//go:embed schema.sql
var schemaSQL string

// InitializeDatabase creates the database and runs migrations
func InitializeDatabase(dbPath string, logger *slog.Logger) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	// Enable foreign keys
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		logger.Error("Failed to enable foreign keys", "error", err)
		return nil, err
	}

	// Check if this is a new database or existing one
	isNewDB, err := isNewDatabase(db)
	if err != nil {
		logger.Error("Failed to check database state", "error", err)
		return nil, err
	}

	if isNewDB {
		// Fresh database - execute schema directly
		logger.Info("Creating new database schema")
		_, err = db.Exec(schemaSQL)
		if err != nil {
			logger.Error("Failed to execute schema", "error", err)
			return nil, err
		}
	} else {
		// Existing database - run migrations first
		logger.Info("Existing database detected, running migrations")
		if err := runMigrations(db, logger); err != nil {
			logger.Error("Failed to run migrations", "error", err)
			return nil, err
		}
	}

	logger.Info("Database initialized successfully")
	return db, nil
}

// isNewDatabase checks if the database is newly created
func isNewDatabase(db *sql.DB) (bool, error) {
	var count int
	err := db.QueryRow(`
		SELECT COUNT(*)
		FROM sqlite_master
		WHERE type='table' AND name NOT LIKE 'sqlite_%'
	`).Scan(&count)

	if err != nil {
		return false, err
	}

	return count == 0, nil
}

// runMigrations updates existing tables to match the current schema
func runMigrations(db *sql.DB, logger *slog.Logger) error {
	// Check if parent_id column exists in projects table
	var columnExists bool
	err := db.QueryRow(`
		SELECT COUNT(*) > 0
		FROM pragma_table_info('projects')
		WHERE name = 'parent_id'
	`).Scan(&columnExists)

	if err != nil {
		return err
	}

	// Add parent_id column if it doesn't exist
	if !columnExists {
		logger.Info("Migrating projects table to add hierarchical support")

		// SQLite doesn't support adding foreign key columns directly,
		// so we need to recreate the table
		_, err = db.Exec(`
			-- Create new projects table with all columns
			CREATE TABLE IF NOT EXISTS projects_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				description TEXT,
				parent_id INTEGER DEFAULT NULL,
				path TEXT NOT NULL DEFAULT '/',
				designs TEXT DEFAULT '[]',
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (parent_id) REFERENCES projects(id) ON DELETE CASCADE
			);

			-- Copy data from old table to new table
			INSERT INTO projects_new (id, name, description, designs, created_at, updated_at)
			SELECT id, name, description, designs, created_at, updated_at
			FROM projects;

			-- Drop old table
			DROP TABLE projects;

			-- Rename new table to projects
			ALTER TABLE projects_new RENAME TO projects;

			-- Recreate indexes
			CREATE INDEX IF NOT EXISTS idx_projects_parent_id ON projects(parent_id);
			CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(path);
		`)

		if err != nil {
			return err
		}

		logger.Info("Projects table migration completed")
	}

	// Check and migrate designs table for project_id if needed
	err = db.QueryRow(`
		SELECT COUNT(*) > 0
		FROM pragma_table_info('designs')
		WHERE name = 'project_id'
	`).Scan(&columnExists)

	if err == nil && !columnExists {
		logger.Info("Migrating designs table to add project_id")

		_, err = db.Exec(`
			CREATE TABLE IF NOT EXISTS designs_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				description TEXT,
				width REAL NOT NULL,
				height REAL NOT NULL,
				thickness REAL NOT NULL,
				design_data TEXT NOT NULL,
				project_id INTEGER DEFAULT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
			);

			INSERT INTO designs_new (id, name, description, width, height, thickness, design_data, created_at, updated_at)
			SELECT id, name, description, width, height, thickness, design_data, created_at, updated_at
			FROM designs;

			DROP TABLE designs;
			ALTER TABLE designs_new RENAME TO designs;

			CREATE INDEX IF NOT EXISTS idx_designs_project_id ON designs(project_id);
			CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at DESC);
		`)

		if err != nil {
			logger.Warn("Failed to migrate designs table", "error", err)
		} else {
			logger.Info("Designs table migration completed")
		}
	}

	// Check and migrate optimizations table for project_id if needed
	err = db.QueryRow(`
		SELECT COUNT(*) > 0
		FROM pragma_table_info('optimizations')
		WHERE name = 'project_id'
	`).Scan(&columnExists)

	if err == nil && !columnExists {
		logger.Info("Migrating optimizations table to add project_id")

		_, err = db.Exec(`
			CREATE TABLE IF NOT EXISTS optimizations_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				sheet_id INTEGER NOT NULL,
				design_ids TEXT NOT NULL,
				layout_data TEXT NOT NULL,
				waste_percentage REAL NOT NULL,
				total_area REAL NOT NULL,
				used_area REAL NOT NULL,
				algorithm TEXT DEFAULT 'blf',
				execution_time REAL DEFAULT 0,
				project_id INTEGER DEFAULT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (sheet_id) REFERENCES glass_sheets(id) ON DELETE CASCADE,
				FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
			);

			INSERT INTO optimizations_new (id, name, sheet_id, design_ids, layout_data, waste_percentage, total_area, used_area, algorithm, execution_time, created_at)
			SELECT id, name, sheet_id, design_ids, layout_data, waste_percentage, total_area, used_area, 'blf', 0, created_at
			FROM optimizations;

			DROP TABLE optimizations;
			ALTER TABLE optimizations_new RENAME TO optimizations;

			CREATE INDEX IF NOT EXISTS idx_optimizations_project_id ON optimizations(project_id);
			CREATE INDEX IF NOT EXISTS idx_optimizations_sheet_id ON optimizations(sheet_id);
			CREATE INDEX IF NOT EXISTS idx_optimizations_created_at ON optimizations(created_at DESC);
		`)

		if err != nil {
			logger.Warn("Failed to migrate optimizations table", "error", err)
		} else {
			logger.Info("Optimizations table migration completed")
		}
	}

	// Ensure all tables exist (for cases where some tables are missing)
	logger.Info("Ensuring all required tables and indexes exist")
	_, err = db.Exec(`
		-- Create glass_sheets if not exists
		CREATE TABLE IF NOT EXISTS glass_sheets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			width REAL NOT NULL,
			height REAL NOT NULL,
			thickness REAL NOT NULL,
			price_per_sqm REAL NOT NULL,
			in_stock INTEGER DEFAULT 0,
			material TEXT DEFAULT 'clear',
			supplier TEXT DEFAULT '',
			grade TEXT DEFAULT 'standard',
			properties TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_glass_sheets_thickness ON glass_sheets(thickness);
	`)

	if err != nil {
		logger.Warn("Failed to ensure glass_sheets table", "error", err)
	}

	return nil
}
