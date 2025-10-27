# Vitrari Authentication System Documentation

## 🎯 Overview

This document describes the complete authentication system implemented for Vitrari, a glass cutting optimization application. The system provides secure user authentication, authorization, session management, and a modern responsive UI.

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   API Handlers  │    │   Auth Service  │
│                 │    │                 │    │                 │
│ • Login/Signup  │───▶│ • Registration  │───▶│ • Password Hash │
│ • Form Validation│    │ • Authentication│    │ • JWT Tokens    │
│ • Password Strength│   │ • Session Mgmt  │    │ • User Validation│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Middleware    │    │   Database      │
                       │                 │    │                 │
                       │ • Auth Required │    │ • Users Table   │
                       │ • CORS & Security│    │ • Sessions Table│
                       │ • Rate Limiting │    │ • Audit Logs    │
                       └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Backend**: Go 1.21+ with standard library HTTP server
- **Database**: SQLite with comprehensive schema
- **Authentication**: JWT tokens with bcrypt password hashing
- **Frontend**: Vanilla JavaScript with modern CSS
- **Security**: CORS, CSRF protection, rate limiting, secure headers

## 🔐 Security Features

### Password Security
- **Hashing**: bcrypt with cost factor 12
- **Requirements**: Minimum 8 characters
- **Strength Indicator**: Real-time password strength feedback
- **Validation**: Client and server-side validation

### Session Management
- **JWT Tokens**: Signed with HMAC-SHA256
- **Expiration**: 24 hours (access tokens), 30 days (with "Remember Me")
- **Storage**: HTTP-only cookies for enhanced security
- **Invalidation**: Server-side session tracking and cleanup

### Account Security
- **Account Lockout**: 5 failed attempts → 30-minute lockout
- **Rate Limiting**: Configurable request rate limits
- **CORS Policy**: Configurable cross-origin request handling
- **Security Headers**: X-Frame-Options, CSP, HSTS-ready

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
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
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
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
```

## 🚀 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/signup` | User registration | No |
| `POST` | `/api/auth/login` | User login | No |
| `POST` | `/api/auth/logout` | User logout | Yes |
| `GET` | `/api/auth/me` | Get current user | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset | No |
| `POST` | `/api/auth/reset-password` | Reset password with token | No |
| `GET` | `/api/auth/verify-email` | Verify email address | No |

### Request/Response Examples

#### User Registration
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Welcome to Vitrari! Account created successfully.",
  "data": {
    "id": 1,
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "email_verified": false,
    "created_at": "2023-10-27T10:00:00Z"
  }
}
```

#### User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "rememberMe": false
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "last_login": "2023-10-27T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": 1698408600,
  "redirectUrl": "/",
  "message": "Welcome to Vitrari! Login successful"
}
```

## 🎨 Frontend Features

### User Interface Components

#### Authentication Page (`/auth`)
- **Toggle Interface**: Seamless switch between login and signup
- **Form Validation**: Real-time validation with user feedback
- **Password Strength**: Visual indicator with security recommendations
- **Responsive Design**: Mobile-first approach with tablet/desktop optimization
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

#### Key UI Elements
```javascript
// Toggle between login and signup
function showLogin() / showSignup()

// Password visibility toggle
function togglePassword(inputId, button)

// Real-time password strength
function updatePasswordStrength()

// Form validation
function validatePasswordMatch() / validateEmail()
```

### JavaScript Features
- **Form Validation**: Client-side validation with server-side verification
- **AJAX Requests**: Seamless API communication with error handling
- **Local Storage**: Auto-save form data to prevent loss
- **Session Management**: Automatic token handling and renewal
- **Alert System**: User-friendly notifications and error messages

## 🛡️ Middleware System

### Authentication Middleware

```go
// Require authentication for protected routes
authMiddleware.RequireAuth(handler)

// Optional authentication (adds user context if available)
authMiddleware.OptionalAuth(handler)

// Admin-only access
authMiddleware.AdminAuth(handler)
```

### Security Middleware Chain
1. **Security Headers**: HSTS, CSP, X-Frame-Options
2. **CORS Handling**: Cross-origin request management
3. **Request Logging**: Structured logging with user context
4. **Rate Limiting**: Request rate control (configurable)
5. **Authentication**: JWT token validation and user context

## 📋 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `vitrari-dev-secret-change-in-production` | JWT signing secret |
| `DB_PATH` | `./database/glass_optimizer.db` | Database file path |
| `PORT` | `9995` | Server port |

### Security Configuration
```go
const (
    AccessTokenExpiration  = 24 * time.Hour      // 24 hours
    RefreshTokenExpiration = 30 * 24 * time.Hour // 30 days  
    ResetTokenExpiration   = 1 * time.Hour       // 1 hour
    MaxFailedAttempts = 5                        // Account lockout
    LockoutDuration   = 30 * time.Minute        // Lockout duration
    BcryptCost = 12                             // Password hashing cost
)
```

## 🧪 Testing

### Automated Testing
Run the comprehensive test suite:
```bash
chmod +x test_auth.sh
./test_auth.sh
```

The test suite covers:
- ✅ Health checks
- ✅ User registration
- ✅ User login/logout
- ✅ Protected route access
- ✅ Invalid login attempts
- ✅ Password reset requests
- ✅ Unauthenticated access blocking
- ✅ Frontend page loading

### Manual Testing
1. **Open Authentication Page**: Navigate to `/auth`
2. **Test Registration**: Create account with validation
3. **Test Login**: Sign in with credentials
4. **Test UI Elements**: Toggle forms, password visibility, validation
5. **Test Security**: Invalid credentials, rate limiting

## 🚀 Deployment Checklist

### Production Security
- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Enable HTTPS and update cookie settings (`Secure: true`)
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting with Redis/external store
- [ ] Enable HSTS headers for HTTPS
- [ ] Configure CSP headers for your domain
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation and retention
- [ ] Set up database backups
- [ ] Enable email verification workflow

### Performance Optimization  
- [ ] Configure database connection pooling
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Enable gzip compression
- [ ] Configure static file caching
- [ ] Set up CDN for assets
- [ ] Monitor memory usage and optimize
- [ ] Set up health check endpoints
- [ ] Configure graceful shutdown

## 📚 Code Structure

```
glass-optimizer/
├── internal/
│   ├── handlers/
│   │   └── auth_handler.go          # HTTP request handlers
│   ├── services/
│   │   ├── auth_service.go          # Business logic
│   │   └── auth_middleware.go       # Authentication middleware
│   ├── models/
│   │   └── user.go                  # Data models and validation
│   └── storage/
│       ├── sqlite.go                # Database operations
│       └── schema.sql               # Database schema
├── static/
│   ├── css/
│   │   └── auth.css                 # Authentication UI styles
│   ├── js/
│   │   └── auth.js                  # Frontend functionality
│   └── assets/
│       └── logo.png                 # Vitrari logo
├── templates/
│   └── auth.html                    # Authentication page template
├── test_auth.sh                     # Automated test suite
└── main.go                          # Application entry point
```

## 🔄 Future Enhancements

### Planned Features
- **Email Verification**: Complete email verification workflow
- **Two-Factor Authentication**: TOTP/SMS 2FA support
- **Social Login**: OAuth integration (Google, GitHub, etc.)
- **Role-Based Access**: User roles and permissions system
- **Audit Logging**: Comprehensive security event logging
- **Password Policies**: Configurable password requirements
- **Account Recovery**: Multiple account recovery options
- **API Keys**: Service-to-service authentication

### Performance Improvements
- **Redis Sessions**: External session storage for scaling
- **Database Migration**: PostgreSQL for production
- **Caching Layer**: Redis/Memcached for performance
- **Load Balancing**: Multi-instance deployment support
- **Monitoring**: Prometheus/Grafana integration

## 🆘 Troubleshooting

### Common Issues

#### "Address already in use" Error
```bash
# Change port
PORT=9998 ./vitrari
```

#### Database Connection Issues
```bash
# Check database permissions
ls -la ./database/
# Ensure directory exists
mkdir -p ./database
```

#### JWT Token Issues
- Verify JWT_SECRET is set consistently
- Check token expiration times
- Validate token format in requests

### Logging and Debugging
The system uses structured logging. Check logs for:
- Authentication failures
- Database connection issues  
- JWT token validation errors
- Rate limiting triggers

## 📞 Support

For technical support or questions:
- Check the test suite output for specific errors
- Review server logs for detailed error messages
- Verify environment configuration
- Test with the provided demo credentials

---

**Vitrari Authentication System v1.0**  
*Secure, scalable, and user-friendly authentication for glass optimization*