-- Glass Optimizer Database Schema

-- Projects table with hierarchical support
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER DEFAULT NULL,  -- NULL for root projects, otherwise references parent project
    path TEXT NOT NULL DEFAULT '/',  -- Path like /project1/subproject1 for easy querying
    designs TEXT DEFAULT '[]',       -- JSON array of design IDs with quantities (for backward compatibility)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Index for faster hierarchical queries
CREATE INDEX IF NOT EXISTS idx_projects_parent_id ON projects(parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(path);

-- Designs table
CREATE TABLE IF NOT EXISTS designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    width REAL NOT NULL,
    height REAL NOT NULL,
    thickness REAL NOT NULL,
    design_data TEXT NOT NULL,  -- JSON blob with holes, shapes, etc.
    project_id INTEGER DEFAULT NULL,  -- Link to project
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_designs_project_id ON designs(project_id);
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at DESC);

-- Glass sheets table
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
    properties TEXT,  -- JSON blob for additional properties
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_glass_sheets_thickness ON glass_sheets(thickness);

-- Optimizations table
CREATE TABLE IF NOT EXISTS optimizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sheet_id INTEGER NOT NULL,
    design_ids TEXT NOT NULL,  -- JSON array of design IDs
    layout_data TEXT NOT NULL,  -- JSON blob with optimization results
    waste_percentage REAL NOT NULL,
    total_area REAL NOT NULL,
    used_area REAL NOT NULL,
    algorithm TEXT DEFAULT 'blf',  -- blf, genetic, greedy
    execution_time REAL DEFAULT 0,  -- in seconds
    project_id INTEGER DEFAULT NULL,  -- Link to project
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sheet_id) REFERENCES glass_sheets(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_optimizations_project_id ON optimizations(project_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_sheet_id ON optimizations(sheet_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_created_at ON optimizations(created_at DESC);
