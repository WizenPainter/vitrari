/**
 * Glass Optimizer - Mobile Enhancements
 * Complete mobile UI/UX optimization with proper touch handling and responsive behavior
 */

class MobileEnhancements {
  constructor() {
    this.isMobile = window.innerWidth <= 768;
    this.isTouch = "ontouchstart" in window;
    this.currentPage = this.detectCurrentPage();
    this.sidebarOpen = false;
    this.menuInitialized = false;

    // Debug logging
    console.log("MobileEnhancements initialized:", {
      isMobile: this.isMobile,
      isTouch: this.isTouch,
      width: window.innerWidth,
      currentPage: this.currentPage,
    });

    this.init();
  }

  init() {
    this.setupViewport();
    this.setupOrientationHandler();
    this.setupTouchOptimizations();
    this.setupMobileNavigation();
    this.setupGlobalClickHandlers();

    // Page-specific setups
    switch (this.currentPage) {
      case "designer":
        this.setupDesignerMobile();
        break;
      case "optimizer":
        this.setupOptimizerMobile();
        break;
      case "home":
        this.setupDashboardMobile();
        break;
      case "projects":
        this.setupProjectsMobile();
        break;
    }

    // Refresh on resize
    window.addEventListener("resize", () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth <= 768;
      console.log("Resize detected:", {
        wasMobile,
        nowMobile: this.isMobile,
        width: window.innerWidth,
      });
      this.refresh();
    });
  }

  detectCurrentPage() {
    const path = window.location.pathname;
    if (path.includes("/designer")) return "designer";
    if (path.includes("/optimizer")) return "optimizer";
    if (path.includes("/projects")) return "projects";
    return "home";
  }

  setupViewport() {
    // Ensure proper viewport is set
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head.appendChild(viewport);
    }
    viewport.content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

    // Prevent zoom on input focus
    document.querySelectorAll("input, select, textarea").forEach((element) => {
      if (this.isMobile) {
        element.style.fontSize = "16px";
      }
    });
  }

  setupOrientationHandler() {
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        this.isMobile = window.innerWidth <= 768;
        this.refresh();
      }, 100);
    });
  }

  setupTouchOptimizations() {
    // Improve touch targets
    const minTouchSize = "44px";
    document
      .querySelectorAll('button, .btn, a, [onclick], [role="button"]')
      .forEach((element) => {
        if (this.isMobile) {
          element.style.minHeight = minTouchSize;
          element.style.minWidth = minTouchSize;
          element.style.touchAction = "manipulation";
          element.style.webkitTapHighlightColor = "rgba(0,0,0,0.1)";
          element.style.userSelect = "none";
        }
      });

    // Remove hover states on touch devices
    if (this.isTouch) {
      document.documentElement.classList.add("touch-device");
    }
  }

  setupMobileNavigation() {
    console.log("Setting up mobile navigation, isMobile:", this.isMobile);
    console.log("Screen width:", window.innerWidth);
    console.log("Document ready state:", document.readyState);

    // Try multiple selectors to find header and nav
    let header =
      document.querySelector(".app-header") ||
      document.querySelector(".header") ||
      document.querySelector("header") ||
      document.querySelector("[class*='header']");

    let nav =
      document.querySelector(".app-header nav") ||
      document.querySelector(".header nav") ||
      document.querySelector("header nav") ||
      document.querySelector("nav") ||
      document.querySelector(".main-nav");

    const existingToggle = document.querySelector(".mobile-menu-toggle");

    // Enhanced debugging
    console.log(
      "All headers found:",
      Array.from(document.querySelectorAll("*"))
        .filter(
          (el) => el.className.includes("header") || el.tagName === "HEADER",
        )
        .map((el) => ({
          tag: el.tagName,
          class: el.className,
          id: el.id,
        })),
    );
    console.log(
      "All navs found:",
      Array.from(document.querySelectorAll("nav")).map((el) => ({
        parent: el.parentElement.className,
        class: el.className,
        children: el.children.length,
      })),
    );

    // Debug navigation links
    let debugNavLinks = nav ? nav.querySelector(".nav-links") : null;
    const navLinksCount = debugNavLinks
      ? debugNavLinks.querySelectorAll(".nav-link").length
      : 0;
    let debugLanguageSelector = document.querySelector(".language-selector");

    console.log("DOM elements found:", {
      header: !!header,
      nav: !!nav,
      navLinks: !!debugNavLinks,
      navLinksCount: navLinksCount,
      languageSelector: !!debugLanguageSelector,
      headerSelector: header ? header.className : "not found",
      navSelector: nav ? nav.className : "not found",
      allHeaders: document.querySelectorAll("header").length,
      allNavs: document.querySelectorAll("nav").length,
    });

    if (!header) {
      console.warn(
        "Header not found, retrying in 200ms... Attempt:",
        this.retryCount || 1,
      );
      this.retryCount = (this.retryCount || 0) + 1;
      if (this.retryCount < 10) {
        setTimeout(() => this.setupMobileNavigation(), 200);
      } else {
        console.error("Failed to find header element after 10 attempts");
        // Create fallback elements if nothing found
        this.createFallbackNavigation();
      }
      return;
    }

    // Continue even if nav is not found, we'll create a fallback menu
    if (!nav) {
      console.warn("Nav element not found, will create fallback navigation");
    }

    // Remove existing toggle if present
    if (existingToggle) {
      existingToggle.remove();
    }

    // Create hamburger menu toggle
    const menuToggle = document.createElement("button");
    menuToggle.className = "mobile-menu-toggle";
    menuToggle.setAttribute("aria-label", "Toggle mobile menu");
    menuToggle.innerHTML = "☰";

    // Style the hamburger toggle button
    Object.assign(menuToggle.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "none",
      border: "none",
      color: "white",
      fontSize: "1.5rem",
      padding: "0.5rem",
      cursor: "pointer",
      minHeight: "44px",
      minWidth: "44px",
      borderRadius: "4px",
      touchAction: "manipulation",
      webkitTapHighlightColor: "transparent",
      userSelect: "none",
      position: "absolute",
      top: "50%",
      right: "1rem",
      transform: "translateY(-50%)",
      zIndex: "1001",
    });

    // Position toggle and ensure it's visible
    header.style.position = "relative";
    header.style.minHeight = "60px";
    header.style.padding = "1rem";
    // Insert at the end of header to ensure proper positioning
    header.appendChild(menuToggle);

    // Force display on mobile
    if (this.isMobile || window.innerWidth <= 768) {
      menuToggle.style.display = "flex";
      console.log("Hamburger menu toggle added and made visible");
    } else {
      menuToggle.style.display = "none";
      console.log("Hamburger menu toggle added but hidden (desktop)");
    }

    // Create mobile sidebar container
    let mobileSidebar = document.querySelector(".mobile-sidebar");
    if (!mobileSidebar) {
      mobileSidebar = document.createElement("div");
      mobileSidebar.className = "mobile-sidebar";
      document.body.appendChild(mobileSidebar);
    }

    // Style mobile sidebar
    Object.assign(mobileSidebar.style, {
      position: "fixed",
      top: "0",
      left: "-100%",
      width: "280px",
      height: "100vh",
      background: "var(--primary-color, #2563eb)",
      padding: "1rem",
      boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
      zIndex: "1000",
      transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
    });

    // Show/hide based on mobile detection
    const actuallyMobile = window.innerWidth <= 768;
    console.log("Mobile check:", {
      isMobile: this.isMobile,
      actuallyMobile,
      width: window.innerWidth,
    });

    if (actuallyMobile) {
      menuToggle.style.display = "flex";
      // Hide original navigation elements on mobile
      if (nav) {
        nav.style.display = "none";
      }
      // Find and hide language selector wherever it is
      const langSelector =
        document.querySelector(".language-selector") ||
        (nav && nav.querySelector(".language-selector")) ||
        (header && header.querySelector(".language-selector"));
      if (langSelector) {
        langSelector.style.display = "none";
      }
      this.menuInitialized = true;
      console.log("Mobile menu visible and initialized");
    } else {
      menuToggle.style.display = "none";
      mobileSidebar.style.display = "none";
      // Show original navigation on desktop
      if (nav) {
        nav.style.display = "flex";
      }
      const langSelector =
        document.querySelector(".language-selector") ||
        (nav && nav.querySelector(".language-selector")) ||
        (header && header.querySelector(".language-selector"));
      if (langSelector) {
        langSelector.style.display = "flex";
      }
      console.log("Desktop mode - hamburger hidden");
    }

    // Add close button to mobile sidebar (top-right corner)
    let closeButton = mobileSidebar.querySelector(".mobile-close-btn");
    if (!closeButton) {
      closeButton = document.createElement("button");
      closeButton.className = "mobile-close-btn";
      closeButton.innerHTML = "✕";
      closeButton.setAttribute("aria-label", "Close mobile menu");

      Object.assign(closeButton.style, {
        position: "absolute",
        top: "1rem",
        right: "1rem",
        background: "rgba(255, 255, 255, 0.15)",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "8px",
        color: "white",
        fontSize: "1.25rem",
        fontWeight: "bold",
        padding: "8px",
        cursor: "pointer",
        minHeight: "40px",
        minWidth: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "1001",
        transition: "all 0.2s ease",
        touchAction: "manipulation",
        webkitTapHighlightColor: "transparent",
        userSelect: "none",
      });

      closeButton.addEventListener("click", () => this.closeMobileMenu());
      closeButton.addEventListener("touchend", (e) => {
        e.preventDefault();
        this.closeMobileMenu();
      });

      // Add hover effects
      closeButton.addEventListener("mouseenter", () => {
        closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
        closeButton.style.borderColor = "rgba(255, 255, 255, 0.4)";
        closeButton.style.transform = "scale(1.1)";
      });

      closeButton.addEventListener("mouseleave", () => {
        closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
        closeButton.style.borderColor = "rgba(255, 255, 255, 0.2)";
        closeButton.style.transform = "scale(1)";
      });

      mobileSidebar.appendChild(closeButton);
      console.log("Added close button to mobile sidebar");
    }

    // Create mobile menu content container
    let menuContent = mobileSidebar.querySelector(".mobile-menu-content");
    if (!menuContent) {
      menuContent = document.createElement("div");
      menuContent.className = "mobile-menu-content";
      mobileSidebar.appendChild(menuContent);
    }

    Object.assign(menuContent.style, {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      paddingTop: "3rem", // Space for close button
      width: "100%",
    });

    // Clear existing content
    menuContent.innerHTML = "";

    // Get navigation links and language selector - check both .nav-links and direct nav children
    let navLinks = nav
      ? nav.querySelector(".nav-links") || nav.querySelector("nav") || nav
      : null;
    let languageSelector =
      document.querySelector(".language-selector") ||
      (nav ? nav.querySelector(".language-selector") : null) ||
      (header ? header.querySelector(".language-selector") : null) ||
      document.querySelector("[class*='lang']");

    console.log("Found elements for mobile menu:", {
      navLinks: !!navLinks,
      navLinksCount: navLinks
        ? navLinks.querySelectorAll(".nav-link").length
        : 0,
      languageSelector: !!languageSelector,
      langButtonsCount: languageSelector
        ? languageSelector.querySelectorAll(".lang-btn").length
        : 0,
    });

    // Add navigation links to mobile menu
    let navItems = navLinks ? navLinks.querySelectorAll(".nav-link") : [];

    // If no .nav-link found, try to find direct anchor tags in nav
    if (navItems.length === 0 && nav) {
      navItems = nav.querySelectorAll("a");
      console.log("Using direct nav anchor tags, found:", navItems.length);
    }

    if (navItems.length > 0) {
      console.log("Adding", navItems.length, "navigation items to mobile menu");
      navItems.forEach((link, index) => {
        console.log(
          "Processing nav link",
          index + 1,
          ":",
          link.textContent.trim(),
        );
        const mobileLink = document.createElement("button");
        mobileLink.className = "mobile-nav-button";
        mobileLink.innerHTML = link.innerHTML;
        mobileLink.setAttribute("data-href", link.href);

        Object.assign(mobileLink.style, {
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "16px 20px",
          margin: "4px 0",
          color: "white",
          background: "transparent",
          border: "1px solid transparent",
          borderRadius: "8px",
          textAlign: "left",
          fontSize: "16px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s ease",
          minHeight: "48px",
          touchAction: "manipulation",
          webkitTapHighlightColor: "transparent",
          userSelect: "none",
          boxSizing: "border-box",
        });

        // Add click handler
        mobileLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.closeMobileMenu();
          setTimeout(() => {
            window.location.href = mobileLink.getAttribute("data-href");
          }, 300);
        });

        // Add touch feedback
        mobileLink.addEventListener("touchstart", () => {
          mobileLink.style.backgroundColor = "rgba(255,255,255,0.15)";
          mobileLink.style.borderColor = "rgba(255,255,255,0.3)";
        });

        mobileLink.addEventListener("touchend", () => {
          setTimeout(() => {
            mobileLink.style.backgroundColor = "transparent";
            mobileLink.style.borderColor = "transparent";
          }, 200);
        });

        menuContent.appendChild(mobileLink);
        console.log("Added mobile nav button:", mobileLink.textContent.trim());
      });
      console.log("Finished adding navigation buttons to mobile menu");
    } else {
      console.warn("No navigation links found, creating fallback navigation");
      // Create fallback navigation buttons
      const fallbackLinks = [
        { text: "Home", href: "/" },
        { text: "Designer", href: "/designer" },
        { text: "Optimizer", href: "/optimizer" },
        { text: "Projects", href: "/projects" },
      ];

      fallbackLinks.forEach((linkData) => {
        const mobileLink = document.createElement("button");
        mobileLink.className = "mobile-nav-button";
        mobileLink.innerHTML = linkData.text;
        mobileLink.setAttribute("data-href", linkData.href);

        Object.assign(mobileLink.style, {
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "16px 20px",
          margin: "4px 0",
          color: "white",
          background: "transparent",
          border: "1px solid transparent",
          borderRadius: "8px",
          textAlign: "left",
          fontSize: "16px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s ease",
          minHeight: "48px",
          touchAction: "manipulation",
          webkitTapHighlightColor: "transparent",
          userSelect: "none",
          boxSizing: "border-box",
        });

        // Add click handler
        mobileLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.closeMobileMenu();
          setTimeout(() => {
            window.location.href = mobileLink.getAttribute("data-href");
          }, 300);
        });

        // Add touch feedback
        mobileLink.addEventListener("touchstart", () => {
          mobileLink.style.backgroundColor = "rgba(255,255,255,0.15)";
          mobileLink.style.borderColor = "rgba(255,255,255,0.3)";
        });

        mobileLink.addEventListener("touchend", () => {
          setTimeout(() => {
            mobileLink.style.backgroundColor = "transparent";
            mobileLink.style.borderColor = "transparent";
          }, 200);
        });

        menuContent.appendChild(mobileLink);
        console.log("Added fallback nav button:", linkData.text);
      });
    }

    // Add language selector to mobile menu
    if (
      languageSelector &&
      languageSelector.querySelectorAll(".lang-btn").length > 0
    ) {
      console.log("Adding language selector to mobile menu");
      const langContainer = document.createElement("div");
      langContainer.className = "mobile-lang-container";
      Object.assign(langContainer.style, {
        display: "flex",
        gap: "8px",
        marginTop: "1rem",
        padding: "0 20px",
      });

      const langButtons = languageSelector.querySelectorAll(".lang-btn");
      console.log("Found", langButtons.length, "language buttons");
      langButtons.forEach((btn, index) => {
        console.log(
          "Processing lang button",
          index + 1,
          ":",
          btn.textContent.trim(),
        );
        const mobileLangBtn = document.createElement("button");
        mobileLangBtn.className = "mobile-lang-btn";
        mobileLangBtn.innerHTML = btn.innerHTML;
        mobileLangBtn.setAttribute("data-lang", btn.getAttribute("data-lang"));

        Object.assign(mobileLangBtn.style, {
          flex: "1",
          padding: "12px",
          color: "white",
          background: btn.classList.contains("active")
            ? "rgba(255,255,255,0.2)"
            : "transparent",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s ease",
          minHeight: "40px",
          touchAction: "manipulation",
          webkitTapHighlightColor: "transparent",
          userSelect: "none",
        });

        // Add click handler (you may need to implement language switching logic)
        mobileLangBtn.addEventListener("click", (e) => {
          e.preventDefault();
          // Add your language switching logic here
          console.log(
            "Language button clicked:",
            mobileLangBtn.getAttribute("data-lang"),
          );
        });

        langContainer.appendChild(mobileLangBtn);
        console.log(
          "Added mobile lang button:",
          mobileLangBtn.textContent.trim(),
        );
      });

      menuContent.appendChild(langContainer);
      console.log("Finished adding language selector to mobile menu");
    } else {
      console.warn(
        "No language selector found, creating fallback language buttons",
      );
      // Create fallback language selector
      const langContainer = document.createElement("div");
      langContainer.className = "mobile-lang-container";
      Object.assign(langContainer.style, {
        display: "flex",
        gap: "8px",
        marginTop: "1rem",
        padding: "0 20px",
      });

      const fallbackLangs = [
        { text: "EN", lang: "en", active: false },
        { text: "ES", lang: "es", active: true },
      ];

      fallbackLangs.forEach((langData) => {
        const mobileLangBtn = document.createElement("button");
        mobileLangBtn.className = "mobile-lang-btn";
        mobileLangBtn.innerHTML = langData.text;
        mobileLangBtn.setAttribute("data-lang", langData.lang);

        Object.assign(mobileLangBtn.style, {
          flex: "1",
          padding: "12px",
          color: "white",
          background: langData.active ? "rgba(255,255,255,0.2)" : "transparent",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s ease",
          minHeight: "40px",
          touchAction: "manipulation",
          webkitTapHighlightColor: "transparent",
          userSelect: "none",
        });

        // Add click handler
        mobileLangBtn.addEventListener("click", (e) => {
          e.preventDefault();
          console.log("Language button clicked:", langData.lang);
        });

        langContainer.appendChild(mobileLangBtn);
        console.log("Added fallback lang button:", langData.text);
      });

      menuContent.appendChild(langContainer);
    }

    // Store reference to mobile sidebar
    this.mobileSidebar = mobileSidebar;

    // Toggle functionality
    const toggleMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.sidebarOpen) {
        this.closeMobileMenu();
      } else {
        this.openMobileMenu();
      }
    };

    // Use both click and touchend for better compatibility
    menuToggle.addEventListener("click", toggleMenu);
    menuToggle.addEventListener("touchend", (e) => {
      e.preventDefault();
      toggleMenu(e);
    });

    this.menuInitialized = true;
  }

  openMobileMenu() {
    const mobileSidebar =
      this.mobileSidebar || document.querySelector(".mobile-sidebar");
    const toggle = document.querySelector(".mobile-menu-toggle");

    if (mobileSidebar && toggle) {
      // Add backdrop
      if (!document.querySelector(".mobile-nav-backdrop")) {
        const backdrop = document.createElement("div");
        backdrop.className = "mobile-nav-backdrop";
        Object.assign(backdrop.style, {
          position: "fixed",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          zIndex: "999",
          opacity: "0",
          transition: "opacity 0.3s ease",
        });
        backdrop.addEventListener("click", () => this.closeMobileMenu());
        document.body.appendChild(backdrop);
      }

      const backdrop = document.querySelector(".mobile-nav-backdrop");
      backdrop.style.opacity = "1";

      // Slide in from left
      Object.assign(mobileSidebar.style, {
        left: "0",
      });
      mobileSidebar.classList.add("mobile-open");

      toggle.innerHTML = "✕";
      toggle.classList.add("menu-open");

      this.sidebarOpen = true;
      document.body.style.overflow = "hidden"; // Prevent scrolling
    }
  }

  closeMobileMenu() {
    const mobileSidebar =
      this.mobileSidebar || document.querySelector(".mobile-sidebar");
    const toggle = document.querySelector(".mobile-menu-toggle");
    const backdrop = document.querySelector(".mobile-nav-backdrop");

    if (mobileSidebar && toggle) {
      // Hide backdrop
      if (backdrop) {
        backdrop.style.opacity = "0";
        setTimeout(() => {
          if (backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
          }
        }, 300);
      }

      // Slide out to left
      Object.assign(mobileSidebar.style, {
        left: "-100%",
      });
      mobileSidebar.classList.remove("mobile-open");

      toggle.innerHTML = "☰";
      toggle.classList.remove("menu-open");

      this.sidebarOpen = false;
      document.body.style.overflow = ""; // Restore scrolling
    }
  }

  setupGlobalClickHandlers() {
    // Close mobile menu when clicking outside or on backdrop
    document.addEventListener("click", (e) => {
      const nav =
        document.querySelector(".app-header nav") ||
        document.querySelector("header nav") ||
        document.querySelector("nav");
      const toggle = document.querySelector(".mobile-menu-toggle");
      const header =
        document.querySelector(".app-header") ||
        document.querySelector("header");
      const backdrop = document.querySelector(".mobile-nav-backdrop");

      if (
        this.sidebarOpen &&
        nav &&
        !header.contains(e.target) &&
        !nav.contains(e.target)
      ) {
        this.closeMobileMenu();
      }
    });

    // Handle escape key to close menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.sidebarOpen) {
        this.closeMobileMenu();
      }
    });

    // Improve button click handling
    document
      .querySelectorAll('button, .btn, [role="button"]')
      .forEach((button) => {
        // Remove multiple event listeners that might conflict
        button.style.touchAction = "manipulation";

        // Add visual feedback
        this.addTouchFeedback(button);
      });
  }

  addTouchFeedback(element) {
    if (!this.isTouch) return;

    element.addEventListener("touchstart", () => {
      element.style.transform = "scale(0.98)";
      element.style.opacity = "0.8";
    });

    element.addEventListener("touchend", () => {
      setTimeout(() => {
        element.style.transform = "scale(1)";
        element.style.opacity = "1";
      }, 100);
    });

    element.addEventListener("touchcancel", () => {
      element.style.transform = "scale(1)";
      element.style.opacity = "1";
    });
  }

  setupDesignerMobile() {
    if (!this.isMobile) return;

    console.log("Setting up designer mobile enhancements");

    // Wait for designer to be available
    const initDesigner = () => {
      const canvas = document.querySelector("#design-canvas");
      const canvasArea = document.querySelector(".canvas-area");
      const toolbar = document.querySelector(".canvas-toolbar");
      const sidebar = document.querySelector(".sidebar");
      const designerLayout = document.querySelector(".designer-layout");

      console.log("Designer elements found:", {
        canvas: !!canvas,
        canvasArea: !!canvasArea,
        toolbar: !!toolbar,
        sidebar: !!sidebar,
        designerLayout: !!designerLayout,
      });

      if (canvas) {
        this.setupCanvasTouchHandling(canvas);
        this.setupResponsiveCanvas(canvas);
      }

      if (toolbar) {
        this.setupMobileToolbar(toolbar);
      }

      if (sidebar) {
        this.setupSidebarCollapse(sidebar);
        this.setupMobileToolList(sidebar);
      }

      if (designerLayout) {
        this.setupDesignerLayout(designerLayout);
      }

      // Add mobile-specific zoom and pan controls
      this.addMobileCanvasControls(canvasArea);

      // Setup orientation change handler
      this.setupDesignerOrientationHandler();
    };

    if (document.readyState === "complete") {
      setTimeout(initDesigner, 100);
    } else {
      window.addEventListener("load", () => setTimeout(initDesigner, 100));
    }
  }

  setupCanvasTouchHandling(canvas) {
    console.log("Setting up canvas touch handling");

    let lastTouchEnd = 0;

    // Prevent double-tap zoom on canvas
    canvas.addEventListener("touchend", (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    // Improve touch responsiveness
    canvas.style.touchAction = "pan-x pan-y";
    canvas.style.webkitTouchCallout = "none";
    canvas.style.webkitUserSelect = "none";
    canvas.style.userSelect = "none";

    // Add touch feedback for drawing tools
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        canvas.style.filter = "brightness(0.95)";
      }
    }, { passive: true });

    canvas.addEventListener("touchend", (e) => {
      canvas.style.filter = "";
    }, { passive: true });
  }

  setupResponsiveCanvas(canvas) {
    console.log("Setting up responsive canvas");

    // Ensure canvas is responsive
    const makeCanvasResponsive = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const maxWidth = Math.min(containerWidth - 20, window.innerWidth - 20);
      const maxHeight = Math.min(containerHeight, window.innerHeight * 0.6);

      canvas.style.maxWidth = maxWidth + "px";
      canvas.style.maxHeight = maxHeight + "px";
      canvas.style.width = "100%";
      canvas.style.height = "auto";

      // Trigger canvas resize if designer is available
      if (window.designer && typeof window.designer.setupCanvas === "function") {
        window.designer.setupCanvas();
        window.designer.render();
      }
    };

    // Initial setup
    setTimeout(makeCanvasResponsive, 100);

    // Handle orientation changes
    window.addEventListener("orientationchange", () => {
      setTimeout(makeCanvasResponsive, 200);
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      clearTimeout(this.canvasResizeTimeout);
      this.canvasResizeTimeout = setTimeout(makeCanvasResponsive, 150);
    });
  }

  setupMobileToolList(sidebar) {
    console.log("Setting up mobile tool list");

    const toolList = sidebar.querySelector(".tool-list");
    if (!toolList) return;

    // Make tool list horizontally scrollable on mobile
    toolList.style.display = "flex";
    toolList.style.overflowX = "auto";
    toolList.style.webkitOverflowScrolling = "touch";
    toolList.style.scrollSnapType = "x mandatory";
    toolList.style.padding = "1rem";
    toolList.style.gap = "0.75rem";

    // Style individual tool buttons for mobile
    const toolButtons = toolList.querySelectorAll(".tool-btn");
    toolButtons.forEach((btn) => {
      btn.style.minWidth = "100px";
      btn.style.minHeight = "60px";
      btn.style.flexShrink = "0";
      btn.style.scrollSnapAlign = "start";
      btn.style.display = "flex";
      btn.style.flexDirection = "column";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.fontSize = "0.8rem";
      btn.style.lineHeight = "1.2";
      btn.style.textAlign = "center";
      btn.style.borderRadius = "8px";
      btn.style.border = "2px solid var(--border)";
      btn.style.background = "white";
      btn.style.transition = "all 0.2s ease";
    });
  }

  setupDesignerLayout(layout) {
    console.log("Setting up designer layout for mobile");

    layout.style.display = "flex";
    layout.style.flexDirection = "column";
    layout.style.height = "100vh";
    layout.style.overflow = "hidden";
  }

  addMobileCanvasControls(canvasArea) {
    if (!canvasArea || document.querySelector(".mobile-canvas-controls")) return;

    console.log("Adding mobile canvas controls");

    const controlsContainer = document.createElement("div");
    controlsContainer.className = "mobile-canvas-controls";
    controlsContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 10px;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 100;
      pointer-events: none;
    `;

    // Zoom In Button
    const zoomInBtn = this.createMobileControlButton("+", "Zoom In");
    zoomInBtn.addEventListener("click", () => {
      if (window.designer) {
        window.designer.scale = Math.min(window.designer.scale * 1.2, 2);
        window.designer.setupCanvas();
        window.designer.render();
      }
    });

    // Zoom Out Button
    const zoomOutBtn = this.createMobileControlButton("-", "Zoom Out");
    zoomOutBtn.addEventListener("click", () => {
      if (window.designer) {
        window.designer.scale = Math.max(window.designer.scale / 1.2, 0.1);
        window.designer.setupCanvas();
        window.designer.render();
      }
    });

    // Reset Zoom Button
    const resetBtn = this.createMobileControlButton("⌂", "Reset View");
    resetBtn.addEventListener("click", () => {
      if (window.designer) {
        window.designer.setupCanvas();
        window.designer.render();
      }
    });

    controlsContainer.appendChild(zoomInBtn);
    controlsContainer.appendChild(zoomOutBtn);
    controlsContainer.appendChild(resetBtn);

    document.body.appendChild(controlsContainer);
  }

  createMobileControlButton(text, title) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.title = title;
    btn.style.cssText = `
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
      pointer-events: auto;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    `;

    btn.addEventListener("touchstart", () => {
      btn.style.transform = "scale(0.95)";
      btn.style.background = "rgba(37, 99, 235, 0.1)";
    });

    btn.addEventListener("touchend", () => {
      btn.style.transform = "scale(1)";
      btn.style.background = "rgba(255, 255, 255, 0.9)";
    });

    return btn;
  }

  setupDesignerOrientationHandler() {
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        if (window.designer) {
          console.log("Handling orientation change for designer");
          window.designer.setupCanvas();
          window.designer.render();
        }
      }, 300);
    });
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2),
        );

        if (initialDistance > 0) {
          const scale = distance / initialDistance;
          // Trigger zoom event if designer supports it
          if (window.designer && window.designer.handleZoom) {
            window.designer.handleZoom(scale);
          }
        }
      }
    });
  }

  setupMobileToolbar(toolbar) {
    // Make toolbar horizontal scrollable on mobile
    Object.assign(toolbar.style, {
      overflowX: "auto",
      overflowY: "hidden",
      whiteSpace: "nowrap",
      padding: "0.5rem",
      position: "sticky",
      top: "60px",
      zIndex: "100",
      background: "white",
      borderBottom: "1px solid #e5e7eb",
    });

    // Style toolbar buttons
    toolbar.querySelectorAll("button, .btn").forEach((button) => {
      Object.assign(button.style, {
        minWidth: "44px",
        minHeight: "44px",
        margin: "0 4px",
        flexShrink: "0",
      });
    });
  }

  setupSidebarCollapse(sidebar) {
    if (!this.isMobile) return;

    // Create collapsible sidebar for mobile
    Object.assign(sidebar.style, {
      position: "fixed",
      top: "60px",
      right: "-300px",
      width: "300px",
      height: "calc(100vh - 60px)",
      background: "white",
      boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
      zIndex: "999",
      transition: "right 0.3s ease-in-out",
      overflowY: "auto",
    });

    // Add toggle button
    const toggleButton = document.createElement("button");
    toggleButton.className = "sidebar-toggle";
    toggleButton.innerHTML = "⚙️";

    Object.assign(toggleButton.style, {
      position: "fixed",
      top: "70px",
      right: "10px",
      zIndex: "1000",
      background: "var(--primary, #2563eb)",
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "44px",
      height: "44px",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    });

    document.body.appendChild(toggleButton);

    toggleButton.addEventListener("click", () => {
      const isOpen = sidebar.style.right === "0px";
      sidebar.style.right = isOpen ? "-300px" : "0px";
      toggleButton.innerHTML = isOpen ? "⚙️" : "✕";
    });
  }

  setupOptimizerMobile() {
    if (!this.isMobile) return;

    // Make optimizer controls more touch-friendly
    const controls = document.querySelectorAll(
      ".optimizer-controls input, .optimizer-controls select",
    );
    controls.forEach((control) => {
      control.style.fontSize = "16px";
      control.style.padding = "12px";
      control.style.minHeight = "44px";
    });

    // Make results scrollable
    const results = document.querySelector(".optimization-results");
    if (results) {
      results.style.overflowX = "auto";
    }
  }

  setupDashboardMobile() {
    if (!this.isMobile) return;

    // Make dashboard cards stack vertically
    const cardGrid = document.querySelector(".dashboard-grid, .stats-grid");
    if (cardGrid) {
      Object.assign(cardGrid.style, {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      });
    }

    // Improve project tree for mobile
    this.setupProjectTreeMobile();
  }

  setupProjectsMobile() {
    if (!this.isMobile) return;
    this.setupProjectTreeMobile();
  }

  setupProjectTreeMobile() {
    const projectTree = document.querySelector(
      "#projects-tree, .projects-tree",
    );
    if (projectTree) {
      Object.assign(projectTree.style, {
        overflowX: "auto",
        padding: "0.5rem",
      });

      // Make project nodes more touch-friendly
      projectTree
        .querySelectorAll(".project-node, .project-item")
        .forEach((node) => {
          Object.assign(node.style, {
            minHeight: "44px",
            padding: "12px",
            margin: "4px 0",
            borderRadius: "4px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          });
        });
    }
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background:
        type === "error"
          ? "#dc2626"
          : type === "success"
            ? "#16a34a"
            : "#2563eb",
      color: "white",
      padding: "12px 24px",
      borderRadius: "8px",
      zIndex: "10000",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      fontSize: "14px",
      maxWidth: "90vw",
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  refresh() {
    console.log("Refreshing mobile enhancements, isMobile:", this.isMobile);

    const menuToggle = document.querySelector(".mobile-menu-toggle");
    const mobileSidebar =
      this.mobileSidebar || document.querySelector(".mobile-sidebar");
    const nav =
      document.querySelector(".app-header nav") ||
      document.querySelector(".header nav") ||
      document.querySelector("header nav") ||
      document.querySelector("nav");
    const backdrop = document.querySelector(".mobile-nav-backdrop");
    const header =
      document.querySelector(".app-header") || document.querySelector("header");

    if (this.isMobile) {
      // Mobile mode
      if (menuToggle) {
        menuToggle.style.display = "flex";
      } else {
        this.setupMobileNavigation();
      }

      // Hide original navigation elements on mobile
      if (nav) {
        nav.style.display = "none";
      }
      const langSelector =
        document.querySelector(".language-selector") ||
        nav?.querySelector(".language-selector") ||
        header?.querySelector(".language-selector");
      if (langSelector) {
        langSelector.style.display = "none";
      }
    } else {
      // Desktop mode
      if (menuToggle) {
        menuToggle.style.display = "none";
      }
      if (mobileSidebar) {
        mobileSidebar.style.left = "-100%";
        mobileSidebar.classList.remove("mobile-open");
      }
      if (nav) {
        nav.style.display = "flex";
        nav.style.position = "relative";
        nav.style.left = "auto";
        nav.style.width = "auto";
        nav.style.height = "auto";
        nav.style.padding = "";
        nav.style.boxShadow = "none";
        nav.style.opacity = "1";
        nav.style.visibility = "visible";
        nav.classList.remove("mobile-open");
      }
      const langSelector =
        document.querySelector(".language-selector") ||
        nav?.querySelector(".language-selector") ||
        header?.querySelector(".language-selector");
      if (langSelector) {
        langSelector.style.display = "flex";
      }
      if (backdrop) {
        backdrop.remove();
      }
      document.body.style.overflow = "";
      this.sidebarOpen = false;
    }
  }

  createFallbackNavigation() {
    console.log("Creating fallback navigation");

    // Create header if it doesn't exist
    let header =
      document.querySelector(".app-header") ||
      document.querySelector(".header") ||
      document.querySelector("header") ||
      document.body.firstElementChild;
    if (
      !header ||
      (header.tagName !== "HEADER" && !header.classList.contains("header"))
    ) {
      header = document.createElement("header");
      header.className = "header";
      header.style.cssText = `
        background: #2563eb;
        color: white;
        padding: 0.75rem 1rem;
        position: relative;
        z-index: 1000;
      `;
      document.body.insertBefore(header, document.body.firstChild);
      console.log("Created fallback header");
    }

    // Create nav if it doesn't exist
    let nav = header.querySelector("nav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "flex items-center main-nav";
      nav.innerHTML = `
        <ul class="nav-links" style="display: flex; list-style: none; margin: 0; padding: 0; gap: 1rem;">
          <li><a href="/" class="nav-link" style="color: white; text-decoration: none; padding: 0.5rem;">Home</a></li>
          <li><a href="/designer" class="nav-link" style="color: white; text-decoration: none; padding: 0.5rem;">Designer</a></li>
          <li><a href="/optimizer" class="nav-link" style="color: white; text-decoration: none; padding: 0.5rem;">Optimizer</a></li>
          <li><a href="/projects" class="nav-link" style="color: white; text-decoration: none; padding: 0.5rem;">Projects</a></li>
        </ul>
      `;
      header.appendChild(nav);
      console.log("Created fallback nav");
    }

    // Reset retry count and try again
    this.retryCount = 0;
    setTimeout(() => this.setupMobileNavigation(), 100);
  }
}

// Global mobile functions for backward compatibility
window.toggleMobileMenu = function () {
  if (window.mobileEnhancements) {
    if (window.mobileEnhancements.sidebarOpen) {
      window.mobileEnhancements.closeMobileMenu();
    } else {
      window.mobileEnhancements.openMobileMenu();
    }
  }
};

window.toggleMobileSidebar = function () {
  const sidebar = document.querySelector(".sidebar, .designer-sidebar");
  if (sidebar) {
    const isOpen = sidebar.style.right === "0px" || !sidebar.style.right;
    sidebar.style.right = isOpen ? "-300px" : "0px";
  }
};

// Manual initialization function
window.initMobileEnhancements = function () {
  console.log("Manual mobile enhancement initialization triggered");
  window.mobileEnhancements = new MobileEnhancements();
};

// Manual DOM inspection function
window.inspectDOM = function () {
  console.log("=== DOM INSPECTION ===");
  console.log("All headers:", document.querySelectorAll("header"));
  console.log("All navs:", document.querySelectorAll("nav"));
  console.log(
    "Elements with 'header' in class:",
    document.querySelectorAll("[class*='header']"),
  );
  console.log(
    "Elements with 'nav' in class:",
    document.querySelectorAll("[class*='nav']"),
  );
  console.log(
    "Document body children:",
    Array.from(document.body.children).map((el) => ({
      tag: el.tagName,
      class: el.className,
    })),
  );
  console.log("App container:", document.querySelector(".app-container"));
  console.log("=== END INSPECTION ===");
};

// Manual hamburger creation function
window.createHamburger = function () {
  console.log("Manual hamburger creation triggered");

  // Find any header element
  let header =
    document.querySelector("header") ||
    document.querySelector(".app-header") ||
    document.querySelector("[class*='header']") ||
    document.body.firstElementChild;

  if (!header) {
    console.error("No header found, creating one");
    header = document.createElement("header");
    header.className = "app-header";
    header.style.cssText = `
      background: #2563eb;
      color: white;
      padding: 0.75rem 1rem;
      position: relative;
      z-index: 1000;
    `;
    document.body.insertBefore(header, document.body.firstChild);
  }

  // Create hamburger button
  const hamburger = document.createElement("button");
  hamburger.className = "mobile-menu-toggle";
  hamburger.innerHTML = "☰";
  hamburger.style.cssText = `
    display: flex !important;
    position: absolute;
    top: 50%;
    right: 1rem;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    padding: 0.5rem;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    z-index: 1001;
    border-radius: 6px;
  `;

  // Remove existing hamburger
  const existing = header.querySelector(".mobile-menu-toggle");
  if (existing) {
    existing.remove();
  }

  header.appendChild(hamburger);
  console.log("Hamburger button created and added to header");

  // Add click handler
  hamburger.addEventListener("click", function () {
    console.log("Hamburger clicked!");
    if (window.mobileEnhancements) {
      if (window.mobileEnhancements.sidebarOpen) {
        window.mobileEnhancements.closeMobileMenu();
      } else {
        window.mobileEnhancements.openMobileMenu();
      }
    }
  });

  return hamburger;
};

// Initialize mobile enhancements with multiple fallbacks
function initializeWithFallbacks() {
  console.log("Initializing mobile enhancements...");

  // Try immediate initialization if DOM is ready
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    console.log("DOM ready, initializing immediately");
    window.mobileEnhancements = new MobileEnhancements();
  } else {
    console.log("DOM not ready, waiting for DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", () => {
      console.log("DOMContentLoaded fired, initializing");
      window.mobileEnhancements = new MobileEnhancements();
    });

    // Fallback after 1 second
    setTimeout(() => {
      if (!window.mobileEnhancements) {
        console.log("Fallback initialization after timeout");
        window.mobileEnhancements = new MobileEnhancements();
      }
    }, 1000);
  }
}

// Initialize
initializeWithFallbacks();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = MobileEnhancements;
}
