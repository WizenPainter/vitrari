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
	fmt.Println("🛡️  Vitrari Admin Account Creator")
	fmt.Println("=================================")
	fmt.Println()

	// Check if database exists
	dbPath := getEnv("DB_PATH", "./database/glass_optimizer.db")
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		fmt.Printf("❌ Database not found at %s\n", dbPath)
		fmt.Println("Please run the main application first to initialize the database.")
		os.Exit(1)
	}

	// Initialize database connection
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize services
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	storageImpl := storage.NewSQLiteStorage(db, logger)
	authService := services.NewAuthService(storageImpl, logger, getEnv("JWT_SECRET", ""))

	// Get admin details from user input
	adminReq := getAdminInput()

	// Create the admin account
	user, err := authService.Register(adminReq)
	if err != nil {
		if strings.Contains(err.Error(), "email already exists") {
			fmt.Printf("❌ A user with email %s already exists.\n", adminReq.Email)
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

func getAdminInput() *models.UserCreateRequest {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("Please provide the admin account details:")
	fmt.Println()

	// Get first name
	fmt.Print("👤 First Name: ")
	firstName, _ := reader.ReadString('\n')
	firstName = strings.TrimSpace(firstName)
	for firstName == "" {
		fmt.Println("❌ First name cannot be empty.")
		fmt.Print("👤 First Name: ")
		firstName, _ = reader.ReadString('\n')
		firstName = strings.TrimSpace(firstName)
	}

	// Get last name
	fmt.Print("👤 Last Name: ")
	lastName, _ := reader.ReadString('\n')
	lastName = strings.TrimSpace(lastName)
	for lastName == "" {
		fmt.Println("❌ Last name cannot be empty.")
		fmt.Print("👤 Last Name: ")
		lastName, _ = reader.ReadString('\n')
		lastName = strings.TrimSpace(lastName)
	}

	// Get email with validation
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

	// Get password with confirmation
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

	return &models.UserCreateRequest{
		Email:     email,
		Password:  password,
		FirstName: firstName,
		LastName:  lastName,
	}
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
