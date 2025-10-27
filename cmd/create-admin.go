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
	"time"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/services"
	"glass-optimizer/internal/storage"

	_ "github.com/mattn/go-sqlite3"
)

const (
	BcryptCost = 12
	DBPath     = "./database/glass_optimizer.db"
)

func main() {
	fmt.Println("🛡️  Vitrari Admin Account Creator")
	fmt.Println("=====================================")
	fmt.Println()

	// Initialize database connection
	db, err := sql.Open("sqlite3", DBPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize storage and auth service
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	storageImpl := storage.NewSQLiteStorage(db, logger)
	authService := services.NewAuthService(storageImpl, logger, os.Getenv("JWT_SECRET"))

	// Get admin details from user
	adminUser := getAdminDetails()

	// Create the admin account
	err = createAdminAccount(authService, adminUser)
	if err != nil {
		log.Fatalf("Failed to create admin account: %v", err)
	}

	fmt.Println()
	fmt.Println("✅ Admin account created successfully!")
	fmt.Printf("📧 Email: %s\n", adminUser.Email)
	fmt.Printf("👤 Name: %s %s\n", adminUser.FirstName, adminUser.LastName)
	fmt.Println()
	fmt.Println("🔐 You can now log in with these credentials at /auth")
	fmt.Println("🛡️  Admin privileges are automatically granted for @vitrari.com and @admin.com email addresses")
}

func getAdminDetails() *models.User {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("Please provide the admin account details:")
	fmt.Println()

	// Get first name
	fmt.Print("👤 First Name: ")
	firstName, _ := reader.ReadString('\n')
	firstName = strings.TrimSpace(firstName)

	// Get last name
	fmt.Print("👤 Last Name: ")
	lastName, _ := reader.ReadString('\n')
	lastName = strings.TrimSpace(lastName)

	// Get email with validation
	var email string
	for {
		fmt.Print("📧 Email (must end with @vitrari.com or @admin.com for admin privileges): ")
		email, _ = reader.ReadString('\n')
		email = strings.TrimSpace(strings.ToLower(email))

		if email == "" {
			fmt.Println("❌ Email cannot be empty. Please try again.")
			continue
		}

		if !strings.Contains(email, "@") {
			fmt.Println("❌ Please enter a valid email address.")
			continue
		}

		// Warn if not admin domain
		if !strings.HasSuffix(email, "@vitrari.com") && !strings.HasSuffix(email, "@admin.com") {
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
			fmt.Println("❌ Error reading password:", err)
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
			fmt.Println("❌ Error reading password confirmation:", err)
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

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), BcryptCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	return &models.User{
		Email:         email,
		PasswordHash:  string(hashedPassword),
		FirstName:     firstName,
		LastName:      lastName,
		EmailVerified: true, // Admin accounts are pre-verified
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
}

func createAdminAccount(authService *services.AuthService, user *models.User) error {
	// Check if email already exists
	existingUser, err := authService.GetUserByEmail(user.Email)
	if err == nil && existingUser != nil {
		return fmt.Errorf("user with email %s already exists", user.Email)
	}

	// Create the user using the auth service storage directly
	// We bypass the normal registration process since we're creating pre-verified admin
	req := &models.UserCreateRequest{
		Email:     user.Email,
		Password:  "temp", // We'll use the pre-hashed password
		FirstName: user.FirstName,
		LastName:  user.LastName,
	}

	// Create user record directly in database
	// Note: We need to use the storage layer directly since we want to set email_verified = true
	db, err := sql.Open("sqlite3", DBPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}
	defer db.Close()

	query := `
		INSERT INTO users (
			email, password_hash, first_name, last_name,
			email_verified, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	_, err = db.Exec(query,
		user.Email,
		user.PasswordHash,
		user.FirstName,
		user.LastName,
		true, // email_verified = true for admin
		user.CreatedAt,
		user.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create admin user: %v", err)
	}

	return nil
}
