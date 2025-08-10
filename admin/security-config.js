/**
 * Security Configuration for Decap CMS
 * Manages user access control, permissions, and security policies
 */

// User roles and permissions configuration
const USER_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  CONTRIBUTOR: "contributor",
};

const PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    collections: ["projects", "blog", "services", "team", "settings"],
    actions: ["create", "read", "update", "delete", "publish"],
    media: ["upload", "delete", "organize"],
    settings: ["modify", "backup", "restore"],
  },
  [USER_ROLES.EDITOR]: {
    collections: ["projects", "blog", "services", "team"],
    actions: ["create", "read", "update", "publish"],
    media: ["upload", "organize"],
    settings: [],
  },
  [USER_ROLES.CONTRIBUTOR]: {
    collections: ["blog", "projects"],
    actions: ["create", "read", "update"],
    media: ["upload"],
    settings: [],
  },
};

// Authorized users configuration
// In production, this should be managed through GitHub repository collaborators
const AUTHORIZED_USERS = {
  // GitHub usernames and their assigned roles
  "john-mwalimu": USER_ROLES.ADMIN,
  "sarah-hassan": USER_ROLES.EDITOR,
  "michael-kimani": USER_ROLES.EDITOR,
  "grace-mwangi": USER_ROLES.CONTRIBUTOR,
  "david-ochieng": USER_ROLES.CONTRIBUTOR,
};

// Security policies
const SECURITY_POLICIES = {
  // Session management
  session: {
    timeout: 3600000, // 1 hour
    refreshThreshold: 300000, // 5 minutes
    maxConcurrentSessions: 3,
  },

  // Content validation
  content: {
    maxFileSize: 10485760, // 10MB
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    allowedDocumentTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxImageDimensions: { width: 4000, height: 4000 },
    minImageDimensions: { width: 100, height: 100 },
  },

  // Rate limiting
  rateLimit: {
    maxRequestsPerMinute: 60,
    maxUploadsPerHour: 50,
    maxContentUpdatesPerHour: 100,
  },

  // Content sanitization
  sanitization: {
    allowedHtmlTags: [
      "p",
      "br",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "a",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "title", "target"],
      img: ["src", "alt", "title", "width", "height"],
    },
    stripScriptTags: true,
    stripStyleTags: true,
  },
};

/**
 * Check if user has permission for a specific action
 * @param {string} username - GitHub username
 * @param {string} collection - Collection name
 * @param {string} action - Action to perform
 * @returns {boolean} - Whether user has permission
 */
function hasPermission(username, collection, action) {
  const userRole = AUTHORIZED_USERS[username];
  if (!userRole) {
    console.warn(`Unauthorized user attempted access: ${username}`);
    return false;
  }

  const permissions = PERMISSIONS[userRole];
  if (!permissions) {
    console.warn(`Invalid role for user ${username}: ${userRole}`);
    return false;
  }

  // Check collection access
  if (!permissions.collections.includes(collection)) {
    console.warn(`User ${username} denied access to collection: ${collection}`);
    return false;
  }

  // Check action permission
  if (!permissions.actions.includes(action)) {
    console.warn(`User ${username} denied permission for action: ${action}`);
    return false;
  }

  return true;
}

/**
 * Validate file upload based on security policies
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
function validateFileUpload(file) {
  const result = { valid: true, errors: [] };

  // Check file size
  if (file.size > SECURITY_POLICIES.content.maxFileSize) {
    result.valid = false;
    result.errors.push(
      `File size exceeds maximum allowed size of ${
        SECURITY_POLICIES.content.maxFileSize / 1024 / 1024
      }MB`
    );
  }

  // Check file type
  const isImage = file.type.startsWith("image/");
  const isDocument = file.type.startsWith("application/");

  if (
    isImage &&
    !SECURITY_POLICIES.content.allowedImageTypes.includes(file.type)
  ) {
    result.valid = false;
    result.errors.push(`Image type ${file.type} is not allowed`);
  }

  if (
    isDocument &&
    !SECURITY_POLICIES.content.allowedDocumentTypes.includes(file.type)
  ) {
    result.valid = false;
    result.errors.push(`Document type ${file.type} is not allowed`);
  }

  if (!isImage && !isDocument) {
    result.valid = false;
    result.errors.push(`File type ${file.type} is not supported`);
  }

  return result;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} content - HTML content to sanitize
 * @returns {string} - Sanitized content
 */
function sanitizeContent(content) {
  if (!content || typeof content !== "string") {
    return content;
  }

  // Remove script tags
  if (SECURITY_POLICIES.sanitization.stripScriptTags) {
    content = content.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  }

  // Remove style tags
  if (SECURITY_POLICIES.sanitization.stripStyleTags) {
    content = content.replace(
      /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
      ""
    );
  }

  // Remove javascript: URLs
  content = content.replace(/javascript:/gi, "");

  // Remove on* event handlers
  content = content.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Basic XSS prevention patterns
  const xssPatterns = [
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<form[^>]*>/gi,
    /<input[^>]*>/gi,
    /<textarea[^>]*>/gi,
    /<select[^>]*>/gi,
  ];

  xssPatterns.forEach((pattern) => {
    content = content.replace(pattern, "");
  });

  return content;
}

/**
 * Log security events for monitoring
 * @param {string} event - Event type
 * @param {Object} details - Event details
 */
function logSecurityEvent(event, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: event,
    details: details,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // In production, send to server-side logging system
  console.log("Security Event:", logEntry);

  // Store locally for debugging (remove in production)
  const securityLog = JSON.parse(
    localStorage.getItem("cms_security_log") || "[]"
  );
  securityLog.push(logEntry);

  // Keep only last 50 events
  if (securityLog.length > 50) {
    securityLog.shift();
  }

  localStorage.setItem("cms_security_log", JSON.stringify(securityLog));
}

/**
 * Initialize security monitoring
 */
function initializeSecurity() {
  // Monitor for suspicious activity
  let requestCount = 0;
  const requestWindow = 60000; // 1 minute

  setInterval(() => {
    requestCount = 0;
  }, requestWindow);

  // Override fetch to monitor API requests
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    requestCount++;

    if (requestCount > SECURITY_POLICIES.rateLimit.maxRequestsPerMinute) {
      logSecurityEvent("RATE_LIMIT_EXCEEDED", {
        requestCount: requestCount,
        timeWindow: requestWindow,
      });

      return Promise.reject(
        new Error("Rate limit exceeded. Please slow down your requests.")
      );
    }

    return originalFetch.apply(this, args);
  };

  // Monitor for content changes
  document.addEventListener("input", (event) => {
    if (
      event.target.tagName === "TEXTAREA" ||
      event.target.tagName === "INPUT"
    ) {
      const content = event.target.value;
      const sanitized = sanitizeContent(content);

      if (content !== sanitized) {
        logSecurityEvent("CONTENT_SANITIZED", {
          original: content.substring(0, 100) + "...",
          sanitized: sanitized.substring(0, 100) + "...",
        });

        event.target.value = sanitized;
      }
    }
  });

  console.log("Security monitoring initialized");
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    USER_ROLES,
    PERMISSIONS,
    AUTHORIZED_USERS,
    SECURITY_POLICIES,
    hasPermission,
    validateFileUpload,
    sanitizeContent,
    logSecurityEvent,
    initializeSecurity,
  };
}

// Initialize security when script loads
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", initializeSecurity);
}
