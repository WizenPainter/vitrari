package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/storage"
)

const (
	// JWT token expiration times
	AccessTokenExpiration  = 24 * time.Hour      // 24 hours
	RefreshTokenExpiration = 30 * 24 * time.Hour // 30 days
	ResetTokenExpiration   = 1 * time.Hour       // 1 hour

	// Account lockout settings
	MaxFailedAttempts = 5
	LockoutDuration   = 30 * time.Minute

	// Password hashing cost
	BcryptCost = 12
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrAccountLocked      = errors.New("account is temporarily locked due to too many failed login attempts")
	ErrAccountNotFound    = errors.New("account not found")
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrTokenExpired       = errors.New("token has expired")
	ErrEmailNotVerified   = errors.New("email address not verified")
)

// AuthService handles user authentication and authorization
type AuthService struct {
	storage   storage.Storage
	logger    *slog.Logger
	jwtSecret []byte
}

// NewAuthService creates a new authentication service
func NewAuthService(storage storage.Storage, logger *slog.Logger, jwtSecret string) *AuthService {
	if jwtSecret == "" {
		jwtSecret = "vitrari-default-secret-change-in-production" // Default for development
	}

	return &AuthService{
		storage:   storage,
		logger:    logger,
		jwtSecret: []byte(jwtSecret),
	}
}

// Register creates a new user account
func (s *AuthService) Register(req *models.UserCreateRequest) (*models.User, error) {
	s.logger.Info("Attempting to register new user", "email", req.Email)

	// Validate request
	if err := req.Validate(); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Check if email already exists
	existingUser, err := s.GetUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		return nil, ErrEmailAlreadyExists
	}

	// Hash password
	hashedPassword, err := s.hashPassword(req.Password)
	if err != nil {
		s.logger.Error("Failed to hash password", "error", err)
		return nil, fmt.Errorf("failed to process password: %w", err)
	}

	// Generate email verification token
	verificationToken, err := s.generateSecureToken()
	if err != nil {
		s.logger.Error("Failed to generate verification token", "error", err)
		return nil, fmt.Errorf("failed to generate verification token: %w", err)
	}

	// Create user
	user := &models.User{
		Email:                  strings.ToLower(strings.TrimSpace(req.Email)),
		PasswordHash:           hashedPassword,
		FirstName:              strings.TrimSpace(req.FirstName),
		LastName:               strings.TrimSpace(req.LastName),
		EmailVerified:          false, // Require email verification in production
		EmailVerificationToken: &verificationToken,
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}

	// Save to database
	err = s.createUser(user)
	if err != nil {
		s.logger.Error("Failed to create user in database", "error", err, "email", req.Email)
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	s.logger.Info("User registered successfully", "user_id", user.ID, "email", user.Email)

	// TODO: Send verification email in production
	// s.sendVerificationEmail(user)

	return user.ToSafeUser(), nil
}

// Login authenticates a user and returns a JWT token
func (s *AuthService) Login(req *models.UserLoginRequest, ipAddress, userAgent string) (*models.AuthResponse, error) {
	s.logger.Info("Attempting login", "email", req.Email, "ip", ipAddress)

	// Validate request
	if err := req.Validate(); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Get user by email
	user, err := s.GetUserByEmail(req.Email)
	if err != nil {
		s.logger.Info("Login attempt with non-existent email", "email", req.Email, "ip", ipAddress)
		return nil, ErrInvalidCredentials
	}

	// Check if account is locked
	if user.IsAccountLocked() {
		s.logger.Warn("Login attempt on locked account", "user_id", user.ID, "email", user.Email, "ip", ipAddress)
		return nil, ErrAccountLocked
	}

	// Verify password
	if !s.verifyPassword(req.Password, user.PasswordHash) {
		s.handleFailedLogin(user)
		s.logger.Warn("Failed login attempt - invalid password", "user_id", user.ID, "email", user.Email, "ip", ipAddress)
		return nil, ErrInvalidCredentials
	}

	// Reset failed attempts on successful login
	if err := s.resetFailedLoginAttempts(user.ID); err != nil {
		s.logger.Error("Failed to reset login attempts", "error", err, "user_id", user.ID)
	}

	// Update last login
	if err := s.updateLastLogin(user.ID); err != nil {
		s.logger.Error("Failed to update last login", "error", err, "user_id", user.ID)
	}

	// Generate JWT tokens
	tokenExpiration := AccessTokenExpiration
	if req.RememberMe {
		tokenExpiration = RefreshTokenExpiration
	}

	token, expiresAt, err := s.generateJWTToken(user, tokenExpiration)
	if err != nil {
		s.logger.Error("Failed to generate JWT token", "error", err, "user_id", user.ID)
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Create session record
	session := &models.UserSession{
		UserID:       user.ID,
		SessionToken: token,
		ExpiresAt:    expiresAt,
		IPAddress:    &ipAddress,
		UserAgent:    &userAgent,
		CreatedAt:    time.Now(),
		LastAccessed: time.Now(),
	}

	if err := s.createSession(session); err != nil {
		s.logger.Error("Failed to create session", "error", err, "user_id", user.ID)
		// Don't fail login if session creation fails
	}

	s.logger.Info("User logged in successfully", "user_id", user.ID, "email", user.Email, "ip", ipAddress)

	// Update user's last login
	user.LastLogin = &session.CreatedAt

	response := &models.AuthResponse{
		User:        user.ToSafeUser(),
		Token:       token,
		ExpiresAt:   expiresAt.Unix(),
		RedirectURL: "/",
		Message:     "Welcome to Vitrari! Login successful",
	}

	return response, nil
}

// ValidateToken validates a JWT token and returns the user
func (s *AuthService) ValidateToken(tokenString string) (*models.User, error) {
	// Parse token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	// Check expiration
	if exp, ok := claims["exp"].(float64); ok {
		if time.Now().Unix() > int64(exp) {
			return nil, ErrTokenExpired
		}
	}

	// Get user ID from claims
	userID, ok := claims["user_id"].(float64)
	if !ok {
		return nil, ErrInvalidToken
	}

	// Get user from database
	user, err := s.GetUserByID(int64(userID))
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(id int64) (*models.User, error) {
	return s.storage.GetUser(id)
}

// GetUserByEmail retrieves a user by email
func (s *AuthService) GetUserByEmail(email string) (*models.User, error) {
	return s.storage.GetUserByEmail(email)
}

// RequestPasswordReset initiates a password reset process
func (s *AuthService) RequestPasswordReset(email string) error {
	s.logger.Info("Password reset requested", "email", email)

	user, err := s.GetUserByEmail(email)
	if err != nil {
		// Don't reveal if email exists or not for security
		s.logger.Info("Password reset requested for non-existent email", "email", email)
		return nil // Return success regardless
	}

	// Generate reset token
	resetToken, err := s.generateSecureToken()
	if err != nil {
		s.logger.Error("Failed to generate reset token", "error", err)
		return fmt.Errorf("failed to generate reset token: %w", err)
	}

	// Set token expiration
	expiresAt := time.Now().Add(ResetTokenExpiration)

	// Update user with reset token
	if err := s.setPasswordResetToken(user.ID, resetToken, expiresAt); err != nil {
		s.logger.Error("Failed to set reset token", "error", err, "user_id", user.ID)
		return fmt.Errorf("failed to set reset token: %w", err)
	}

	// TODO: Send reset email in production
	// s.sendPasswordResetEmail(user, resetToken)

	s.logger.Info("Password reset token generated", "user_id", user.ID, "email", email)
	return nil
}

// ResetPassword resets a user's password using a reset token
func (s *AuthService) ResetPassword(req *models.UserResetPasswordRequest) error {
	s.logger.Info("Attempting password reset", "token", req.Token[:8]+"...")

	// Find user by reset token
	user, err := s.getUserByResetToken(req.Token)
	if err != nil {
		s.logger.Info("Invalid reset token used", "token", req.Token[:8]+"...")
		return ErrInvalidToken
	}

	// Check if token is expired
	if user.PasswordResetExpires == nil || time.Now().After(*user.PasswordResetExpires) {
		s.logger.Info("Expired reset token used", "user_id", user.ID, "token", req.Token[:8]+"...")
		return ErrTokenExpired
	}

	// Hash new password
	hashedPassword, err := s.hashPassword(req.Password)
	if err != nil {
		s.logger.Error("Failed to hash new password", "error", err, "user_id", user.ID)
		return fmt.Errorf("failed to process password: %w", err)
	}

	// Update password and clear reset token
	if err := s.updatePassword(user.ID, hashedPassword); err != nil {
		s.logger.Error("Failed to update password", "error", err, "user_id", user.ID)
		return fmt.Errorf("failed to update password: %w", err)
	}

	// Clear reset token
	if err := s.clearPasswordResetToken(user.ID); err != nil {
		s.logger.Error("Failed to clear reset token", "error", err, "user_id", user.ID)
		// Don't fail the operation if this fails
	}

	s.logger.Info("Password reset successfully", "user_id", user.ID)
	return nil
}

// Logout invalidates a user's session
func (s *AuthService) Logout(tokenString string) error {
	// Parse token to get session info
	user, err := s.ValidateToken(tokenString)
	if err != nil {
		// Token is already invalid, consider logout successful
		return nil
	}

	// Delete session from database
	if err := s.deleteSessionByToken(tokenString); err != nil {
		s.logger.Error("Failed to delete session", "error", err, "user_id", user.ID)
		return fmt.Errorf("failed to delete session: %w", err)
	}

	s.logger.Info("User logged out", "user_id", user.ID)
	return nil
}

// Private helper methods

func (s *AuthService) hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), BcryptCost)
	return string(bytes), err
}

func (s *AuthService) verifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (s *AuthService) generateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (s *AuthService) generateJWTToken(user *models.User, duration time.Duration) (string, time.Time, error) {
	expiresAt := time.Now().Add(duration)

	claims := jwt.MapClaims{
		"user_id":    user.ID,
		"email":      user.Email,
		"first_name": user.FirstName,
		"last_name":  user.LastName,
		"exp":        expiresAt.Unix(),
		"iat":        time.Now().Unix(),
		"iss":        "vitrari",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expiresAt, nil
}

func (s *AuthService) handleFailedLogin(user *models.User) {
	user.FailedLoginAttempts++

	if user.FailedLoginAttempts >= MaxFailedAttempts {
		lockUntil := time.Now().Add(LockoutDuration)
		user.AccountLockedUntil = &lockUntil
		s.logger.Warn("Account locked due to failed login attempts", "user_id", user.ID, "attempts", user.FailedLoginAttempts)
	}

	// Update in database
	s.updateFailedLoginAttempts(user.ID, user.FailedLoginAttempts, user.AccountLockedUntil)
}

// Database operations using storage layer
func (s *AuthService) createUser(user *models.User) error {
	return s.storage.CreateUser(user)
}

func (s *AuthService) createSession(session *models.UserSession) error {
	return s.storage.CreateSession(session)
}

func (s *AuthService) resetFailedLoginAttempts(userID int64) error {
	return s.storage.UpdateFailedLoginAttempts(userID, 0, nil)
}

func (s *AuthService) updateLastLogin(userID int64) error {
	return s.storage.UpdateLastLogin(userID)
}

func (s *AuthService) setPasswordResetToken(userID int64, token string, expiresAt time.Time) error {
	return s.storage.SetPasswordResetToken(userID, token, expiresAt)
}

func (s *AuthService) getUserByResetToken(token string) (*models.User, error) {
	return s.storage.GetUserByResetToken(token)
}

func (s *AuthService) updatePassword(userID int64, hashedPassword string) error {
	return s.storage.UpdateUserPassword(userID, hashedPassword)
}

func (s *AuthService) clearPasswordResetToken(userID int64) error {
	return s.storage.ClearPasswordResetToken(userID)
}

func (s *AuthService) deleteSessionByToken(token string) error {
	return s.storage.DeleteSession(token)
}

func (s *AuthService) updateFailedLoginAttempts(userID int64, attempts int, lockedUntil *time.Time) error {
	return s.storage.UpdateFailedLoginAttempts(userID, attempts, lockedUntil)
}

// ExtractTokenFromRequest extracts JWT token from HTTP request
func ExtractTokenFromRequest(r *http.Request) string {
	// Check Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		// Bearer token format
		if strings.HasPrefix(authHeader, "Bearer ") {
			return strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	// Check for token in cookies
	if cookie, err := r.Cookie("auth_token"); err == nil {
		return cookie.Value
	}

	// Check for token in query parameters (less secure, for special cases)
	return r.URL.Query().Get("token")
}
