# Vitrari Administrator Account Creation

This document explains how to create administrator accounts for the Vitrari glass cutting optimization application.

## 🎯 Quick Start

The fastest way to create an admin account is using the comprehensive setup tool:

```bash
go run setup_admin.go "Your Name" "Admin" "your.email@vitrari.com" "YourSecurePassword123!"
```

## 🛡️ Admin Privileges

Administrator privileges are automatically granted to users with email addresses ending in:
- `@vitrari.com` - Production administrators
- `@admin.com` - Development/testing administrators

Admin accounts can:
- Access administrative endpoints (`/admin/*`)
- Manage system settings
- View and manage all users
- Access advanced configuration options

## 🚀 Available Tools

### 1. Complete Setup Tool (Recommended)
**File**: `setup_admin.go`
**Best for**: First-time setup, new installations

```bash
# Interactive mode
go run setup_admin.go

# Command-line mode
go run setup_admin.go "First" "Last" "email@vitrari.com" "password"

# Show help
go run setup_admin.go --help
```

**Features**:
- ✅ Initializes database if needed
- ✅ Creates authentication tables
- ✅ Interactive or command-line mode
- ✅ Input validation and confirmation
- ✅ Comprehensive error handling

### 2. Simple Admin Creator
**File**: `create_admin_simple.go`
**Best for**: Quick admin creation when database exists

```bash
go run create_admin_simple.go "First" "Last" "email@vitrari.com" "password"
```

**Features**:
- ⚡ Fast command-line creation
- 🔍 Input validation
- 📊 Clear success/error reporting

### 3. Interactive Admin Creator
**File**: `create_admin.go`
**Best for**: Guided admin creation with prompts

```bash
go run create_admin.go
```

**Features**:
- 🗣️ Interactive prompts
- 👁️ Hidden password input
- ✅ Password confirmation
- ⚠️ Domain privilege warnings

### 4. Shell Script Version
**File**: `create_admin.sh`
**Best for**: Systems without Go runtime

```bash
chmod +x create_admin.sh
./create_admin.sh
```

**Features**:
- 🐚 Pure shell script (requires Python for bcrypt)
- 📦 Auto-installs bcrypt dependency
- 🔐 Secure password handling

## 📝 Usage Examples

### First-Time Setup
```bash
# Complete setup with database initialization
go run setup_admin.go
```

### Production Admin
```bash
# Create production administrator
go run setup_admin.go "Sarah" "Johnson" "sarah.johnson@vitrari.com" "ProductionPassword2024!"
```

### Development Admin
```bash
# Create development administrator
go run setup_admin.go "Dev" "Admin" "dev@admin.com" "DevPassword123!"
```

### Scripted Creation
```bash
#!/bin/bash
FIRST_NAME="System"
LAST_NAME="Administrator"
EMAIL="sysadmin@vitrari.com"
PASSWORD="$(openssl rand -base64 32)"

echo "Creating admin with password: $PASSWORD"
go run setup_admin.go "$FIRST_NAME" "$LAST_NAME" "$EMAIL" "$PASSWORD"
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `./database/glass_optimizer.db` | Database file location |
| `JWT_SECRET` | Auto-generated | JWT signing secret |
| `PORT` | `9995` | Server port |

### Custom Database Location
```bash
DB_PATH=/opt/vitrari/data/db.sqlite go run setup_admin.go
```

### Production JWT Secret
```bash
JWT_SECRET=your-256-bit-secret go run setup_admin.go
```

## 🔍 Verification

After creating an admin account, verify it works:

1. **Check database**:
   ```bash
   sqlite3 database/glass_optimizer.db "SELECT email, first_name, last_name FROM users WHERE email LIKE '%@vitrari.com' OR email LIKE '%@admin.com';"
   ```

2. **Start server**:
   ```bash
   go run main.go
   ```

3. **Test login**:
   - Navigate to: http://localhost:9995/auth
   - Log in with your admin credentials
   - Verify admin access to protected routes

## 🛠️ Troubleshooting

### Database Issues
```
❌ Database not found at ./database/glass_optimizer.db
```
**Solution**: The setup tool will create it automatically, or run `go run main.go` once.

### Email Already Exists
```
❌ A user with email admin@vitrari.com already exists.
```
**Solution**: Delete the existing user or use a different email:
```bash
sqlite3 database/glass_optimizer.db "DELETE FROM users WHERE email = 'admin@vitrari.com';"
```

### No Admin Privileges
If you can log in but don't have admin access:
1. Verify email domain ends with `@vitrari.com` or `@admin.com`
2. Restart the server after email changes
3. Check authentication middleware configuration

### Permission Errors
```
❌ Failed to create admin account: database is locked
```
**Solution**: Stop the server before creating admin accounts.

### Missing Dependencies
```
missing go.sum entry for module providing package golang.org/x/term
```
**Solution**: Run `go mod tidy` to install dependencies.

## 🔒 Security Best Practices

### Password Requirements
- **Minimum 8 characters**
- Mix of uppercase, lowercase, numbers, symbols
- Avoid dictionary words and common passwords
- Use a password manager for generation/storage

### Email Domains
- Use `@vitrari.com` for production admins
- Use `@admin.com` only for development/testing
- Never use public email domains for admin accounts

### Account Management
- Create minimal number of admin accounts needed
- Use unique, strong passwords for each account
- Regularly audit admin account usage
- Remove unused admin accounts promptly

## 📊 Database Schema

Admin accounts are stored in the `users` table:

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,        -- bcrypt hashed
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email_verified INTEGER DEFAULT 0,   -- 1 for admin accounts
    -- ... other fields for security
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🆘 Support

For issues with admin account creation:

1. **Check logs**: Server logs provide detailed error information
2. **Verify dependencies**: Run `go mod tidy` to ensure all packages are available
3. **Test database**: Ensure SQLite is working and database is writable
4. **Review permissions**: Check file/directory permissions for database location

## 📚 Related Documentation

- [Authentication System Documentation](./docs/AUTH_SYSTEM_DOCUMENTATION.md)
- [Complete Admin Setup Guide](./docs/ADMIN_SETUP.md)
- [API Endpoints](./docs/AUTH_SYSTEM_DOCUMENTATION.md#api-endpoints)
- [Security Features](./docs/AUTH_SYSTEM_DOCUMENTATION.md#security-features)

---

**Quick Commands Reference**:
```bash
# Complete setup (recommended)
go run setup_admin.go

# Quick creation
go run setup_admin.go "Name" "Last" "email@vitrari.com" "password"

# Help
go run setup_admin.go --help

# Check existing admins
sqlite3 database/glass_optimizer.db "SELECT email, first_name, last_name FROM users WHERE email LIKE '%@vitrari.com' OR email LIKE '%@admin.com';"
```
