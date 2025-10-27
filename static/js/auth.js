// Glass Optimizer - Authentication JavaScript

// Global state
let currentForm = "login";
let isLoading = false;

// DOM elements
let loginForm, signupForm, forgotForm;
let loginToggle, signupToggle;
let loadingOverlay, alertContainer;

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeElements();
  initializeEventListeners();
  initializePasswordStrength();

  // Show login form by default
  showLogin();
});

/**
 * Initialize DOM elements
 */
function initializeElements() {
  loginForm = document.getElementById("loginForm");
  signupForm = document.getElementById("signupForm");
  forgotForm = document.getElementById("forgotForm");

  loginToggle = document.getElementById("loginToggle");
  signupToggle = document.getElementById("signupToggle");

  loadingOverlay = document.getElementById("loadingOverlay");
  alertContainer = document.getElementById("alertContainer");
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  // Form submissions
  document
    .getElementById("loginFormElement")
    .addEventListener("submit", handleLogin);
  document
    .getElementById("signupFormElement")
    .addEventListener("submit", handleSignup);
  document
    .getElementById("forgotFormElement")
    .addEventListener("submit", handleForgotPassword);

  // Password strength for signup
  const signupPasswordInput = document.getElementById("signupPassword");
  if (signupPasswordInput) {
    signupPasswordInput.addEventListener("input", updatePasswordStrength);
  }

  // Confirm password validation
  const confirmPasswordInput = document.getElementById("confirmPassword");
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", validatePasswordMatch);
  }

  // Email validation on blur
  document.querySelectorAll('input[type="email"]').forEach((input) => {
    input.addEventListener("blur", validateEmail);
  });

  // Keyboard navigation
  document.addEventListener("keydown", handleKeyboardNavigation);
}

/**
 * Show login form
 */
function showLogin() {
  if (isLoading) return;

  currentForm = "login";

  // Update toggles
  loginToggle.classList.add("active");
  signupToggle.classList.remove("active");

  // Show/hide forms
  loginForm.classList.add("active");
  signupForm.classList.remove("active");
  forgotForm.classList.remove("active");

  // Focus first input
  setTimeout(() => {
    const emailInput = document.getElementById("loginEmail");
    if (emailInput) emailInput.focus();
  }, 100);
}

/**
 * Show signup form
 */
function showSignup() {
  if (isLoading) return;

  currentForm = "signup";

  // Update toggles
  loginToggle.classList.remove("active");
  signupToggle.classList.add("active");

  // Show/hide forms
  loginForm.classList.remove("active");
  signupForm.classList.add("active");
  forgotForm.classList.remove("active");

  // Focus first input
  setTimeout(() => {
    const firstNameInput = document.getElementById("firstName");
    if (firstNameInput) firstNameInput.focus();
  }, 100);
}

/**
 * Show forgot password form
 */
function showForgotPassword() {
  if (isLoading) return;

  currentForm = "forgot";

  // Update toggles
  loginToggle.classList.remove("active");
  signupToggle.classList.remove("active");

  // Show/hide forms
  loginForm.classList.remove("active");
  signupForm.classList.remove("active");
  forgotForm.classList.add("active");

  // Focus email input
  setTimeout(() => {
    const emailInput = document.getElementById("forgotEmail");
    if (emailInput) emailInput.focus();
  }, 100);
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
  event.preventDefault();

  if (isLoading) return;

  const formData = new FormData(event.target);
  const email = formData.get("email");
  const password = formData.get("password");
  const rememberMe = formData.get("rememberMe") === "on";

  // Basic validation
  if (!email || !password) {
    showAlert("Please fill in all required fields", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("Please enter a valid email address", "error");
    return;
  }

  try {
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
        rememberMe: rememberMe,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showAlert("Login successful! Redirecting...", "success");

      // Store auth token if provided
      if (result.token) {
        localStorage.setItem("authToken", result.token);
      }

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = result.redirectUrl || "/";
      }, 1500);
    } else {
      showAlert(
        result.message || "Login failed. Please check your credentials.",
        "error",
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    showAlert("An error occurred during login. Please try again.", "error");
  } finally {
    setLoading(false);
  }
}

/**
 * Handle signup form submission
 */
async function handleSignup(event) {
  event.preventDefault();

  if (isLoading) return;

  const formData = new FormData(event.target);
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const agreeTerms = formData.get("agreeTerms") === "on";

  // Validation
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    showAlert("Please fill in all required fields", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("Please enter a valid email address", "error");
    return;
  }

  if (password.length < 8) {
    showAlert("Password must be at least 8 characters long", "error");
    return;
  }

  if (password !== confirmPassword) {
    showAlert("Passwords do not match", "error");
    return;
  }

  if (!agreeTerms) {
    showAlert(
      "Please agree to the Terms of Service and Privacy Policy",
      "error",
    );
    return;
  }

  try {
    setLoading(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showAlert(
        "Account created successfully! Please check your email for verification.",
        "success",
      );

      // Clear form
      event.target.reset();

      // Switch to login form after delay
      setTimeout(() => {
        showLogin();
        // Pre-fill email in login form
        document.getElementById("loginEmail").value = email;
      }, 2000);
    } else {
      showAlert(
        result.message || "Registration failed. Please try again.",
        "error",
      );
    }
  } catch (error) {
    console.error("Signup error:", error);
    showAlert(
      "An error occurred during registration. Please try again.",
      "error",
    );
  } finally {
    setLoading(false);
  }
}

/**
 * Handle forgot password form submission
 */
async function handleForgotPassword(event) {
  event.preventDefault();

  if (isLoading) return;

  const formData = new FormData(event.target);
  const email = formData.get("email");

  if (!email) {
    showAlert("Please enter your email address", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("Please enter a valid email address", "error");
    return;
  }

  try {
    setLoading(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showAlert(
        "Password reset instructions have been sent to your email",
        "success",
      );
      event.target.reset();
    } else {
      showAlert(
        result.message || "Failed to send reset email. Please try again.",
        "error",
      );
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    showAlert("An error occurred. Please try again.", "error");
  } finally {
    setLoading(false);
  }
}

/**
 * Toggle password visibility
 */
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector(".material-icons");

  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "visibility_off";
  } else {
    input.type = "password";
    icon.textContent = "visibility";
  }
}

/**
 * Initialize password strength indicator
 */
function initializePasswordStrength() {
  const passwordInput = document.getElementById("signupPassword");
  if (passwordInput) {
    passwordInput.addEventListener("input", updatePasswordStrength);
  }
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength() {
  const password = document.getElementById("signupPassword").value;
  const strengthBar = document.getElementById("strengthBar");
  const strengthText = document.getElementById("strengthText");

  if (!strengthBar || !strengthText) return;

  const strength = calculatePasswordStrength(password);

  // Remove existing classes
  strengthBar.classList.remove("weak", "fair", "good", "strong");

  // Add appropriate class and update text
  switch (strength.level) {
    case 0:
      strengthText.textContent = "Password strength";
      break;
    case 1:
      strengthBar.classList.add("weak");
      strengthText.textContent = "Weak password";
      break;
    case 2:
      strengthBar.classList.add("fair");
      strengthText.textContent = "Fair password";
      break;
    case 3:
      strengthBar.classList.add("good");
      strengthText.textContent = "Good password";
      break;
    case 4:
      strengthBar.classList.add("strong");
      strengthText.textContent = "Strong password";
      break;
  }
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password) {
  if (!password) return { level: 0, feedback: [] };

  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) score++;
  else feedback.push("Use at least 8 characters");

  if (password.length >= 12) score++;

  // Character diversity
  if (/[a-z]/.test(password)) score++;
  else feedback.push("Include lowercase letters");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Include uppercase letters");

  if (/\d/.test(password)) score++;
  else feedback.push("Include numbers");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push("Include special characters");

  // Common patterns (reduce score)
  if (/(.)\1{2,}/.test(password)) score--; // Repeated characters
  if (/123|abc|qwe|password/i.test(password)) score--; // Common patterns

  return {
    level: Math.max(0, Math.min(4, score - 1)),
    feedback: feedback,
  };
}

/**
 * Validate password match
 */
function validatePasswordMatch() {
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const confirmInput = document.getElementById("confirmPassword");

  if (confirmPassword && password !== confirmPassword) {
    confirmInput.setCustomValidity("Passwords do not match");
  } else {
    confirmInput.setCustomValidity("");
  }
}

/**
 * Validate email format
 */
function validateEmail(event) {
  const email = event.target.value;
  const input = event.target;

  if (email && !isValidEmail(email)) {
    input.setCustomValidity("Please enter a valid email address");
  } else {
    input.setCustomValidity("");
  }
}

/**
 * Check if email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Set loading state
 */
function setLoading(loading) {
  isLoading = loading;

  if (loading) {
    loadingOverlay.classList.add("show");
    // Disable all forms
    document.querySelectorAll("form input, form button").forEach((element) => {
      element.disabled = true;
    });
  } else {
    loadingOverlay.classList.remove("show");
    // Re-enable all forms
    document.querySelectorAll("form input, form button").forEach((element) => {
      element.disabled = false;
    });
  }
}

/**
 * Show alert message
 */
function showAlert(message, type = "info", duration = 5000) {
  const alert = document.createElement("div");
  alert.className = `alert ${type}`;

  const iconMap = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  };

  alert.innerHTML = `
        <span class="material-icons">${iconMap[type] || "info"}</span>
        <span>${message}</span>
        <button class="alert-close" onclick="closeAlert(this)">
            <span class="material-icons">close</span>
        </button>
    `;

  alertContainer.appendChild(alert);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (alert.parentNode) {
        closeAlert(alert.querySelector(".alert-close"));
      }
    }, duration);
  }
}

/**
 * Close alert message
 */
function closeAlert(button) {
  const alert = button.closest(".alert");
  if (alert) {
    alert.style.animation = "slideInRight 0.3s ease-out reverse";
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 300);
  }
}

/**
 * Handle keyboard navigation
 */
function handleKeyboardNavigation(event) {
  // ESC key to close alerts
  if (event.key === "Escape") {
    const alerts = document.querySelectorAll(".alert");
    alerts.forEach((alert) => {
      const closeButton = alert.querySelector(".alert-close");
      if (closeButton) closeAlert(closeButton);
    });
  }

  // Tab between login/signup
  if (event.key === "Tab" && event.altKey) {
    event.preventDefault();
    if (currentForm === "login") {
      showSignup();
    } else if (currentForm === "signup") {
      showLogin();
    }
  }
}

/**
 * Show terms modal (placeholder)
 */
function showTerms() {
  showAlert("Vitrari Terms of Service modal would open here", "info");
}

/**
 * Show privacy modal (placeholder)
 */
function showPrivacy() {
  showAlert("Vitrari Privacy Policy modal would open here", "info");
}

/**
 * Form validation utilities
 */
function validateForm(formElement) {
  const inputs = formElement.querySelectorAll("input[required]");
  let isValid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      input.focus();
      showAlert(
        `Please fill in the ${input.getAttribute("name")} field`,
        "error",
      );
      isValid = false;
      return false;
    }
  });

  return isValid;
}

/**
 * Clear all forms
 */
function clearAllForms() {
  document.querySelectorAll("form").forEach((form) => {
    form.reset();
  });

  // Reset password strength
  const strengthBar = document.getElementById("strengthBar");
  const strengthText = document.getElementById("strengthText");
  if (strengthBar) {
    strengthBar.classList.remove("weak", "fair", "good", "strong");
  }
  if (strengthText) {
    strengthText.textContent = "Password strength";
  }
}

/**
 * Handle browser back/forward buttons
 */
window.addEventListener("popstate", function (event) {
  // Handle browser navigation if needed
});

/**
 * Auto-save form data to prevent loss
 */
function setupFormAutosave() {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    const inputs = form.querySelectorAll(
      'input[type="text"], input[type="email"]',
    );

    inputs.forEach((input) => {
      // Load saved data
      const savedValue = localStorage.getItem(`form_${form.id}_${input.name}`);
      if (savedValue && input.type !== "password") {
        input.value = savedValue;
      }

      // Save on input
      input.addEventListener("input", () => {
        if (input.type !== "password") {
          localStorage.setItem(`form_${form.id}_${input.name}`, input.value);
        }
      });
    });
  });
}

// Initialize autosave
document.addEventListener("DOMContentLoaded", setupFormAutosave);

/**
 * Clear saved form data
 */
function clearSavedFormData() {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith("form_")) {
      localStorage.removeItem(key);
    }
  });
}

// Export functions for global access
window.showLogin = showLogin;
window.showSignup = showSignup;
window.showForgotPassword = showForgotPassword;
window.togglePassword = togglePassword;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleForgotPassword = handleForgotPassword;
window.showTerms = showTerms;
window.showPrivacy = showPrivacy;
window.closeAlert = closeAlert;
