# Agent Guidelines for Glass Optimizer

## Build/Lint/Test Commands

### Go Backend
- **Build**: `go build -o glass-optimizer .`
- **Run**: `go run main.go` or `./glass-optimizer`
- **Test all**: `go test ./...`
- **Test single**: `go test -run TestName ./path/to/package`
- **Test verbose**: `go test -v ./...`
- **Benchmark**: `go test -bench=. ./...`
- **Dependencies**: `go mod tidy`
- **Format**: `gofmt -w .` (auto-formats Go code)
- **Vet**: `go vet ./...` (static analysis)

### JavaScript Frontend
- No build system - served as static files
- Manual testing via browser console

## Code Style Guidelines

### Go Code Style
- **Formatting**: Use `gofmt` for automatic formatting
- **Imports**: Group standard library, then third-party, then internal packages
- **Naming**: PascalCase for exported identifiers, camelCase for unexported
- **Error Handling**: Return errors explicitly, use structured error types
- **Logging**: Use `slog` for structured logging with appropriate levels
- **Types**: Use interfaces for testability and dependency injection
- **Struct Tags**: Use json/db tags consistently for serialization
- **Comments**: Add package comments and exported function/struct comments

### JavaScript Code Style
- **Version**: ES6+ features (const/let, arrow functions, async/await)
- **Documentation**: Use JSDoc for all functions and classes
- **Error Handling**: Proper try/catch for async operations
- **DOM**: Use modern DOM APIs and event handling
- **Patterns**: Functional programming where appropriate
- **Naming**: camelCase for variables/functions, PascalCase for classes

### General Guidelines
- **Security**: Never expose secrets, validate all inputs, use prepared statements
- **Performance**: Optimize database queries, use appropriate data structures
- **Testing**: Write unit tests for all business logic, integration tests for APIs
- **Architecture**: Clean separation between handlers, services, and storage layers</content>
<parameter name="filePath">AGENTS.md