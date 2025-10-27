package main

import (
	"bufio"
	"database/sql"
	"fmt"
	"log"
	"log/slog"
	"os"
	"strings"
	"syscall"

	"golang.org/x/term"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/services"
	"glass-optimizer/internal/storage"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	fmt.Println("🛡️  Vitrari Complete Admin Setup")
	fmt.Println("==================================")
	fmt.Println()

	// Check for command line arguments
	if len(os.Args) > 1 {
		if os.Args[1] == "--help" || os.Args[1] == "-h" {
			showHelp()
			return
		}
		if len(os.Args) >= 5 {
			// Non-interactive mode
			createAdminNonInteractive(os.Args[1], os.Args[2], os.Args[3], os.Args[4])
			return
		}
	}

	// Interactive mode
	createAdminInteractive()
}

func showHelp() {
	fmt.Println("Vitrari Admin Setup Tool")
	fmt.Println("========================")
	fmt.Println()
	fmt.Println("Usage:")
	fmt.Println("  Interactive mode:")
	fmt.Println("    go run setup_admin.go")
	fmt.Println()
	fmt.Println("  Non-interactive mode:")
	fmt.Println("    go run setup_admin.go <first_name> <last_name> <email> <password>")
	fmt.Println()
	fmt.Println("Examples:")
	fmt.Println("  go run setup_admin.go")
	fmt.Println("  go run setup_admin.go \"John\" \"Admin\" \"john@vitrari.com\" \"MyPassword123!\"")
	fmt.Println()
	fmt.Println("Admin Privileges:")
	fmt.Println("  - Accounts with @vitrari.com emails have admin privileges")
	fmt.Println("  - Accounts with @admin.com emails have admin privileges")
	fmt.Println("  - Other domains will create regular user accounts")
	fmt.Println()
	fmt.Println("Environment Variables:")
	fmt.Println("  DB_PATH     - Database file path (default: ./database/glass_optimizer.db)")
	fmt.Println("  JWT_SECRET  - JWT signing secret (optional)")
}

func createAdminInteractive() {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("This tool will:")
	fmt.Println("✓ Initialize the database if needed")
	fmt.Println("✓ Create authentication tables")
	fmt.Println("✓ Create an admin user account")
	fmt.Println("✓ Set up proper permissions")
	fmt.Println()

	// Get admin details from user input
	fmt.Println("Please provide the admin account details:")
	fmt.Println()

	// First Name
	fmt.Print("👤 First Name: ")
	firstName, _ := reader.ReadString('\n')
	firstName = strings.TrimSpace(firstName)
	for firstName == "" {
		fmt.Println("❌ First name cannot be empty.")
		fmt.Print("👤 First Name: ")
		firstName, _ = reader.ReadString('\n')
		firstName = strings.TrimSpace(firstName)
	}

	// Last Name
	fmt.Print("👤 Last Name: ")
	lastName, _ := reader.ReadString('\n')
	lastName = strings.TrimSpace(lastName)
	for lastName == "" {
		fmt.Println("❌ Last name cannot be empty.")
		fmt.Print("👤 Last Name: ")
		lastName, _ = reader.ReadString('\n')
		lastName = strings.TrimSpace(lastName)
	}

	// Email with validation
	var email string
	for {
		fmt.Print("📧 Email (recommended: @vitrari.com or @admin.com for admin privileges): ")
		email, _ = reader.ReadString('\n')
		email = strings.TrimSpace(strings.ToLower(email))

		if email == "" {
			fmt.Println("❌ Email cannot be empty. Please try again.")
			continue
		}

		if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
			fmt.Println("❌ Please enter a valid email address.")
			continue
		}

		// Warn if not admin domain
		if !isAdminEmail(email) {
			fmt.Println("⚠️  Warning: This email domain will NOT have admin privileges.")
			fmt.Println("   Admin privileges are only granted to @vitrari.com and @admin.com emails.")
			fmt.Print("   Continue anyway? (y/N): ")
			confirm, _ := reader.ReadString('\n')
			confirm = strings.TrimSpace(strings.ToLower(confirm))
			if confirm != "y" && confirm != "yes" {
				continue
			}
		}
		break
	}

	// Password with confirmation
	var password string
	for {
		fmt.Print("🔒 Password (minimum 8 characters): ")
		passwordBytes, err := term.ReadPassword(int(syscall.Stdin))
		if err != nil {
			fmt.Printf("❌ Error reading password: %v\n", err)
			continue
		}
		password = string(passwordBytes)
		fmt.Println() // New line after hidden input

		if len(password) < 8 {
			fmt.Println("❌ Password must be at least 8 characters long.")
			continue
		}

		fmt.Print("🔒 Confirm Password: ")
		confirmBytes, err := term.ReadPassword(int(syscall.Stdin))
		if err != nil {
			fmt.Printf("❌ Error reading password confirmation: %v\n", err)
			continue
		}
		confirm := string(confirmBytes)
		fmt.Println() // New line after hidden input

		if password != confirm {
			fmt.Println("❌ Passwords do not match. Please try again.")
			continue
		}
		break
	}

	createAdmin(firstName, lastName, email, password)
}

func createAdminNonInteractive(firstName, lastName, email, password string) {
	// Validate inputs
	firstName = strings.TrimSpace(firstName)
	lastName = strings.TrimSpace(lastName)
	email = strings.TrimSpace(strings.ToLower(email))

	if firstName == "" {
		fmt.Println("❌ First name cannot be empty")
		os.Exit(1)
	}
	if lastName == "" {
		fmt.Println("❌ Last name cannot be empty")
		os.Exit(1)
	}
	if email == "" || !strings.Contains(email, "@") {
		fmt.Println("❌ Please provide a valid email address")
		os.Exit(1)
	}
	if len(password) < 8 {
		fmt.Println("❌ Password must be at least 8 characters long")
		os.Exit(1)
	}

	fmt.Printf("🛡️  Creating admin account for %s %s (%s)\n", firstName, lastName, email)

	if !isAdminEmail(email) {
		fmt.Println("⚠️  Warning: This email domain will NOT have admin privileges.")
		fmt.Println("   Admin privileges are only granted to @vitrari.com and @admin.com emails.")
	}

	createAdmin(firstName, lastName, email, password)
}

func createAdmin(firstName, lastName, email, password string) {
	// Initialize database with proper schema
	dbPath := getEnv("DB_PATH", "./database/glass_optimizer.db")
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	fmt.Println("🔄 Initializing database...")

	// Ensure database directory exists
	if err := os.MkdirAll("database", 0755); err != nil {
		log.Fatalf("Failed to create database directory: %v", err)
	}

	// Initialize database with schema
	db, err := storage.InitializeDatabase(dbPath, logger)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Ensure authentication tables exist (in case they weren't created)
	fmt.Println("🔄 Setting up authentication tables...")
	err = ensureAuthTables(db)
	if err != nil {
		log.Fatalf("Failed to create authentication tables: %v", err)
	}

	// Initialize services
	storageImpl := storage.NewSQLiteStorage(db, logger)
	authService := services.NewAuthService(storageImpl, logger, getEnv("JWT_SECRET", ""))

	// Check if user already exists
	existingUser, _ := authService.GetUserByEmail(email)
	if existingUser != nil {
		fmt.Printf("❌ A user with email %s already exists.\n", email)
		fmt.Println("If you want to reset this account, please delete it first:")
		fmt.Printf("   sqlite3 %s \"DELETE FROM users WHERE email = '%s';\"\n", dbPath, email)
		os.Exit(1)
	}

	// Create admin request
	adminReq := &models.UserCreateRequest{
		Email:     email,
		Password:  password,
		FirstName: firstName,
		LastName:  lastName,
	}

	fmt.Println("🔄 Creating admin account...")

	// Create the admin account
	user, err := authService.Register(adminReq)
	if err != nil {
		fmt.Printf("❌ Failed to create admin account: %v\n", err)
		os.Exit(1)
	}

	// Update user to be email verified (admin accounts are pre-verified)
	err = markEmailVerified(db, user.Email)
	if err != nil {
		fmt.Printf("⚠️  Warning: Failed to mark email as verified: %v\n", err)
	}

	fmt.Println()
	fmt.Println("✅ Admin account created successfully!")
	fmt.Printf("📧 Email: %s\n", user.Email)
	fmt.Printf("👤 Name: %s %s\n", user.FirstName, user.LastName)
	fmt.Printf("🆔 User ID: %d\n", user.ID)
	fmt.Println()

	if isAdminEmail(user.Email) {
		fmt.Println("🛡️  Admin privileges are automatically granted for this email domain")
		fmt.Println("✓ Can access administrative endpoints")
		fmt.Println("✓ Can manage system settings")
		fmt.Println("✓ Can manage other users")
	} else {
		fmt.Println("⚠️  Note: This account does NOT have admin privileges due to email domain")
		fmt.Println("   Admin privileges are only granted to @vitrari.com and @admin.com emails")
		fmt.Println("   To grant admin privileges, change the email domain:")
		fmt.Printf("   sqlite3 %s \"UPDATE users SET email = 'user@vitrari.com' WHERE id = %d;\"\n", dbPath, user.ID)
	}

	fmt.Println()
	fmt.Println("🔐 You can now log in with these credentials at:")
	fmt.Println("   http://localhost:9995/auth")
	fmt.Println()
	fmt.Println("🚀 Start the server with:")
	fmt.Println("   go run main.go")
	fmt.Println()
	fmt.Println("📊 Check the server logs for any issues")
}

func ensureAuthTables(db *sql.DB) error {
	authTablesSQL := `
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
	`

	_, err := db.Exec(authTablesSQL)
	return err
}

func isAdminEmail(email string) bool {
	return strings.HasSuffix(email, "@vitrari.com") || strings.HasSuffix(email, "@admin.com")
}

func markEmailVerified(db *sql.DB, email string) error {
	query := `UPDATE users SET email_verified = 1 WHERE email = ?`
	_, err := db.Exec(query, email)
	return err
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
