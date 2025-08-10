/**
 * Security Headers Configuration
 * Provides security headers and XSS protection for the website
 */

/**
 * Generate security headers for HTML pages
 * @returns {Object} - Security headers configuration
 */
function getSecurityHeaders() {
  return {
    // Content Security Policy - Prevents XSS attacks
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://api.github.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' https://api.github.com https://github.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // XSS Protection (legacy browsers)
    "X-XSS-Protection": "1; mode=block",

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Strict Transport Security (HTTPS only)
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

    // Permissions Policy (formerly Feature Policy)
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),
  };
}

/**
 * Generate Content Security Policy for admin interface
 * @returns {string} - CSP header value for admin
 */
function getAdminCSP() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://unpkg.com https://api.github.com",
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.github.com https://github.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://github.com",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Inject security headers into HTML content
 * @param {string} htmlContent - HTML content
 * @param {boolean} isAdmin - Whether this is admin interface
 * @returns {string} - HTML with security headers injected
 */
function injectSecurityHeaders(htmlContent, isAdmin = false) {
  if (!htmlContent || typeof htmlContent !== "string") {
    return htmlContent;
  }

  const headers = getSecurityHeaders();
  const csp = isAdmin ? getAdminCSP() : headers["Content-Security-Policy"];

  // Create meta tags for security headers
  const securityMetas = [
    `<meta http-equiv="Content-Security-Policy" content="${csp}" />`,
    `<meta http-equiv="X-Content-Type-Options" content="${headers["X-Content-Type-Options"]}" />`,
    `<meta http-equiv="X-Frame-Options" content="${headers["X-Frame-Options"]}" />`,
    `<meta http-equiv="X-XSS-Protection" content="${headers["X-XSS-Protection"]}" />`,
    `<meta http-equiv="Referrer-Policy" content="${headers["Referrer-Policy"]}" />`,
    `<meta http-equiv="Permissions-Policy" content="${headers["Permissions-Policy"]}" />`,
  ].join("\n    ");

  // Inject security headers into head section
  if (htmlContent.includes("<head>")) {
    return htmlContent.replace("<head>", `<head>\n    ${securityMetas}`);
  } else if (htmlContent.includes("</title>")) {
    return htmlContent.replace("</title>", `</title>\n    ${securityMetas}`);
  } else {
    // If no head section found, add at the beginning
    return `<!DOCTYPE html>\n<html>\n<head>\n    ${securityMetas}\n</head>\n<body>\n${htmlContent}\n</body>\n</html>`;
  }
}

/**
 * Generate .htaccess rules for Apache servers
 * @returns {string} - .htaccess content with security headers
 */
function generateHtaccessRules() {
  const headers = getSecurityHeaders();

  let htaccess = `# Security Headers Configuration
# Generated automatically - do not edit manually

<IfModule mod_headers.c>
`;

  Object.entries(headers).forEach(([header, value]) => {
    htaccess += `    Header always set "${header}" "${value}"\n`;
  });

  htaccess += `</IfModule>

# Prevent access to sensitive files
<FilesMatch "\\.(yml|yaml|json|md|log|bak|backup|old|tmp|temp)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Prevent access to admin config files
<Files "config.yml">
    Order allow,deny
    Deny from all
</Files>

# Prevent access to content directory
<Directory "content">
    Order allow,deny
    Deny from all
</Directory>

# Prevent access to scripts directory
<Directory "scripts">
    Order allow,deny
    Deny from all
</Directory>

# Enable GZIP compression for better performance
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
</IfModule>
`;

  return htaccess;
}

/**
 * Generate nginx configuration for security headers
 * @returns {string} - nginx configuration content
 */
function generateNginxConfig() {
  const headers = getSecurityHeaders();

  let nginxConfig = `# Security Headers Configuration for nginx
# Add this to your server block

# Security Headers
`;

  Object.entries(headers).forEach(([header, value]) => {
    nginxConfig += `add_header ${header} "${value}" always;\n`;
  });

  nginxConfig += `
# Prevent access to sensitive files
location ~* \\.(yml|yaml|json|md|log|bak|backup|old|tmp|temp)$ {
    deny all;
    return 404;
}

# Prevent access to admin config
location = /admin/config.yml {
    deny all;
    return 404;
}

# Prevent access to content directory
location /content/ {
    deny all;
    return 404;
}

# Prevent access to scripts directory
location /scripts/ {
    deny all;
    return 404;
}

# Enable GZIP compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json;

# Cache static assets
location ~* \\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
`;

  return nginxConfig;
}

/**
 * Validate and sanitize HTML content for XSS prevention
 * @param {string} content - HTML content to validate
 * @returns {Object} - Validation result with sanitized content
 */
function validateAndSanitizeHTML(content) {
  const result = {
    valid: true,
    warnings: [],
    sanitized: content,
  };

  // Check for potential XSS patterns
  const xssPatterns = [
    {
      pattern: /<script[^>]*>.*?<\/script>/gi,
      message: "Script tags detected",
    },
    { pattern: /javascript:/gi, message: "JavaScript URLs detected" },
    { pattern: /on\w+\s*=/gi, message: "Event handlers detected" },
    { pattern: /data:text\/html/gi, message: "Data URLs with HTML detected" },
    { pattern: /<iframe[^>]*>/gi, message: "Iframe tags detected" },
    { pattern: /<object[^>]*>/gi, message: "Object tags detected" },
    { pattern: /<embed[^>]*>/gi, message: "Embed tags detected" },
  ];

  xssPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      result.warnings.push(message);
      result.valid = false;
    }
  });

  // Basic sanitization
  if (!result.valid) {
    let sanitized = content;

    // Remove dangerous patterns
    xssPatterns.forEach(({ pattern }) => {
      sanitized = sanitized.replace(pattern, "");
    });

    result.sanitized = sanitized;
  }

  return result;
}

module.exports = {
  getSecurityHeaders,
  getAdminCSP,
  injectSecurityHeaders,
  generateHtaccessRules,
  generateNginxConfig,
  validateAndSanitizeHTML,
};
