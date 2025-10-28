package services

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"glass-optimizer/internal/models"
)

// ContextKey type for context keys to avoid collisions
type ContextKey string

const (
	UserContextKey ContextKey = "user"
)

// AuthMiddleware handles JWT authentication for protected routes
type AuthMiddleware struct {
	authService *AuthService
	logger      *slog.Logger
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(authService *AuthService, logger *slog.Logger) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
		logger:      logger,
	}
}

// RequireAuth middleware that requires authentication
func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := m.authenticateRequest(r)
		if err != nil {
			m.logger.Info("Authentication failed", "error", err, "path", r.URL.Path, "ip", getClientIP(r))
			m.sendUnauthorizedResponse(w, r, "Authentication required")
			return
		}

		// Add user to request context
		ctx := context.WithValue(r.Context(), UserContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// OptionalAuth middleware that adds user context if authenticated, but doesn't require it
func (m *AuthMiddleware) OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := m.authenticateRequest(r)
		if err == nil && user != nil {
			// Add user to request context if authentication successful
			ctx := context.WithValue(r.Context(), UserContextKey, user)
			r = r.WithContext(ctx)
		}

		next.ServeHTTP(w, r)
	})
}

// AdminAuth middleware that requires admin authentication
func (m *AuthMiddleware) AdminAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := m.authenticateRequest(r)
		if err != nil {
			m.logger.Info("Admin authentication failed", "error", err, "path", r.URL.Path, "ip", getClientIP(r))
			m.sendUnauthorizedResponse(w, r, "Admin authentication required")
			return
		}

		// Check if user has admin privileges (this would be extended based on your role system)
		if !m.isAdmin(user) {
			m.logger.Warn("Non-admin user attempted to access admin endpoint", "user_id", user.ID, "email", user.Email, "path", r.URL.Path)
			m.sendForbiddenResponse(w, r, "Admin privileges required")
			return
		}

		// Add user to request context
		ctx := context.WithValue(r.Context(), UserContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// CORS middleware for handling cross-origin requests
func (m *AuthMiddleware) CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*") // Configure this properly for production
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "3600")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RateLimiting middleware (basic implementation)
func (m *AuthMiddleware) RateLimiting(next http.Handler) http.Handler {
	// This is a basic implementation. In production, you'd want to use Redis or similar
	// with more sophisticated rate limiting algorithms
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// For now, just pass through - implement rate limiting as needed
		next.ServeHTTP(w, r)
	})
}

// Logging middleware for request logging
func (m *AuthMiddleware) Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap ResponseWriter to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Get user from context if available
		var userID int64
		if user := GetUserFromContext(r.Context()); user != nil {
			userID = user.ID
		}

		// Log request
		m.logger.Info("HTTP Request",
			"method", r.Method,
			"path", r.URL.Path,
			"query", r.URL.RawQuery,
			"ip", getClientIP(r),
			"user_agent", r.UserAgent(),
			"user_id", userID,
		)

		next.ServeHTTP(wrapped, r)

		// Log response
		duration := time.Since(start)
		m.logger.Info("HTTP Response",
			"method", r.Method,
			"path", r.URL.Path,
			"status", wrapped.statusCode,
			"duration", duration.String(),
			"user_id", userID,
		)
	})
}

// Security headers middleware
func (m *AuthMiddleware) SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data:; connect-src 'self'")

		// HSTS for HTTPS (uncomment for production with HTTPS)
		// w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		next.ServeHTTP(w, r)
	})
}

// Private helper methods

func (m *AuthMiddleware) authenticateRequest(r *http.Request) (*models.User, error) {
	// Extract token from request
	token := ExtractTokenFromRequest(r)
	if token == "" {
		return nil, ErrInvalidToken
	}

	// Validate token and get user
	user, err := m.authService.ValidateToken(token)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (m *AuthMiddleware) isAdmin(user *models.User) bool {
	// This is a placeholder implementation
	// In a real system, you'd check user roles, permissions, etc.
	// For now, we'll consider certain email domains as admin (development only)
	return strings.HasSuffix(user.Email, "@vitrari.com") || strings.HasSuffix(user.Email, "@admin.com")
}

func (m *AuthMiddleware) sendUnauthorizedResponse(w http.ResponseWriter, r *http.Request, message string) {
	if m.isAPIRequest(r) {
		// Send JSON response for API requests
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(models.ErrorResponse{
			Error:   "unauthorized",
			Message: message,
			Code:    "UNAUTHORIZED",
		})
	} else {
		// Redirect browser requests to auth page
		http.Redirect(w, r, "/auth", http.StatusFound)
	}
}

func (m *AuthMiddleware) sendForbiddenResponse(w http.ResponseWriter, r *http.Request, message string) {
	if m.isAPIRequest(r) {
		// Send JSON response for API requests
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(models.ErrorResponse{
			Error:   "forbidden",
			Message: message,
			Code:    "FORBIDDEN",
		})
	} else {
		// Redirect browser requests to auth page for forbidden access too
		http.Redirect(w, r, "/auth", http.StatusFound)
	}
}

// isAPIRequest determines if the request is an API call or a browser request
func (m *AuthMiddleware) isAPIRequest(r *http.Request) bool {
	// Check if path starts with /api
	if strings.HasPrefix(r.URL.Path, "/api") || strings.HasPrefix(r.URL.Path, "/api/") {
		return true
	}

	// Check Accept header for JSON content type preference
	accept := r.Header.Get("Accept")
	if strings.Contains(accept, "application/json") && !strings.Contains(accept, "text/html") {
		return true
	}

	// Check Content-Type for JSON requests
	contentType := r.Header.Get("Content-Type")
	if strings.Contains(contentType, "application/json") {
		return true
	}

	// Check X-Requested-With header (commonly used by AJAX requests)
	if r.Header.Get("X-Requested-With") == "XMLHttpRequest" {
		return true
	}

	// Default to browser request (HTML)
	return false
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

// Utility functions

// GetUserFromContext extracts user from request context
func GetUserFromContext(ctx context.Context) *models.User {
	if user, ok := ctx.Value(UserContextKey).(*models.User); ok {
		return user
	}
	return nil
}

// responseWriter wrapper to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
