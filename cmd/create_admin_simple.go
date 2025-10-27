package main

import (
	"database/sql"
	"fmt"
	"log"
	"log/slog"
	"os"
	"strings"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/services"
	"glass-optimizer/internal/storage"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	if len(os.Args) < 5 {
		fmt.Println("Usage: go run create_admin_simple.go <first_name> <last_name> <email> <password>")
		fmt.Println("")
		fmt.Println("Example:")
		fmt.Println("  go run create_admin_simple.go John Admin admin@vitrari.com MySecurePassword123!")
		fmt.Println("")
		fmt.Println("Note: Use @vitrari.com or @admin.com emails for admin privileges")
		os.Exit(1)
	}

	firstName := strings.TrimSpace(os.Args[1])
	lastName := strings.TrimSpace(os.Args[2])
	email := strings.TrimSpace(strings.ToLower(os.Args[3]))
	password := os.Args[4]

	// Validate inputs
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

	// Initialize database with proper schema
	dbPath := getEnv("DB_PATH", "./database/glass_optimizer.db")
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	// Initialize database with schema
	db, err := storage.InitializeDatabase(dbPath, logger)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize services
	storageImpl := storage.NewSQLiteStorage(db, logger)
	authService := services.NewAuthService(storageImpl, logger, getEnv("JWT_SECRET", ""))

	// Create admin request
	adminReq := &models.UserCreateRequest{
		Email:     email,
		Password:  password,
		FirstName: firstName,
		LastName:  lastName,
	}

	// Create the admin account
	user, err := authService.Register(adminReq)
	if err != nil {
		if strings.Contains(err.Error(), "email already exists") {
			fmt.Printf("❌ A user with email %s already exists.\n", email)
		} else {
			fmt.Printf("❌ Failed to create admin account: %v\n", err)
		}
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
	fmt.Println()

	if isAdminEmail(user.Email) {
		fmt.Println("🛡️  Admin privileges are automatically granted for this email domain")
	} else {
		fmt.Println("⚠️  Note: This account does NOT have admin privileges due to email domain")
		fmt.Println("   Admin privileges are only granted to @vitrari.com and @admin.com emails")
	}

	fmt.Println()
	fmt.Println("🔐 You can now log in with these credentials at /auth")
	fmt.Println("🚀 Start the server with: go run main.go")
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
