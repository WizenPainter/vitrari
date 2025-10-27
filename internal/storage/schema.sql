-- Vitrari Database Schema

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email_verified INTEGER DEFAULT 0,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires DATETIME,
    last_login DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- User sessions table for managing active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Vitrari Database Schema

-- Projects table with hierarchical support
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    user_id INTEGER NOT NULL,        -- Owner of the project
    parent_id INTEGER DEFAULT NULL,  -- NULL for root projects, otherwise references parent project
    path TEXT NOT NULL DEFAULT '/',  -- Path like /project1/subproject1 for easy querying
    designs TEXT DEFAULT '[]',       -- JSON array of design IDs with quantities (for backward compatibility)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Index for faster hierarchical queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
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
    user_id INTEGER NOT NULL,       -- Owner of the design
    project_id INTEGER DEFAULT NULL,  -- Link to project
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);
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
    user_id INTEGER NOT NULL,        -- Owner of the optimization
    project_id INTEGER DEFAULT NULL,  -- Link to project
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sheet_id) REFERENCES glass_sheets(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_optimizations_user_id ON optimizations(user_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_project_id ON optimizations(project_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_sheet_id ON optimizations(sheet_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_created_at ON optimizations(created_at DESC);
