/**
 * Content Sanitization Utilities
 * Provides comprehensive content sanitization for Markdown and HTML content
 * to prevent XSS attacks and ensure content security
 */

const fs = require("fs");
const path = require("path");

// HTML sanitization configuration
const ALLOWED_HTML_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "strike",
  "del",
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
  "pre",
  "code",
  "a",
  "img",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "span",
];

const ALLOWED_ATTRIBUTES = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "class"],
  blockquote: ["cite"],
  pre: ["class"],
  code: ["class"],
  div: ["class"],
  span: ["class"],
  table: ["class"],
  th: ["scope", "class"],
  td: ["class"],
};

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
  // Script tags and javascript
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,

  // Event handlers
  /\s*on\w+\s*=\s*["'][^"']*["']/gi,
  /\s*on\w+\s*=\s*[^"'\s>]+/gi,

  // Style tags and expressions
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /expression\s*\(/gi,
  /-moz-binding/gi,

  // Dangerous tags
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<applet[^>]*>/gi,
  /<form[^>]*>/gi,
  /<input[^>]*>/gi,
  /<textarea[^>]*>/gi,
  /<select[^>]*>/gi,
  /<button[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /<base[^>]*>/gi,

  // Data URLs (except safe image formats)
  /data:(?!image\/(png|jpeg|jpg|gif|webp|svg\+xml))[^"'\s>]*/gi,
];

// URL validation patterns
const SAFE_URL_PATTERNS = [
  /^https?:\/\//i,
  /^\/[^\/]/,
  /^#/,
  /^mailto:/i,
  /^tel:/i,
];

/**
 * Sanitize HTML content by removing dangerous elements and attributes
 * @param {string} content - HTML content to sanitize
 * @returns {string} - Sanitized HTML content
 */
function sanitizeHTML(content) {
  if (!content || typeof content !== "string") {
    return content;
  }

  let sanitized = content;

  // Remove dangerous patterns
  DANGEROUS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  // Sanitize URLs in href and src attributes
  sanitized = sanitizeURLs(sanitized);

  // Remove disallowed HTML tags
  sanitized = removeDisallowedTags(sanitized);

  // Remove disallowed attributes
  sanitized = removeDisallowedAttributes(sanitized);

  return sanitized;
}

/**
 * Sanitize URLs in HTML attributes
 * @param {string} content - HTML content
 * @returns {string} - Content with sanitized URLs
 */
function sanitizeURLs(content) {
  // Sanitize href attributes
  content = content.replace(/href\s*=\s*["']([^"']*)["']/gi, (match, url) => {
    const sanitizedUrl = validateURL(url);
    return sanitizedUrl ? `href="${sanitizedUrl}"` : "";
  });

  // Sanitize src attributes
  content = content.replace(/src\s*=\s*["']([^"']*)["']/gi, (match, url) => {
    const sanitizedUrl = validateURL(url);
    return sanitizedUrl ? `src="${sanitizedUrl}"` : "";
  });

  return content;
}

/**
 * Validate and sanitize URLs
 * @param {string} url - URL to validate
 * @returns {string|null} - Sanitized URL or null if invalid
 */
function validateURL(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  // Trim whitespace
  url = url.trim();

  // Check against safe URL patterns
  const isSafe = SAFE_URL_PATTERNS.some((pattern) => pattern.test(url));

  if (!isSafe) {
    console.warn(`Potentially unsafe URL removed: ${url}`);
    return null;
  }

  // Additional checks for specific protocols
  if (
    url.startsWith("javascript:") ||
    url.startsWith("vbscript:") ||
    url.startsWith("data:")
  ) {
    console.warn(`Dangerous URL protocol removed: ${url}`);
    return null;
  }

  return url;
}

/**
 * Remove HTML tags that are not in the allowed list
 * @param {string} content - HTML content
 * @returns {string} - Content with disallowed tags removed
 */
function removeDisallowedTags(content) {
  // Create regex pattern for allowed tags
  const allowedTagsPattern = ALLOWED_HTML_TAGS.join("|");
  const tagRegex = /<\/?(?!(?:\/?)(?:${allowedTagsPattern})\b)[^>]+>/gi;

  return content.replace(tagRegex, "");
}

/**
 * Remove HTML attributes that are not in the allowed list
 * @param {string} content - HTML content
 * @returns {string} - Content with disallowed attributes removed
 */
function removeDisallowedAttributes(content) {
  // Process each allowed tag type
  Object.keys(ALLOWED_ATTRIBUTES).forEach((tag) => {
    const allowedAttrs = ALLOWED_ATTRIBUTES[tag];
    const tagRegex = new RegExp(`<${tag}\\b([^>]*)>`, "gi");

    content = content.replace(tagRegex, (match, attributes) => {
      const sanitizedAttrs = sanitizeAttributes(attributes, allowedAttrs);
      return `<${tag}${sanitizedAttrs}>`;
    });
  });

  return content;
}

/**
 * Sanitize HTML attributes for a specific tag
 * @param {string} attributes - Attribute string
 * @param {Array} allowedAttrs - Array of allowed attribute names
 * @returns {string} - Sanitized attributes string
 */
function sanitizeAttributes(attributes, allowedAttrs) {
  if (!attributes) return "";

  const attrRegex = /(\w+)\s*=\s*["']([^"']*)["']/g;
  const sanitizedAttrs = [];
  let match;

  while ((match = attrRegex.exec(attributes)) !== null) {
    const [, attrName, attrValue] = match;

    if (allowedAttrs.includes(attrName.toLowerCase())) {
      // Additional validation for specific attributes
      let sanitizedValue = attrValue;

      if (
        attrName.toLowerCase() === "href" ||
        attrName.toLowerCase() === "src"
      ) {
        sanitizedValue = validateURL(attrValue);
        if (!sanitizedValue) continue;
      }

      sanitizedAttrs.push(`${attrName}="${sanitizedValue}"`);
    }
  }

  return sanitizedAttrs.length > 0 ? " " + sanitizedAttrs.join(" ") : "";
}

/**
 * Sanitize Markdown content before processing
 * @param {string} markdown - Markdown content
 * @returns {string} - Sanitized Markdown content
 */
function sanitizeMarkdown(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return markdown;
  }

  let sanitized = markdown;

  // Remove HTML script tags that might be embedded in Markdown
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Sanitize HTML blocks in Markdown
  sanitized = sanitized.replace(
    /```html\s*([\s\S]*?)\s*```/gi,
    (match, htmlContent) => {
      const sanitizedHTML = sanitizeHTML(htmlContent);
      return "```html\n" + sanitizedHTML + "\n```";
    }
  );

  // Sanitize inline HTML in Markdown
  sanitized = sanitized.replace(/<[^>]+>/g, (match) => {
    return sanitizeHTML(match);
  });

  // Validate and sanitize URLs in Markdown links
  sanitized = sanitized.replace(
    /\[([^\]]*)\]\(([^)]*)\)/g,
    (match, text, url) => {
      const sanitizedUrl = validateURL(url);
      return sanitizedUrl ? `[${text}](${sanitizedUrl})` : text;
    }
  );

  // Validate and sanitize URLs in Markdown images
  sanitized = sanitized.replace(
    /!\[([^\]]*)\]\(([^)]*)\)/g,
    (match, alt, url) => {
      const sanitizedUrl = validateURL(url);
      return sanitizedUrl ? `![${alt}](${sanitizedUrl})` : `[Image: ${alt}]`;
    }
  );

  return sanitized;
}

/**
 * Sanitize YAML frontmatter content
 * @param {Object} frontmatter - Parsed YAML frontmatter object
 * @returns {Object} - Sanitized frontmatter object
 */
function sanitizeFrontmatter(frontmatter) {
  if (!frontmatter || typeof frontmatter !== "object") {
    return frontmatter;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(frontmatter)) {
    if (typeof value === "string") {
      // Sanitize string values
      sanitized[key] = sanitizeHTML(value);
    } else if (Array.isArray(value)) {
      // Sanitize array values
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeHTML(item) : item
      );
    } else if (typeof value === "object" && value !== null) {
      // Recursively sanitize object values
      sanitized[key] = sanitizeFrontmatter(value);
    } else {
      // Keep other types as-is (numbers, booleans, etc.)
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Comprehensive content sanitization for CMS content
 * @param {Object} content - Content object with frontmatter and body
 * @returns {Object} - Sanitized content object
 */
function sanitizeContent(content) {
  if (!content || typeof content !== "object") {
    return content;
  }

  const sanitized = { ...content };

  // Sanitize frontmatter
  if (sanitized.frontmatter) {
    sanitized.frontmatter = sanitizeFrontmatter(sanitized.frontmatter);
  }

  // Sanitize markdown body
  if (sanitized.body) {
    sanitized.body = sanitizeMarkdown(sanitized.body);
  }

  // Sanitize any HTML content
  if (sanitized.html) {
    sanitized.html = sanitizeHTML(sanitized.html);
  }

  return sanitized;
}

/**
 * Validate file content for security issues
 * @param {string} filePath - Path to the file
 * @param {string} content - File content
 * @returns {Object} - Validation result
 */
function validateFileContent(filePath, content) {
  const result = {
    valid: true,
    warnings: [],
    errors: [],
    sanitized: content,
  };

  // Check for potentially dangerous content
  const dangerousPatterns = [
    { pattern: /<script/gi, message: "Script tags detected" },
    { pattern: /javascript:/gi, message: "JavaScript URLs detected" },
    { pattern: /on\w+\s*=/gi, message: "Event handlers detected" },
    { pattern: /<iframe/gi, message: "Iframe tags detected" },
    { pattern: /data:text\/html/gi, message: "Data URLs with HTML detected" },
  ];

  dangerousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      result.warnings.push(`${message} in ${filePath}`);
    }
  });

  // Sanitize the content
  try {
    if (filePath.endsWith(".md")) {
      result.sanitized = sanitizeMarkdown(content);
    } else if (filePath.endsWith(".html")) {
      result.sanitized = sanitizeHTML(content);
    }

    // Check if content was modified during sanitization
    if (result.sanitized !== content) {
      result.warnings.push(`Content was sanitized in ${filePath}`);
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`Sanitization failed for ${filePath}: ${error.message}`);
  }

  return result;
}

module.exports = {
  sanitizeHTML,
  sanitizeMarkdown,
  sanitizeFrontmatter,
  sanitizeContent,
  validateFileContent,
  validateURL,
  ALLOWED_HTML_TAGS,
  ALLOWED_ATTRIBUTES,
};
