/**
 * Client-side Validation Configuration for Decap CMS
 *
 * Provides comprehensive validation rules and error handling for the CMS interface
 */

// Custom validation functions for CMS fields
window.CMS_VALIDATION = {
  // Email validation
  validateEmail: function (value) {
    if (!value) return true; // Allow empty for optional fields
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || "Please enter a valid email address";
  },

  // Phone number validation
  validatePhone: function (value) {
    if (!value) return true; // Allow empty for optional fields
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return (
      phoneRegex.test(value.replace(/[\s-]/g, "")) ||
      "Please enter a valid phone number with country code"
    );
  },

  // URL validation
  validateURL: function (value) {
    if (!value) return true; // Allow empty for optional fields
    try {
      new URL(value);
      return true;
    } catch {
      return "Please enter a valid URL (including http:// or https://)";
    }
  },

  // Date validation
  validateDate: function (value) {
    if (!value) return true; // Allow empty for optional fields
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return "Please enter a valid date";
    }
    if (date > new Date()) {
      return "Date cannot be in the future";
    }
    return true;
  },

  // Required field validation
  validateRequired: function (value, fieldName) {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return `${fieldName} is required`;
    }
    return true;
  },

  // String length validation
  validateLength: function (value, min, max, fieldName) {
    if (!value) return true; // Allow empty for optional fields
    const length = value.length;
    if (min && length < min) {
      return `${fieldName} must be at least ${min} characters long`;
    }
    if (max && length > max) {
      return `${fieldName} must be no more than ${max} characters long`;
    }
    return true;
  },

  // Number range validation
  validateRange: function (value, min, max, fieldName) {
    if (value === null || value === undefined || value === "") return true;
    const num = Number(value);
    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }
    if (min !== undefined && num < min) {
      return `${fieldName} must be at least ${min}`;
    }
    if (max !== undefined && num > max) {
      return `${fieldName} must be no more than ${max}`;
    }
    return true;
  },

  // Image file validation
  validateImage: function (value) {
    if (!value) return true; // Allow empty for optional fields
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const extension = value.toLowerCase().substring(value.lastIndexOf("."));
    if (!allowedExtensions.includes(extension)) {
      return `Image must be one of: ${allowedExtensions.join(", ")}`;
    }
    return true;
  },

  // Array validation
  validateArray: function (value, minItems, maxItems, fieldName) {
    if (!value) return true; // Allow empty for optional fields
    if (!Array.isArray(value)) {
      return `${fieldName} must be a list`;
    }
    if (minItems && value.length < minItems) {
      return `${fieldName} must have at least ${minItems} items`;
    }
    if (maxItems && value.length > maxItems) {
      return `${fieldName} must have no more than ${maxItems} items`;
    }
    return true;
  },

  // Project-specific validations
  validateProject: function (entry) {
    const errors = [];
    const data = entry.get("data");

    // Required fields
    const requiredFields = [
      "title",
      "category",
      "status",
      "location",
      "shortDescription",
    ];
    requiredFields.forEach((field) => {
      const result = this.validateRequired(data.get(field), field);
      if (result !== true) errors.push(result);
    });

    // Completion date for completed projects
    if (data.get("status") === "Completed" && !data.get("completionDate")) {
      errors.push("Completion date is required for completed projects");
    }

    // Image validation
    const images = data.get("images");
    if (images && !images.get("main")) {
      errors.push("Main project image is required");
    }

    return errors.length > 0 ? errors : true;
  },

  // Blog-specific validations
  validateBlog: function (entry) {
    const errors = [];
    const data = entry.get("data");

    // Required fields
    const requiredFields = ["title", "date", "author", "excerpt"];
    requiredFields.forEach((field) => {
      const result = this.validateRequired(data.get(field), field);
      if (result !== true) errors.push(result);
    });

    // Featured image for published posts
    if (data.get("published") && !data.get("featuredImage")) {
      errors.push("Featured image is required for published blog posts");
    }

    // Excerpt length
    const excerpt = data.get("excerpt");
    if (excerpt) {
      const lengthResult = this.validateLength(excerpt, 50, 200, "Excerpt");
      if (lengthResult !== true) errors.push(lengthResult);
    }

    return errors.length > 0 ? errors : true;
  },

  // Service-specific validations
  validateService: function (entry) {
    const errors = [];
    const data = entry.get("data");

    // Required fields
    const requiredFields = ["title", "category", "description"];
    requiredFields.forEach((field) => {
      const result = this.validateRequired(data.get(field), field);
      if (result !== true) errors.push(result);
    });

    // Features array
    const features = data.get("features");
    const featuresResult = this.validateArray(features, 1, 10, "Features");
    if (featuresResult !== true) errors.push(featuresResult);

    return errors.length > 0 ? errors : true;
  },

  // Team-specific validations
  validateTeam: function (entry) {
    const errors = [];
    const data = entry.get("data");

    // Required fields
    const requiredFields = ["name", "position", "bio"];
    requiredFields.forEach((field) => {
      const result = this.validateRequired(data.get(field), field);
      if (result !== true) errors.push(result);
    });

    // Email validation if provided
    const contact = data.get("contact");
    if (contact && contact.get("email")) {
      const emailResult = this.validateEmail(contact.get("email"));
      if (emailResult !== true) errors.push(emailResult);
    }

    // Phone validation if provided
    if (contact && contact.get("phone")) {
      const phoneResult = this.validatePhone(contact.get("phone"));
      if (phoneResult !== true) errors.push(phoneResult);
    }

    return errors.length > 0 ? errors : true;
  },

  // Site settings validations
  validateSiteSettings: function (entry) {
    const errors = [];
    const data = entry.get("data");

    // Company information
    const company = data.get("company");
    if (company) {
      const companyFields = ["name", "tagline", "description"];
      companyFields.forEach((field) => {
        const result = this.validateRequired(
          company.get(field),
          `Company ${field}`
        );
        if (result !== true) errors.push(result);
      });
    }

    // Contact information
    const contact = data.get("contact");
    if (contact) {
      const contactFields = ["address", "phone", "email"];
      contactFields.forEach((field) => {
        const result = this.validateRequired(
          contact.get(field),
          `Contact ${field}`
        );
        if (result !== true) errors.push(result);
      });

      // Email validation
      const emailResult = this.validateEmail(contact.get("email"));
      if (emailResult !== true) errors.push(emailResult);

      // Phone validation
      const phoneResult = this.validatePhone(contact.get("phone"));
      if (phoneResult !== true) errors.push(phoneResult);
    }

    return errors.length > 0 ? errors : true;
  },
};

// Error display utilities
window.CMS_ERROR_HANDLER = {
  // Show validation errors in the CMS interface
  showValidationErrors: function (errors, collectionName) {
    const errorContainer = document.createElement("div");
    errorContainer.className = "cms-validation-errors";
    errorContainer.innerHTML = `
      <div class="error-header">
        <h3>⚠️ Validation Errors in ${collectionName}</h3>
        <p>Please fix the following issues before saving:</p>
      </div>
      <ul class="error-list">
        ${errors.map((error) => `<li>${error}</li>`).join("")}
      </ul>
    `;

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .cms-validation-errors {
        background: #fee;
        border: 1px solid #fcc;
        border-radius: 4px;
        padding: 16px;
        margin: 16px 0;
        color: #c33;
      }
      .cms-validation-errors .error-header h3 {
        margin: 0 0 8px 0;
        color: #c33;
      }
      .cms-validation-errors .error-header p {
        margin: 0 0 12px 0;
        color: #666;
      }
      .cms-validation-errors .error-list {
        margin: 0;
        padding-left: 20px;
      }
      .cms-validation-errors .error-list li {
        margin: 4px 0;
      }
    `;
    document.head.appendChild(style);

    // Insert error container at the top of the editor
    const editor = document.querySelector(".nc-entryEditor-editor");
    if (editor) {
      // Remove existing error containers
      const existingErrors = editor.querySelectorAll(".cms-validation-errors");
      existingErrors.forEach((el) => el.remove());

      // Add new error container
      editor.insertBefore(errorContainer, editor.firstChild);

      // Scroll to top to show errors
      errorContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  },

  // Clear validation errors
  clearValidationErrors: function () {
    const existingErrors = document.querySelectorAll(".cms-validation-errors");
    existingErrors.forEach((el) => el.remove());
  },

  // Log validation errors for debugging
  logValidationError: function (error, context) {
    console.error("CMS Validation Error:", {
      error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Send to error tracking service if available
    if (window.gtag) {
      window.gtag("event", "cms_validation_error", {
        error_message: error.toString(),
        error_context: context,
        custom_map: {
          custom_parameter_1: "cms_validation",
        },
      });
    }
  },
};

// Auto-save functionality with error handling
window.CMS_AUTO_SAVE = {
  saveTimeout: null,
  saveInterval: 30000, // 30 seconds

  // Initialize auto-save
  init: function () {
    // Listen for content changes
    document.addEventListener("input", this.handleContentChange.bind(this));
    document.addEventListener("change", this.handleContentChange.bind(this));
  },

  // Handle content changes
  handleContentChange: function (event) {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new timeout for auto-save
    this.saveTimeout = setTimeout(() => {
      this.performAutoSave();
    }, this.saveInterval);
  },

  // Perform auto-save
  performAutoSave: function () {
    try {
      // Get current entry data
      const entry = window.CMS?.getEntry?.();
      if (!entry) return;

      // Validate before saving
      const collection = entry.get("collection");
      const validationResult = this.validateEntry(entry, collection);

      if (validationResult === true) {
        // Save to localStorage as backup
        const entryData = {
          collection: collection,
          slug: entry.get("slug"),
          data: entry.get("data").toJS(),
          timestamp: new Date().toISOString(),
        };

        localStorage.setItem("cms_auto_save_backup", JSON.stringify(entryData));
        console.log("Auto-save backup created");
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      window.CMS_ERROR_HANDLER.logValidationError(error, "auto_save");
    }
  },

  // Validate entry before auto-save
  validateEntry: function (entry, collection) {
    switch (collection) {
      case "projects":
        return window.CMS_VALIDATION.validateProject(entry);
      case "blog":
        return window.CMS_VALIDATION.validateBlog(entry);
      case "services":
        return window.CMS_VALIDATION.validateService(entry);
      case "team":
        return window.CMS_VALIDATION.validateTeam(entry);
      case "settings":
        return window.CMS_VALIDATION.validateSiteSettings(entry);
      default:
        return true;
    }
  },

  // Restore from auto-save backup
  restoreBackup: function () {
    try {
      const backup = localStorage.getItem("cms_auto_save_backup");
      if (backup) {
        const backupData = JSON.parse(backup);
        console.log("Auto-save backup available:", backupData);
        return backupData;
      }
    } catch (error) {
      console.error("Failed to restore auto-save backup:", error);
    }
    return null;
  },
};

// Initialize when CMS is ready
document.addEventListener("DOMContentLoaded", function () {
  // Wait for CMS to be available
  const checkCMS = setInterval(() => {
    if (window.CMS) {
      clearInterval(checkCMS);

      // Initialize auto-save
      window.CMS_AUTO_SAVE.init();

      // Register validation hooks
      window.CMS.registerEventListener({
        name: "preSave",
        handler: function (data) {
          const { entry, collection } = data;
          let validationResult = true;

          // Perform collection-specific validation
          switch (collection.get("name")) {
            case "projects":
              validationResult = window.CMS_VALIDATION.validateProject(entry);
              break;
            case "blog":
              validationResult = window.CMS_VALIDATION.validateBlog(entry);
              break;
            case "services":
              validationResult = window.CMS_VALIDATION.validateService(entry);
              break;
            case "team":
              validationResult = window.CMS_VALIDATION.validateTeam(entry);
              break;
            case "settings":
              validationResult =
                window.CMS_VALIDATION.validateSiteSettings(entry);
              break;
          }

          // Handle validation results
          if (validationResult !== true) {
            window.CMS_ERROR_HANDLER.showValidationErrors(
              Array.isArray(validationResult)
                ? validationResult
                : [validationResult],
              collection.get("label")
            );
            return false; // Prevent save
          } else {
            window.CMS_ERROR_HANDLER.clearValidationErrors();
            return true; // Allow save
          }
        },
      });

      console.log("CMS validation system initialized");
    }
  }, 100);
});
