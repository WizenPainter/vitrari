/**
 * Vitrari - Main Application JavaScript
 * Provides core functionality for the application
 */

// Utility function for API calls
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// Show error messages to user
function showError(message) {
  console.error(message);
  // Could be enhanced with a toast notification system
  alert(message);
}

// Show success messages to user
function showSuccess(message) {
  console.log(message);
  // Could be enhanced with a toast notification system
}

// Format numbers for display
function formatNumber(num, decimals = 2) {
  return Number(num).toFixed(decimals);
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  console.log("Vitrari initialized");

  // Add any global event listeners or initialization here
  initializeNavigation();
});

// Initialize navigation highlighting
function initializeNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".header nav a");

  navLinks.forEach((link) => {
    const linkPath = new URL(link.href).pathname;
    if (linkPath === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Export functions for use in other scripts
window.glassOptimizer = {
  fetchAPI,
  showError,
  showSuccess,
  formatNumber,
};
