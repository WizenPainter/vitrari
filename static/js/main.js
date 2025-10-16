/**
 * Glass Optimizer - Main JavaScript Application
 *
 * This is the core JavaScript module that provides:
 * - API client for backend communication
 * - Event management system
 * - Utility functions
 * - Application state management
 * - Error handling
 * - Loading states
 * - Notifications
 *
 * @author Glass Optimizer Team
 * @version 1.0.0
 */

/**
 * Main Application Class
 * Manages global application state and provides core functionality
 */
class GlassOptimizerApp {
    constructor() {
        this.config = {
            apiBaseUrl: '/api',
            version: '1.0.0',
            debug: false
        };

        this.state = {
            currentUser: null,
            currentPage: null,
            loading: false,
            notifications: [],
            designs: [],
            sheets: [],
            optimizations: [],
            projects: []
        };

        this.eventListeners = new Map();
        this.apiClient = new APIClient(this.config.apiBaseUrl);
        this.notificationManager = new NotificationManager();
        this.loadingManager = new LoadingManager();

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.log('Initializing Glass Optimizer application...');

        // Set up global error handling
        this.setupErrorHandling();

        // Initialize HTMX if available
        if (typeof htmx !== 'undefined') {
            this.initializeHTMX();
        }

        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Load initial data
        await this.loadInitialData();

        // Set up periodic data refresh
        this.setupDataRefresh();

        this.log('Application initialized successfully');
        this.emit('app:initialized');
    }

    /**
     * Set up global error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError(event.error, 'Global Error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Unhandled Promise Rejection');
        });
    }

    /**
     * Initialize HTMX configuration
     */
    initializeHTMX() {
        // Configure HTMX for our API
        htmx.config.requestClass = 'loading';
        htmx.config.indicatorClass = 'htmx-indicator';

        // Set up HTMX event listeners
        document.body.addEventListener('htmx:beforeRequest', (event) => {
            this.loadingManager.show();
        });

        document.body.addEventListener('htmx:afterRequest', (event) => {
            this.loadingManager.hide();

            if (event.detail.xhr.status >= 400) {
                this.handleHTTPError(event.detail.xhr);
            }
        });

        document.body.addEventListener('htmx:responseError', (event) => {
            this.handleHTTPError(event.detail.xhr);
        });
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + S to save (prevent default browser save)
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                this.emit('shortcut:save');
            }

            // Ctrl/Cmd + Z for undo
            if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                this.emit('shortcut:undo');
            }

            // Ctrl/Cmd + Shift + Z for redo
            if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
                event.preventDefault();
                this.emit('shortcut:redo');
            }

            // Escape to cancel operations
            if (event.key === 'Escape') {
                this.emit('shortcut:cancel');
            }

            // Delete key to delete selected items
            if (event.key === 'Delete') {
                this.emit('shortcut:delete');
            }
        });
    }

    /**
     * Load initial application data
     */
    async loadInitialData() {
        try {
            this.loadingManager.show('Loading application data...');

            // Load designs, sheets, and other core data in parallel
            const [designs, sheets] = await Promise.all([
                this.apiClient.get('/designs?limit=100'),
                this.apiClient.get('/sheets')
            ]);

            this.state.designs = designs.designs || [];
            this.state.sheets = sheets.sheets || [];

            this.emit('data:loaded', {
                designs: this.state.designs,
                sheets: this.state.sheets
            });

        } catch (error) {
            this.handleError(error, 'Failed to load initial data');
        } finally {
            this.loadingManager.hide();
        }
    }

    /**
     * Set up periodic data refresh
     */
    setupDataRefresh() {
        // Refresh data every 5 minutes
        setInterval(async () => {
            if (!document.hidden) { // Only refresh when page is visible
                await this.refreshData();
            }
        }, 5 * 60 * 1000);

        // Refresh when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshData();
            }
        });
    }

    /**
     * Refresh application data
     */
    async refreshData() {
        try {
            const [designs, sheets, optimizations] = await Promise.all([
                this.apiClient.get('/designs?limit=100'),
                this.apiClient.get('/sheets'),
                this.apiClient.get('/optimizations?limit=50')
            ]);

            this.state.designs = designs.designs || [];
            this.state.sheets = sheets.sheets || [];
            this.state.optimizations = optimizations.optimizations || [];

            this.emit('data:refreshed');

        } catch (error) {
            this.log('Failed to refresh data:', error);
        }
    }

    /**
     * Handle HTTP errors from HTMX or API calls
     */
    handleHTTPError(xhr) {
        let message = 'An error occurred';
        let details = '';

        try {
            const response = JSON.parse(xhr.responseText);
            message = response.error || response.message || message;
            details = response.details || '';
        } catch (e) {
            message = xhr.statusText || message;
        }

        this.notificationManager.error(message, details);
        this.log('HTTP Error:', xhr.status, message, details);
    }

    /**
     * Handle general errors
     */
    handleError(error, context = 'Application Error') {
        const message = error.message || error.toString();
        this.notificationManager.error(`${context}: ${message}`);
        this.log('Error:', context, error);

        // Emit error event for custom handling
        this.emit('app:error', { error, context });
    }

    /**
     * Event system methods
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data = null) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.log('Error in event callback:', event, error);
                }
            });
        }
    }

    /**
     * Logging utility
     */
    log(...args) {
        if (this.config.debug || window.location.hostname === 'localhost') {
            console.log('[GlassOptimizer]', ...args);
        }
    }

    /**
     * Get application state
     */
    getState(key = null) {
        return key ? this.state[key] : this.state;
    }

    /**
     * Update application state
     */
    setState(updates) {
        Object.assign(this.state, updates);
        this.emit('state:updated', updates);
    }
}

/**
 * API Client Class
 * Handles all communication with the backend API
 */
class APIClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Make a GET request
     */
    async get(endpoint, params = {}) {
        const url = new URL(this.baseUrl + endpoint, window.location.origin);

        // Add query parameters
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        return this.fetch(url.toString(), {
            method: 'GET'
        });
    }

    /**
     * Make a POST request
     */
    async post(endpoint, data = null) {
        return this.fetch(this.baseUrl + endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : null
        });
    }

    /**
     * Make a PUT request
     */
    async put(endpoint, data = null) {
        return this.fetch(this.baseUrl + endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : null
        });
    }

    /**
     * Make a DELETE request
     */
    async delete(endpoint) {
        return this.fetch(this.baseUrl + endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Generic fetch wrapper with error handling
     */
    async fetch(url, options = {}) {
        const config = {
            headers: { ...this.defaultHeaders },
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new APIError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    url
                );
            }

            // Handle empty responses
            const text = await response.text();
            if (!text) {
                return null;
            }

            return JSON.parse(text);

        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }

            // Network or other errors
            throw new APIError(
                `Network error: ${error.message}`,
                0,
                url
            );
        }
    }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
    constructor(message, status, url) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.url = url;
    }
}

/**
 * Notification Manager Class
 * Handles user notifications and alerts
 */
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a success notification
     */
    success(message, details = null) {
        return this.show(message, 'success', details);
    }

    /**
     * Show an error notification
     */
    error(message, details = null) {
        return this.show(message, 'error', details);
    }

    /**
     * Show a warning notification
     */
    warning(message, details = null) {
        return this.show(message, 'warning', details);
    }

    /**
     * Show an info notification
     */
    info(message, details = null) {
        return this.show(message, 'info', details);
    }

    /**
     * Show a notification
     */
    show(message, type = 'info', details = null, duration = 5000) {
        const notification = {
            id: Date.now() + Math.random(),
            message,
            type,
            details,
            duration
        };

        const element = this.createNotificationElement(notification);
        this.container.appendChild(element);
        this.notifications.push(notification);

        // Animate in
        setTimeout(() => {
            element.classList.add('show');
        }, 10);

        // Auto-remove after duration (except for errors)
        if (type !== 'error' && duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, duration);
        }

        return notification.id;
    }

    /**
     * Create notification DOM element
     */
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification alert alert-${notification.type}`;
        element.style.cssText = `
            margin-bottom: 10px;
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease-in-out;
            position: relative;
            padding-right: 40px;
        `;

        let content = `<strong>${this.getTypeIcon(notification.type)} ${notification.message}</strong>`;
        if (notification.details) {
            content += `<br><small>${notification.details}</small>`;
        }

        element.innerHTML = content + `
            <button type="button" class="modal-close" style="
                position: absolute;
                top: 50%;
                right: 15px;
                transform: translateY(-50%);
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.7;
            ">&times;</button>
        `;

        // Add show class for animation
        element.classList.add = function(...classes) {
            if (classes.includes('show')) {
                this.style.opacity = '1';
                this.style.transform = 'translateX(0)';
            }
            Element.prototype.classList.add.apply(this, classes);
        };

        // Close button handler
        element.querySelector('.modal-close').addEventListener('click', () => {
            this.remove(notification.id);
        });

        return element;
    }

    /**
     * Get icon for notification type
     */
    getTypeIcon(type) {
        const icons = {
            success: '✓',
            error: '⚠',
            warning: '!',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Remove a notification
     */
    remove(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;

        const notification = this.notifications[index];
        const elements = this.container.children;
        const element = Array.from(elements).find(el =>
            el.innerHTML.includes(notification.message)
        );

        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'translateX(100%)';

            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }

        this.notifications.splice(index, 1);
    }

    /**
     * Clear all notifications
     */
    clear() {
        this.notifications.forEach(n => this.remove(n.id));
    }
}

/**
 * Loading Manager Class
 * Handles loading states and progress indicators
 */
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.overlay = null;
        this.init();
    }

    init() {
        // Create loading overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.className = 'loading-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            display: none;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        `;

        this.overlay.innerHTML = `
            <div class="spinner" style="
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid #fff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            "></div>
            <div class="loading-text" style="
                color: white;
                font-size: 16px;
                font-weight: 500;
            ">Loading...</div>
        `;

        document.body.appendChild(this.overlay);

        // Add CSS animation
        if (!document.getElementById('loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show loading overlay
     */
    show(message = 'Loading...', id = 'default') {
        this.activeLoaders.add(id);

        const textElement = this.overlay.querySelector('.loading-text');
        if (textElement) {
            textElement.textContent = message;
        }

        this.overlay.style.display = 'flex';
    }

    /**
     * Hide loading overlay
     */
    hide(id = 'default') {
        this.activeLoaders.delete(id);

        // Only hide if no other loaders are active
        if (this.activeLoaders.size === 0) {
            this.overlay.style.display = 'none';
        }
    }

    /**
     * Check if loading is active
     */
    isLoading(id = null) {
        return id ? this.activeLoaders.has(id) : this.activeLoaders.size > 0;
    }
}

/**
 * Utility Functions
 */
const Utils = {
    /**
     * Format a number with specified decimal places
     */
    formatNumber(num, decimals = 2) {
        return Number(num).toFixed(decimals);
    },

    /**
     * Format a number as currency
     */
    formatCurrency(amount, currency = '$') {
        return currency + this.formatNumber(amount, 2);
    },

    /**
     * Format dimensions for display
     */
    formatDimensions(width, height, unit = 'mm') {
        return `${this.formatNumber(width, 0)} × ${this.formatNumber(height, 0)} ${unit}`;
    },

    /**
     * Format area for display
     */
    formatArea(area, unit = 'mm²') {
        if (area > 1000000) {
            return this.formatNumber(area / 1000000, 2) + ' m²';
        }
        return this.formatNumber(area, 0) + ' ' + unit;
    },

    /**
     * Format percentage
     */
    formatPercentage(value, decimals = 1) {
        return this.formatNumber(value, decimals) + '%';
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return this.formatNumber(bytes / Math.pow(k, i), 1) + ' ' + sizes[i];
    },

    /**
     * Format date/time
     */
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },

    /**
     * Debounce function calls
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Deep clone an object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Generate a unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Download data as a file
     */
    downloadFile(data, filename, type = 'application/octet-stream') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Convert RGB to hex
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    /**
     * Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
};

// Initialize the application when the DOM is ready
let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new GlassOptimizerApp();
        window.glassApp = app; // Make globally available
    });
} else {
    app = new GlassOptimizerApp();
    window.glassApp = app;
}

// Export classes and utilities for use in other modules
window.GlassOptimizerApp = GlassOptimizerApp;
window.APIClient = APIClient;
window.NotificationManager = NotificationManager;
window.LoadingManager = LoadingManager;
window.Utils = Utils;

// Development helpers
if (window.location.hostname === 'localhost') {
    window.glassUtils = Utils;
    console.log('Glass Optimizer loaded in development mode');
}
