package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/services"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	authService *services.AuthService
	logger      *slog.Logger
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(authService *services.AuthService, logger *slog.Logger) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		logger:      logger,
	}
}

// HandleLogin handles user login requests
func (h *AuthHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Method not allowed")
		return
	}

	// Parse request body
	var req models.UserLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("Failed to decode login request", "error", err)
		h.sendError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	// Validate request
	if err := req.Validate(); err != nil {
		h.sendError(w, http.StatusBadRequest, "validation_error", "Email and password are required")
		return
	}

	// Get client info
	ipAddress := getClientIP(r)
	userAgent := r.UserAgent()

	// Attempt login
	authResponse, err := h.authService.Login(&req, ipAddress, userAgent)
	if err != nil {
		h.logger.Info("Login failed", "email", req.Email, "error", err.Error(), "ip", ipAddress)

		var message string
		var statusCode int

		switch err {
		case services.ErrInvalidCredentials:
			statusCode = http.StatusUnauthorized
			message = "Invalid email or password"
		case services.ErrAccountLocked:
			statusCode = http.StatusLocked
			message = "Account is temporarily locked due to too many failed login attempts"
		case services.ErrEmailNotVerified:
			statusCode = http.StatusForbidden
			message = "Please verify your email address before logging in"
		default:
			statusCode = http.StatusInternalServerError
			message = "An error occurred during login. Please try again."
		}

		h.sendError(w, statusCode, "login_failed", message)
		return
	}

	// Always set auth cookie for successful login
	// RememberMe only affects expiration time (already handled in token generation)
	h.setAuthCookie(w, authResponse.Token, time.Unix(authResponse.ExpiresAt, 0))

	h.logger.Info("User logged in successfully",
		"user_id", authResponse.User.ID,
		"email", authResponse.User.Email,
		"ip", ipAddress)

	h.sendJSON(w, http.StatusOK, authResponse)
}

// HandleSignup handles user registration requests
func (h *AuthHandler) HandleSignup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Method not allowed")
		return
	}

	// Parse request body
	var req models.UserCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("Failed to decode signup request", "error", err)
		h.sendError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	// Validate request
	if err := req.Validate(); err != nil {
		h.sendError(w, http.StatusBadRequest, "validation_error", "All fields are required")
		return
	}

	// Additional validation
	if len(req.Password) < 8 {
		h.sendError(w, http.StatusBadRequest, "validation_error", "Password must be at least 8 characters long")
		return
	}

	if !isValidEmail(req.Email) {
		h.sendError(w, http.StatusBadRequest, "validation_error", "Please provide a valid email address")
		return
	}

	// Create user
	user, err := h.authService.Register(&req)
	if err != nil {
		h.logger.Error("Registration failed", "email", req.Email, "error", err.Error())

		var message string
		var statusCode int

		switch err {
		case services.ErrEmailAlreadyExists:
			statusCode = http.StatusConflict
			message = "An account with this email address already exists"
		default:
			statusCode = http.StatusInternalServerError
			message = "An error occurred during registration. Please try again."
		}

		h.sendError(w, statusCode, "registration_failed", message)
		return
	}

	h.logger.Info("User registered successfully",
		"user_id", user.ID,
		"email", user.Email,
		"ip", getClientIP(r))

	response := models.SuccessResponse{
		Success: true,
		Message: "Welcome to Vitrari! Account created successfully. Please check your email for verification instructions.",
		Data:    user,
	}

	h.sendJSON(w, http.StatusCreated, response)
}

// HandleForgotPassword handles password reset requests
func (h *AuthHandler) HandleForgotPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Method not allowed")
		return
	}

	// Parse request body
	var req models.UserForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("Failed to decode forgot password request", "error", err)
		h.sendError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	// Validate email
	if req.Email == "" || !isValidEmail(req.Email) {
		h.sendError(w, http.StatusBadRequest, "validation_error", "Please provide a valid email address")
		return
	}

	// Request password reset
	err := h.authService.RequestPasswordReset(req.Email)
	if err != nil {
		h.logger.Error("Password reset request failed", "email", req.Email, "error", err.Error())
		h.sendError(w, http.StatusInternalServerError, "reset_failed", "An error occurred. Please try again.")
		return
	}

	h.logger.Info("Password reset requested", "email", req.Email, "ip", getClientIP(r))

	response := models.SuccessResponse{
		Success: true,
		Message: "If an account with this email exists, you will receive password reset instructions.",
	}

	h.sendJSON(w, http.StatusOK, response)
}

// HandleResetPassword handles password reset with token
func (h *AuthHandler) HandleResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Method not allowed")
		return
	}

	// Parse request body
	var req models.UserResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("Failed to decode reset password request", "error", err)
		h.sendError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	// Validate request
	if req.Token == "" {
		h.sendError(w, http.StatusBadRequest, "validation_error", "Reset token is required")
		return
	}

	if len(req.Password) < 8 {
		h.sendError(w, http.StatusBadRequest, "validation_error", "Password must be at least 8 characters long")
		return
	}

	// Reset password
	err := h.authService.ResetPassword(&req)
	if err != nil {
		h.logger.Info("Password reset failed", "token", req.Token[:8]+"...", "error", err.Error())

		var message string
		var statusCode int

		switch err {
		case services.ErrInvalidToken:
			statusCode = http.StatusBadRequest
			message = "Invalid or expired reset token"
		case services.ErrTokenExpired:
			statusCode = http.StatusBadRequest
			message = "Reset token has expired. Please request a new one."
		default:
			statusCode = http.StatusInternalServerError
			message = "An error occurred. Please try again."
		}

		h.sendError(w, statusCode, "reset_failed", message)
		return
	}

	h.logger.Info("Password reset successfully", "ip", getClientIP(r))

	response := models.SuccessResponse{
		Success: true,
		Message: "Password reset successfully. You can now log in with your new password.",
	}

	h.sendJSON(w, http.StatusOK, response)
}

// HandleLogout handles user logout requests
func (h *AuthHandler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Method not allowed")
		return
	}

	// Extract token from request
	token := services.ExtractTokenFromRequest(r)
	if token == "" {
		h.sendError(w, http.StatusBadRequest, "no_token", "No authentication token provided")
		return
	}

	// Logout user
	err := h.authService.Logout(token)
	if err != nil {
		h.logger.Error("Logout failed", "error", err.Error())
		// Don't fail logout even if there's an error
	}

	// Clear auth cookie
	h.clearAuthCookie(w)

	h.logger.Info("User logged out", "ip", getClientIP(r))

	response := models.SuccessResponse{
		Success: true,
		Message: "Logged out successfully",
	}

	h.sendJSON(w, http.StatusOK, response)
}

// HandleMe handles getting current user information
func (h *AuthHandler) HandleMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Method not allowed")
		return
	}

	// Extract token from request
	token := services.ExtractTokenFromRequest(r)
	if token == "" {
		h.sendError(w, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	// Validate token and get user
	user, err := h.authService.ValidateToken(token)
	if err != nil {
		h.logger.Info("Invalid token in /me request", "error", err.Error())
		h.sendError(w, http.StatusUnauthorized, "invalid_token", "Invalid or expired token")
		return
	}

	h.sendJSON(w, http.StatusOK, models.SuccessResponse{
		Success: true,
		Message: "User information retrieved successfully",
		Data:    user.ToSafeUser(),
	})
}

// HandleVerifyEmail handles email verification
func (h *AuthHandler) HandleVerifyEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Method not allowed")
		return
	}

	token := r.URL.Query().Get("token")
	if token == "" {
		h.sendError(w, http.StatusBadRequest, "missing_token", "Verification token is required")
		return
	}

	// TODO: Implement email verification logic
	h.logger.Info("Email verification requested", "token", token[:8]+"...", "ip", getClientIP(r))

	response := models.SuccessResponse{
		Success: true,
		Message: "Email verification feature will be implemented soon",
	}

	h.sendJSON(w, http.StatusOK, response)
}

// Helper methods

func (h *AuthHandler) sendJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		h.logger.Error("Failed to encode JSON response", "error", err)
	}
}

func (h *AuthHandler) sendError(w http.ResponseWriter, statusCode int, errorType, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	response := models.ErrorResponse{
		Error:   errorType,
		Message: message,
		Code:    errorType,
	}
	json.NewEncoder(w).Encode(response)
}

func (h *AuthHandler) setAuthCookie(w http.ResponseWriter, token string, expiresAt time.Time) {
	cookie := &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Expires:  expiresAt,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}

func (h *AuthHandler) clearAuthCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Expires:  time.Unix(0, 0),
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}

func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (for proxies)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	if colon := strings.LastIndex(ip, ":"); colon != -1 {
		ip = ip[:colon]
	}
	return ip
}

func isValidEmail(email string) bool {
	// Basic email validation
	return strings.Contains(email, "@") && strings.Contains(email, ".") && len(email) > 5
}
