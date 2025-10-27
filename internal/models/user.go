package models

import (
	"database/sql"
	"time"
)

// User represents a user in the Vitrari system
type User struct {
	ID                     int64      `json:"id" db:"id"`
	Email                  string     `json:"email" db:"email"`
	PasswordHash           string     `json:"-" db:"password_hash"` // Never include in JSON
	FirstName              string     `json:"first_name" db:"first_name"`
	LastName               string     `json:"last_name" db:"last_name"`
	EmailVerified          bool       `json:"email_verified" db:"email_verified"`
	EmailVerificationToken *string    `json:"-" db:"email_verification_token"`
	PasswordResetToken     *string    `json:"-" db:"password_reset_token"`
	PasswordResetExpires   *time.Time `json:"-" db:"password_reset_expires"`
	LastLogin              *time.Time `json:"last_login" db:"last_login"`
	FailedLoginAttempts    int        `json:"-" db:"failed_login_attempts"`
	AccountLockedUntil     *time.Time `json:"-" db:"account_locked_until"`
	CreatedAt              time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at" db:"updated_at"`
}

// UserSession represents an active user session
type UserSession struct {
	ID           int64     `json:"id" db:"id"`
	UserID       int64     `json:"user_id" db:"user_id"`
	SessionToken string    `json:"-" db:"session_token"` // Never include in JSON
	ExpiresAt    time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	LastAccessed time.Time `json:"last_accessed" db:"last_accessed"`
	IPAddress    *string   `json:"ip_address" db:"ip_address"`
	UserAgent    *string   `json:"user_agent" db:"user_agent"`
}

// UserCreateRequest represents the data required to create a new user
type UserCreateRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=8"`
	FirstName string `json:"firstName" validate:"required,min=1"`
	LastName  string `json:"lastName" validate:"required,min=1"`
}

// UserLoginRequest represents login credentials
type UserLoginRequest struct {
	Email      string `json:"email" validate:"required,email"`
	Password   string `json:"password" validate:"required"`
	RememberMe bool   `json:"rememberMe"`
}

// UserForgotPasswordRequest represents forgot password request
type UserForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// UserResetPasswordRequest represents password reset request
type UserResetPasswordRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=8"`
}

// AuthResponse represents the response after successful authentication
type AuthResponse struct {
	User         *User  `json:"user"`
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token,omitempty"`
	ExpiresAt    int64  `json:"expires_at"`
	RedirectURL  string `json:"redirectUrl,omitempty"`
	Message      string `json:"message"`
}

// GetFullName returns the user's full name
func (u *User) GetFullName() string {
	return u.FirstName + " " + u.LastName
}

// IsAccountLocked checks if the user's account is currently locked
func (u *User) IsAccountLocked() bool {
	if u.AccountLockedUntil == nil {
		return false
	}
	return time.Now().Before(*u.AccountLockedUntil)
}

// IsSessionExpired checks if the session is expired
func (s *UserSession) IsSessionExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// ToSafeUser returns a user object safe for JSON serialization (without sensitive fields)
func (u *User) ToSafeUser() *User {
	return &User{
		ID:            u.ID,
		Email:         u.Email,
		FirstName:     u.FirstName,
		LastName:      u.LastName,
		EmailVerified: u.EmailVerified,
		LastLogin:     u.LastLogin,
		CreatedAt:     u.CreatedAt,
		UpdatedAt:     u.UpdatedAt,
	}
}

// TableName returns the database table name for User
func (User) TableName() string {
	return "users"
}

// TableName returns the database table name for UserSession
func (UserSession) TableName() string {
	return "user_sessions"
}

// Validate performs basic validation on UserCreateRequest
func (req *UserCreateRequest) Validate() error {
	if req.Email == "" {
		return sql.ErrNoRows // Using as validation error placeholder
	}
	if req.Password == "" || len(req.Password) < 8 {
		return sql.ErrNoRows
	}
	if req.FirstName == "" {
		return sql.ErrNoRows
	}
	if req.LastName == "" {
		return sql.ErrNoRows
	}
	return nil
}

// Validate performs basic validation on UserLoginRequest
func (req *UserLoginRequest) Validate() error {
	if req.Email == "" {
		return sql.ErrNoRows
	}
	if req.Password == "" {
		return sql.ErrNoRows
	}
	return nil
}
