#!/usr/bin/env node

/**
 * Content Processing Build Script for Decap CMS
 *
 * This script processes Markdown files with YAML frontmatter from content collections
 * and generates JSON data files for consumption by the website's JavaScript.
 *
 * Features:
 * - Parse YAML frontmatter and Markdown content
 * - Generate structured JSON for each collection
 * - Image processing and optimization
 * - Error handling and validation
 * - Content validation and sanitization
 */

const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const matter = require("gray-matter");
const ContentValidator = require("./utils/content-validator");
const ServerValidator = require("./utils/server-validator");
const ImageProcessor = require("./utils/image-processor");
const MediaManager = require("./utils/media-manager");
const ContentSanitizer = require("./utils/content-sanitizer");
const SecurityHeaders = require("./utils/security-headers");
const ErrorLogger = require("./utils/error-logger");
const FallbackManager = require("./utils/fallback-manager");

// Configuration
const CONFIG = {
  contentDir: "content",
  outputDir: "assets/data",
  uploadsDir: "assets/uploads",
  collections: {
    projects: {
      pattern: "content/projects/*.md",
      output: "projects.json",
      requiredFields: ["title", "category", "status", "location"],
    },
    blog: {
      pattern: "content/blog/*.md",
      output: "blog.json",
      requiredFields: ["title", "date", "author", "published"],
    },
    services: {
      pattern: "content/services/*.md",
      output: "services.json",
      requiredFields: ["title", "category", "description"],
    },
    team: {
      pattern: "content/team/*.md",
      output: "team.json",
      requiredFields: ["name", "position"],
    },
    settings: {
      pattern: "content/settings/*.md",
      output: "site-settings.json",
      requiredFields: [],
    },
  },
  imageOptimization: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    formats: ["webp", "jpg"],
  },
};

class ContentProcessor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.processedFiles = 0;
    this.optimizedImages = 0;
    this.validator = new ContentValidator();
    this.serverValidator = new ServerValidator();
    this.errorLogger = ErrorLogger.instance;
    this.fallbackManager = new FallbackManager();
    this.imageProcessor = new ImageProcessor(CONFIG.imageOptimization);
    this.mediaManager = new MediaManager({
      mediaFolder: CONFIG.uploadsDir,
      maxFileSize: 10485760, // 10MB
      allowedExtensions: [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",
        "svg",
        "pdf",
        "doc",
        "docx",
      ],
    });
  }

  /**
   * Main processing function
   */
  async process() {
    console.log("🚀 Starting content processing...");

    try {
      // Initialize fallback system
      await this.fallbackManager.initialize();

      // Create backup before processing
      await this.fallbackManager.createBackup("pre-build");

      // Ensure output directory exists
      await fs.ensureDir(CONFIG.outputDir);
      await fs.ensureDir(CONFIG.uploadsDir);

      // Run comprehensive server-side validation first
      console.log("🔍 Running server-side validation...");
      const validationResult = await this.serverValidator.validateAllContent();

      if (!validationResult.success) {
        console.error("❌ Content validation failed!");

        if (this.serverValidator.shouldFailBuild()) {
          console.error("🚨 Attempting validation fallback...");

          try {
            const fallbackResult = await this.fallbackManager.executeFallback(
              "VALIDATION_FAILURE",
              {
                errors: validationResult.errors,
                warnings: validationResult.warnings,
              }
            );

            if (fallbackResult.success) {
              console.log(
                "✅ Validation fallback successful, continuing build"
              );
            } else {
              throw new Error("Validation fallback failed");
            }
          } catch (fallbackError) {
            console.error(
              "❌ Validation fallback failed:",
              fallbackError.message
            );
            process.exit(1);
          }
        } else {
          console.warn("⚠️  Continuing build with validation warnings");
        }
      } else {
        console.log("✅ Content validation passed");
      }

      // Initialize media management system
      console.log("📁 Initializing media management...");
      await this.mediaManager.initialize();

      // Process each collection
      for (const [collectionName, config] of Object.entries(
        CONFIG.collections
      )) {
        console.log(`\n📁 Processing ${collectionName} collection...`);
        await this.processCollection(collectionName, config);
      }

      // Generate summary report
      this.generateReport();

      // Log successful build
      await this.errorLogger.logInfo(
        "BUILD_SUCCESS",
        "Content processing completed successfully",
        {
          processedFiles: this.processedFiles,
          optimizedImages: this.optimizedImages,
          errors: this.errors.length,
          warnings: this.warnings.length,
        }
      );
    } catch (error) {
      // Log build error
      await this.errorLogger.logBuildError("CONTENT_PROCESSING", error, {
        processedFiles: this.processedFiles,
        errors: this.errors,
        warnings: this.warnings,
      });

      console.error("❌ Fatal error during content processing:", error);

      // Attempt build fallback
      try {
        console.log("🚨 Attempting build fallback...");

        const fallbackResult = await this.fallbackManager.executeFallback(
          "BUILD_FAILURE",
          {
            error: error.message,
            processedFiles: this.processedFiles,
            errors: this.errors,
            warnings: this.warnings,
          }
        );

        if (fallbackResult.success) {
          console.log("✅ Build fallback successful");
          await this.errorLogger.logInfo(
            "BUILD_FALLBACK_SUCCESS",
            "Build recovered using fallback",
            fallbackResult
          );
          return; // Exit successfully
        }
      } catch (fallbackError) {
        console.error("❌ Build fallback failed:", fallbackError.message);
        await this.errorLogger.logError("BUILD_FALLBACK_FAILED", fallbackError);
      }

      process.exit(1);
    }
  }

  /**
   * Process a single collection
   */
  async processCollection(collectionName, config) {
    try {
      const files = glob
        .sync(config.pattern)
        .filter((file) => !file.includes("README.md"));
      const items = [];

      if (files.length === 0) {
        this.warnings.push(`No files found for ${collectionName} collection`);
        return;
      }

      for (const filePath of files) {
        try {
          const item = await this.processFile(
            filePath,
            config.requiredFields,
            collectionName
          );
          if (item) {
            items.push(item);
            this.processedFiles++;
          }
        } catch (error) {
          this.errors.push(`Error processing ${filePath}: ${error.message}`);
        }
      }

      // Sort items based on collection-specific logic
      const sortedItems = this.sortCollection(collectionName, items);

      // Write JSON output
      const outputPath = path.join(CONFIG.outputDir, config.output);
      await fs.writeJson(outputPath, sortedItems, { spaces: 2 });

      console.log(`✅ Generated ${config.output} with ${items.length} items`);
    } catch (error) {
      this.errors.push(
        `Error processing ${collectionName} collection: ${error.message}`
      );
    }
  }

  /**
   * Process a single markdown file
   */
  async processFile(filePath, requiredFields = [], collectionName = "") {
    const fileContent = await fs.readFile(filePath, "utf8");

    // Validate file content for security issues
    const contentValidation = ContentSanitizer.validateFileContent(
      filePath,
      fileContent
    );
    if (contentValidation.warnings.length > 0) {
      console.warn(
        `Security warnings for ${filePath}:`,
        contentValidation.warnings
      );
      this.warnings.push(...contentValidation.warnings);
    }

    if (!contentValidation.valid) {
      console.warn(
        `Content security issues detected in ${filePath}, using sanitized version`
      );
    }

    // Use sanitized content
    const { data: frontmatter, content } = matter(contentValidation.sanitized);

    // Generate slug from filename
    const slug = path.basename(filePath, ".md");

    // Sanitize markdown content before processing
    const sanitizedContent = ContentSanitizer.sanitizeMarkdown(content);

    // Render markdown to HTML using ESM-only 'marked'
    const { marked } = await import("marked");
    const renderedHtml = marked.parse(sanitizedContent);

    // Create initial item
    const item = {
      slug,
      ...frontmatter,
      content: renderedHtml,
      excerpt: this.generateExcerpt(sanitizedContent, frontmatter.excerpt),
      wordCount: this.countWords(sanitizedContent),
      readingTime: this.calculateReadingTime(sanitizedContent),
      lastModified: (await fs.stat(filePath)).mtime.toISOString(),
      filePath: path.relative(process.cwd(), filePath),
    };

    // Validate item using ContentValidator
    if (collectionName) {
      const validation = this.validator.validateItem(
        collectionName,
        item,
        filePath
      );
      if (validation.errors.length > 0) {
        throw new Error(`Validation errors: ${validation.errors.join("; ")}`);
      }
      this.warnings.push(...validation.warnings);
    }

    // Process images in frontmatter
    await this.processImages(frontmatter);

    return this.sanitizeItem(item);
  }

  /**
   * Process and optimize images referenced in frontmatter
   */
  async processImages(frontmatter) {
    const imageFields = ["featuredImage", "photo", "images"];

    for (const field of imageFields) {
      if (frontmatter[field]) {
        if (typeof frontmatter[field] === "string") {
          frontmatter[field] = await this.imageProcessor.processImage(
            frontmatter[field]
          );
        } else if (typeof frontmatter[field] === "object") {
          frontmatter[field] = await this.processImageObject(
            frontmatter[field]
          );
        }
      }
    }
  }

  /**
   * Process image object (like gallery arrays or nested image objects)
   */
  async processImageObject(imageObj) {
    if (Array.isArray(imageObj)) {
      // Handle arrays of images
      return Promise.all(
        imageObj.map((img) => this.imageProcessor.processImage(img))
      );
    } else if (typeof imageObj === "object") {
      // Handle nested objects with image properties
      const processed = {};
      for (const [key, value] of Object.entries(imageObj)) {
        if (typeof value === "string" && this.isImagePath(value)) {
          processed[key] = await this.imageProcessor.processImage(value);
        } else if (Array.isArray(value)) {
          processed[key] = await Promise.all(
            value.map((img) => this.imageProcessor.processImage(img))
          );
        } else {
          processed[key] = value;
        }
      }
      return processed;
    }
    return imageObj;
  }

  /**
   * Check if a path is an image
   */
  isImagePath(path) {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    return imageExtensions.some((ext) => path.toLowerCase().endsWith(ext));
  }

  /**
   * Generate excerpt from content
   */
  generateExcerpt(content, existingExcerpt) {
    if (existingExcerpt) {
      return existingExcerpt;
    }

    // Remove markdown formatting and get first 160 characters
    const plainText = content
      .replace(/#{1,6}\s+/g, "") // Remove headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    return plainText.length > 160
      ? plainText.substring(0, 160) + "..."
      : plainText;
  }

  /**
   * Count words in content
   */
  countWords(content) {
    return content.trim().split(/\s+/).length;
  }

  /**
   * Calculate reading time (assuming 200 words per minute)
   */
  calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const wordCount = this.countWords(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Sort collection items based on collection-specific logic
   */
  sortCollection(collectionName, items) {
    switch (collectionName) {
      case "blog":
        return items.sort((a, b) => new Date(b.date) - new Date(a.date));

      case "projects":
        return items.sort((a, b) => {
          // Featured items first, then by completion date
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (
            new Date(b.completionDate || 0) - new Date(a.completionDate || 0)
          );
        });

      case "services":
        return items.sort((a, b) => (a.order || 999) - (b.order || 999));

      case "team":
        return items.sort((a, b) => (a.order || 999) - (b.order || 999));

      default:
        return items;
    }
  }

  /**
   * Sanitize item data with comprehensive security measures
   */
  sanitizeItem(item) {
    // Remove any potentially dangerous content
    const sanitized = { ...item };

    // Apply comprehensive content sanitization
    const sanitizationResult = ContentSanitizer.sanitizeContent({
      frontmatter: sanitized,
      body: sanitized.content || "",
      html: sanitized.content || "",
    });

    // Update sanitized content
    if (sanitizationResult.frontmatter) {
      Object.assign(sanitized, sanitizationResult.frontmatter);
    }

    if (sanitizationResult.body) {
      sanitized.content = sanitizationResult.body;
    }

    // Sanitize specific string fields
    const stringFields = [
      "title",
      "description",
      "excerpt",
      "bio",
      "tagline",
      "name",
      "position",
    ];
    stringFields.forEach((field) => {
      if (sanitized[field] && typeof sanitized[field] === "string") {
        sanitized[field] = ContentSanitizer.sanitizeHTML(sanitized[field]);
      }
    });

    // Sanitize array fields that might contain strings
    const arrayFields = [
      "tags",
      "features",
      "materials",
      "specializations",
      "certifications",
    ];
    arrayFields.forEach((field) => {
      if (Array.isArray(sanitized[field])) {
        sanitized[field] = sanitized[field].map((item) =>
          typeof item === "string" ? ContentSanitizer.sanitizeHTML(item) : item
        );
      }
    });

    // Validate and sanitize URLs
    const urlFields = [
      "featuredImage",
      "photo",
      "linkedin",
      "twitter",
      "facebook",
      "instagram",
    ];
    urlFields.forEach((field) => {
      if (sanitized[field] && typeof sanitized[field] === "string") {
        const validatedUrl = ContentSanitizer.validateURL(sanitized[field]);
        if (validatedUrl) {
          sanitized[field] = validatedUrl;
        } else {
          console.warn(
            `Invalid URL removed from ${field}: ${sanitized[field]}`
          );
          delete sanitized[field];
        }
      }
    });

    // Sanitize nested objects (like images, contact, social links)
    if (sanitized.images && typeof sanitized.images === "object") {
      sanitized.images = ContentSanitizer.sanitizeFrontmatter(sanitized.images);
    }

    if (sanitized.contact && typeof sanitized.contact === "object") {
      sanitized.contact = ContentSanitizer.sanitizeFrontmatter(
        sanitized.contact
      );
    }

    if (sanitized.socialLinks && typeof sanitized.socialLinks === "object") {
      sanitized.socialLinks = ContentSanitizer.sanitizeFrontmatter(
        sanitized.socialLinks
      );
    }

    if (
      sanitized.specifications &&
      typeof sanitized.specifications === "object"
    ) {
      sanitized.specifications = ContentSanitizer.sanitizeFrontmatter(
        sanitized.specifications
      );
    }

    // Ensure dates are properly formatted
    if (sanitized.date) {
      try {
        sanitized.date = new Date(sanitized.date).toISOString();
      } catch (error) {
        console.warn(`Invalid date format: ${sanitized.date}`);
        delete sanitized.date;
      }
    }

    if (sanitized.completionDate) {
      try {
        sanitized.completionDate = new Date(
          sanitized.completionDate
        ).toISOString();
      } catch (error) {
        console.warn(
          `Invalid completion date format: ${sanitized.completionDate}`
        );
        delete sanitized.completionDate;
      }
    }

    if (sanitized.joinDate) {
      try {
        sanitized.joinDate = new Date(sanitized.joinDate).toISOString();
      } catch (error) {
        console.warn(`Invalid join date format: ${sanitized.joinDate}`);
        delete sanitized.joinDate;
      }
    }

    // Ensure boolean fields are properly typed
    const booleanFields = ["published", "featured", "active", "available"];
    booleanFields.forEach((field) => {
      if (sanitized[field] !== undefined) {
        sanitized[field] = Boolean(sanitized[field]);
      }
    });

    // Ensure numeric fields are properly typed
    const numericFields = [
      "order",
      "rating",
      "experience",
      "bedrooms",
      "bathrooms",
      "floors",
    ];
    numericFields.forEach((field) => {
      if (sanitized[field] !== undefined && sanitized[field] !== null) {
        const num = Number(sanitized[field]);
        if (!isNaN(num)) {
          sanitized[field] = num;
        } else {
          console.warn(
            `Invalid numeric value for ${field}: ${sanitized[field]}`
          );
          delete sanitized[field];
        }
      }
    });

    // Remove any null or undefined values
    Object.keys(sanitized).forEach((key) => {
      if (sanitized[key] === null || sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });

    return sanitized;
  }

  /**
   * Generate processing report
   */
  generateReport() {
    const imageStats = this.imageProcessor.getStats();

    console.log("\n📊 Content Processing Report");
    console.log("================================");
    console.log(`✅ Files processed: ${this.processedFiles}`);
    console.log(`🖼️  Images optimized: ${imageStats.processedCount}`);
    console.log(
      `⚠️  Warnings: ${this.warnings.length + imageStats.errors.length}`
    );
    console.log(`❌ Errors: ${this.errors.length}`);

    // Combine warnings from processor and image processor
    const allWarnings = [...this.warnings, ...imageStats.errors];

    if (allWarnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      allWarnings.forEach((warning) => console.log(`   - ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log("\n❌ Errors:");
      this.errors.forEach((error) => console.log(`   - ${error}`));
    }

    if (this.errors.length > 0) {
      console.log("\n❌ Build completed with errors");
      process.exit(1);
    } else {
      console.log("\n✅ Content processing completed successfully!");
    }
  }
}

// Run the processor if called directly
if (require.main === module) {
  const processor = new ContentProcessor();
  processor.process().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
}

module.exports = ContentProcessor;
