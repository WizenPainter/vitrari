package models

import (
	"errors"
	"fmt"
)

// Error types for the application
var (
	ErrNotFound           = errors.New("resource not found")
	ErrInvalidInput       = errors.New("invalid input")
	ErrDuplicateEntry     = errors.New("duplicate entry")
	ErrDatabaseError      = errors.New("database error")
	ErrOptimizationFailed = errors.New("optimization failed")
	ErrInvalidDesign      = errors.New("invalid design")
	ErrInvalidSheet       = errors.New("invalid sheet")
	ErrInsufficientSpace  = errors.New("insufficient space on sheet")
	ErrInvalidAlgorithm   = errors.New("invalid optimization algorithm")
	ErrTimeout            = errors.New("operation timeout")
	ErrUnauthorized       = errors.New("unauthorized access")
	ErrInternalServer     = errors.New("internal server error")
)

// AppError represents a custom application error
type AppError struct {
	Type    ErrorType `json:"type"`
	Code    string    `json:"code"`
	Message string    `json:"message"`
	Details string    `json:"details,omitempty"`
	Field   string    `json:"field,omitempty"`
	Cause   error     `json:"-"`
}

// ErrorType defines the category of error
type ErrorType string

const (
	ErrorTypeValidation     ErrorType = "validation"
	ErrorTypeNotFound       ErrorType = "not_found"
	ErrorTypeConflict       ErrorType = "conflict"
	ErrorTypeDatabase       ErrorType = "database"
	ErrorTypeOptimization   ErrorType = "optimization"
	ErrorTypeAuthentication ErrorType = "authentication"
	ErrorTypeAuthorization  ErrorType = "authorization"
	ErrorTypeInternal       ErrorType = "internal"
	ErrorTypeExternal       ErrorType = "external"
	ErrorTypeTimeout        ErrorType = "timeout"
	ErrorTypeRateLimit      ErrorType = "rate_limit"
)

// Error codes
const (
	CodeInvalidJSON        = "INVALID_JSON"
	CodeMissingField       = "MISSING_FIELD"
	CodeInvalidValue       = "INVALID_VALUE"
	CodeDuplicateName      = "DUPLICATE_NAME"
	CodeDesignNotFound     = "DESIGN_NOT_FOUND"
	CodeSheetNotFound      = "SHEET_NOT_FOUND"
	CodeProjectNotFound    = "PROJECT_NOT_FOUND"
	CodeOptimizationFailed = "OPTIMIZATION_FAILED"
	CodeInsufficientStock  = "INSUFFICIENT_STOCK"
	CodeDimensionTooLarge  = "DIMENSION_TOO_LARGE"
	CodeThicknessMismatch  = "THICKNESS_MISMATCH"
	CodeDatabaseConnection = "DATABASE_CONNECTION"
	CodeDatabaseQuery      = "DATABASE_QUERY"
	CodeAlgorithmTimeout   = "ALGORITHM_TIMEOUT"
	CodeInvalidAlgorithm   = "INVALID_ALGORITHM"
	CodeInternal           = "INTERNAL_ERROR"
)

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("%s: %s - %s", e.Code, e.Message, e.Details)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// ValidationError creates a new validation error
func NewValidationError(message string) *AppError {
	return &AppError{
		Type:    ErrorTypeValidation,
		Code:    CodeInvalidValue,
		Message: message,
	}
}

// ValidationFieldError creates a validation error for a specific field
func NewValidationFieldError(field, message string) *AppError {
	return &AppError{
		Type:    ErrorTypeValidation,
		Code:    CodeInvalidValue,
		Message: message,
		Field:   field,
	}
}

// NotFoundError creates a new not found error
func NewNotFoundError(resource string) *AppError {
	return &AppError{
		Type:    ErrorTypeNotFound,
		Code:    CodeDesignNotFound, // Will be updated based on resource
		Message: fmt.Sprintf("%s not found", resource),
	}
}

// DatabaseError creates a new database error
func NewDatabaseError(message string, cause error) *AppError {
	return &AppError{
		Type:    ErrorTypeDatabase,
		Code:    CodeDatabaseQuery,
		Message: message,
		Cause:   cause,
	}
}

// OptimizationError creates a new optimization error
func NewOptimizationError(message string, details string) *AppError {
	return &AppError{
		Type:    ErrorTypeOptimization,
		Code:    CodeOptimizationFailed,
		Message: message,
		Details: details,
	}
}

// ConflictError creates a new conflict error
func NewConflictError(message string) *AppError {
	return &AppError{
		Type:    ErrorTypeConflict,
		Code:    CodeDuplicateName,
		Message: message,
	}
}

// InternalError creates a new internal server error
func NewInternalError(message string, cause error) *AppError {
	return &AppError{
		Type:    ErrorTypeInternal,
		Code:    "INTERNAL_ERROR",
		Message: message,
		Cause:   cause,
	}
}

// TimeoutError creates a new timeout error
func NewTimeoutError(operation string) *AppError {
	return &AppError{
		Type:    ErrorTypeTimeout,
		Code:    CodeAlgorithmTimeout,
		Message: fmt.Sprintf("%s operation timed out", operation),
	}
}

// ValidationErrors represents multiple validation errors
type ValidationErrors struct {
	Errors []ValidationError `json:"errors"`
}

// ValidationError represents a single field validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Value   string `json:"value,omitempty"`
}

// Error implements the error interface for ValidationErrors
func (ve *ValidationErrors) Error() string {
	if len(ve.Errors) == 0 {
		return "validation failed"
	}
	return fmt.Sprintf("validation failed: %s", ve.Errors[0].Message)
}

// Add adds a validation error to the collection
func (ve *ValidationErrors) Add(field, message string, value ...string) {
	err := ValidationError{
		Field:   field,
		Message: message,
	}
	if len(value) > 0 {
		err.Value = value[0]
	}
	ve.Errors = append(ve.Errors, err)
}

// HasErrors returns true if there are validation errors
func (ve *ValidationErrors) HasErrors() bool {
	return len(ve.Errors) > 0
}

// Clear removes all validation errors
func (ve *ValidationErrors) Clear() {
	ve.Errors = nil
}

// ErrorResponse represents the standard error response format
type ErrorResponse struct {
	Error   string      `json:"error"`
	Code    string      `json:"code,omitempty"`
	Details interface{} `json:"details,omitempty"`
	Message string      `json:"message,omitempty"`
}

// SuccessResponse represents a success response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// NewErrorResponse creates a new error response from an AppError
func NewErrorResponse(err error) *ErrorResponse {
	if appErr, ok := err.(*AppError); ok {
		return &ErrorResponse{
			Error:   appErr.Message,
			Code:    appErr.Code,
			Details: appErr.Details,
			Message: appErr.Message,
		}
	}

	if valErr, ok := err.(*ValidationErrors); ok {
		return &ErrorResponse{
			Error:   "Validation failed",
			Code:    CodeInvalidValue,
			Details: valErr.Errors,
			Message: "Validation failed",
		}
	}

	return &ErrorResponse{
		Error:   err.Error(),
		Code:    CodeInternal,
		Message: err.Error(),
	}
}

// IsValidationError checks if the error is a validation error
func IsValidationError(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Type == ErrorTypeValidation
	}
	_, ok := err.(*ValidationErrors)
	return ok
}

// IsNotFoundError checks if the error is a not found error
func IsNotFoundError(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Type == ErrorTypeNotFound
	}
	return errors.Is(err, ErrNotFound)
}

// IsDatabaseError checks if the error is a database error
func IsDatabaseError(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Type == ErrorTypeDatabase
	}
	return errors.Is(err, ErrDatabaseError)
}

// IsOptimizationError checks if the error is an optimization error
func IsOptimizationError(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Type == ErrorTypeOptimization
	}
	return errors.Is(err, ErrOptimizationFailed)
}

// IsConflictError checks if the error is a conflict error
func IsConflictError(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Type == ErrorTypeConflict
	}
	return errors.Is(err, ErrDuplicateEntry)
}

// IsTimeoutError checks if the error is a timeout error
func IsTimeoutError(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Type == ErrorTypeTimeout
	}
	return errors.Is(err, ErrTimeout)
}

// WrapError wraps an existing error with additional context
func WrapError(err error, message string) error {
	if err == nil {
		return nil
	}

	if appErr, ok := err.(*AppError); ok {
		return &AppError{
			Type:    appErr.Type,
			Code:    appErr.Code,
			Message: message,
			Details: appErr.Message,
			Field:   appErr.Field,
			Cause:   appErr.Cause,
		}
	}

	return fmt.Errorf("%s: %w", message, err)
}

// GetHTTPStatusCode returns the appropriate HTTP status code for an error
func GetHTTPStatusCode(err error) int {
	if appErr, ok := err.(*AppError); ok {
		switch appErr.Type {
		case ErrorTypeValidation:
			return 400 // Bad Request
		case ErrorTypeNotFound:
			return 404 // Not Found
		case ErrorTypeConflict:
			return 409 // Conflict
		case ErrorTypeAuthentication:
			return 401 // Unauthorized
		case ErrorTypeAuthorization:
			return 403 // Forbidden
		case ErrorTypeTimeout:
			return 408 // Request Timeout
		case ErrorTypeRateLimit:
			return 429 // Too Many Requests
		case ErrorTypeExternal:
			return 502 // Bad Gateway
		case ErrorTypeDatabase, ErrorTypeInternal, ErrorTypeOptimization:
			return 500 // Internal Server Error
		}
	}

	// Check standard errors
	if IsValidationError(err) {
		return 400
	}
	if IsNotFoundError(err) {
		return 404
	}
	if IsConflictError(err) {
		return 409
	}
	if IsTimeoutError(err) {
		return 408
	}

	return 500 // Default to Internal Server Error
}

// ValidateRequired checks if a required field is provided
func ValidateRequired(value string, fieldName string, errors *ValidationErrors) {
	if value == "" {
		errors.Add(fieldName, fmt.Sprintf("%s is required", fieldName))
	}
}

// ValidateRange checks if a numeric value is within a specified range
func ValidateRange(value, min, max float64, fieldName string, errors *ValidationErrors) {
	if value < min || value > max {
		errors.Add(fieldName, fmt.Sprintf("%s must be between %.2f and %.2f", fieldName, min, max))
	}
}

// ValidatePositive checks if a numeric value is positive
func ValidatePositive(value float64, fieldName string, errors *ValidationErrors) {
	if value <= 0 {
		errors.Add(fieldName, fmt.Sprintf("%s must be positive", fieldName))
	}
}

// ValidateMaxLength checks if a string exceeds maximum length
func ValidateMaxLength(value string, maxLength int, fieldName string, errors *ValidationErrors) {
	if len(value) > maxLength {
		errors.Add(fieldName, fmt.Sprintf("%s cannot exceed %d characters", fieldName, maxLength))
	}
}

// ValidateMinLength checks if a string meets minimum length requirement
func ValidateMinLength(value string, minLength int, fieldName string, errors *ValidationErrors) {
	if len(value) < minLength {
		errors.Add(fieldName, fmt.Sprintf("%s must be at least %d characters", fieldName, minLength))
	}
}

// ValidateEnum checks if a value is in a list of allowed values
func ValidateEnum(value string, allowedValues []string, fieldName string, errors *ValidationErrors) {
	for _, allowed := range allowedValues {
		if value == allowed {
			return
		}
	}
	errors.Add(fieldName, fmt.Sprintf("%s must be one of: %v", fieldName, allowedValues))
}
