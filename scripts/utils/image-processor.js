/**
 * Image Processing Utilities
 *
 * Handles image optimization, resizing, and format conversion
 */

const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

class ImageProcessor {
  constructor(options = {}) {
    this.config = {
      maxWidth: options.maxWidth || 1920,
      maxHeight: options.maxHeight || 1080,
      quality: options.quality || 85,
      formats: options.formats || ["webp", "jpg"],
      thumbnailSizes: options.thumbnailSizes || [
        { width: 300, height: 200, suffix: "-thumb" },
        { width: 600, height: 400, suffix: "-medium" },
        { width: 1200, height: 800, suffix: "-large" },
      ],
      // Performance optimization settings
      progressive: true,
      mozjpeg: true,
      effort: 6, // WebP compression effort (0-6, higher = better compression)
      smartSubsample: true,
      trellisQuantisation: true,
      overshootDeringing: true,
      optimizeScans: true,
    };

    this.processedImages = new Set();
    this.errors = [];
    this.performanceMetrics = {
      totalProcessed: 0,
      totalTimeSaved: 0,
      totalSizeSaved: 0,
      averageProcessingTime: 0,
    };
  }

  /**
   * Initialize image processor with performance monitoring
   */
  async init() {
    // Configure Sharp for optimal performance
    sharp.cache({ memory: 50, files: 20, items: 100 });
    sharp.concurrency(2); // Limit concurrent operations

    console.log("Image processor initialized with performance optimizations");
  }

  /**
   * Process and optimize an image with performance tracking
   */
  async processImage(imagePath, options = {}) {
    const startTime = Date.now();

    try {
      const fullPath = path.resolve(imagePath.replace(/^\//, ""));

      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      // Skip if already processed
      if (this.processedImages.has(fullPath)) {
        return this.getOptimizedPath(imagePath);
      }

      const originalStats = await fs.stat(fullPath);
      const originalSize = originalStats.size;

      const imageInfo = await this.getImageInfo(fullPath);
      const optimizedPaths = await this.optimizeImage(
        fullPath,
        imageInfo,
        options
      );

      this.processedImages.add(fullPath);

      // Calculate performance metrics
      const processingTime = Date.now() - startTime;
      let sizeSaved = 0;

      if (optimizedPaths.webp) {
        const optimizedStats = await fs.stat(
          path.resolve(optimizedPaths.webp.replace(/^\//, ""))
        );
        sizeSaved = originalSize - optimizedStats.size;
      }

      this.updatePerformanceMetrics(processingTime, sizeSaved);

      console.log(
        `Optimized ${path.basename(imagePath)}: ${this.formatBytes(
          sizeSaved
        )} saved in ${processingTime}ms`
      );

      return optimizedPaths.webp || optimizedPaths.original;
    } catch (error) {
      this.errors.push(
        `Failed to process image ${imagePath}: ${error.message}`
      );
      return imagePath; // Return original path on error
    }
  }

  /**
   * Get image information
   */
  async getImageInfo(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: (await fs.stat(imagePath)).size,
      };
    } catch (error) {
      throw new Error(`Failed to read image metadata: ${error.message}`);
    }
  }

  /**
   * Optimize image with multiple formats and sizes using enhanced performance settings
   */
  async optimizeImage(imagePath, imageInfo, options = {}) {
    const { dir, name } = path.parse(imagePath);
    const outputDir = options.outputDir || dir;
    const results = {};

    await fs.ensureDir(outputDir);

    // Create Sharp instance with performance optimizations
    const image = sharp(imagePath);

    // Generate WebP version (primary format) with enhanced compression
    if (this.config.formats.includes("webp")) {
      const webpPath = path.join(outputDir, `${name}.webp`);

      // Skip if input and output are the same
      if (path.resolve(imagePath) !== path.resolve(webpPath)) {
        await image
          .clone()
          .resize(this.config.maxWidth, this.config.maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3, // High-quality resampling
          })
          .webp({
            quality: this.config.quality,
            effort: this.config.effort,
            smartSubsample: this.config.smartSubsample,
            nearLossless: false,
            alphaQuality: 80,
          })
          .toFile(webpPath);

        results.webp = this.getRelativePath(webpPath);
      }
    }

    // Generate optimized JPEG version (fallback) with mozjpeg
    if (this.config.formats.includes("jpg")) {
      const jpgPath = path.join(outputDir, `${name}.jpg`);

      // Skip if input and output are the same
      if (path.resolve(imagePath) !== path.resolve(jpgPath)) {
        await image
          .clone()
          .resize(this.config.maxWidth, this.config.maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3,
          })
          .jpeg({
            quality: this.config.quality,
            progressive: this.config.progressive,
            mozjpeg: this.config.mozjpeg,
            trellisQuantisation: this.config.trellisQuantisation,
            overshootDeringing: this.config.overshootDeringing,
            optimizeScans: this.config.optimizeScans,
          })
          .toFile(jpgPath);

        results.jpg = this.getRelativePath(jpgPath);
      }
    }

    // Generate thumbnails if requested
    if (options.generateThumbnails) {
      results.thumbnails = await this.generateThumbnails(
        image,
        outputDir,
        name
      );
    }

    results.original = this.getRelativePath(imagePath);
    return results;
  }

  /**
   * Generate thumbnail versions
   */
  async generateThumbnails(image, outputDir, baseName) {
    const thumbnails = {};

    for (const size of this.config.thumbnailSizes) {
      const thumbPath = path.join(outputDir, `${baseName}${size.suffix}.webp`);

      await image
        .clone()
        .resize(size.width, size.height, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: this.config.quality })
        .toFile(thumbPath);

      thumbnails[size.suffix.replace("-", "")] =
        this.getRelativePath(thumbPath);
    }

    return thumbnails;
  }

  /**
   * Batch process multiple images
   */
  async processImages(imagePaths, options = {}) {
    const results = {};
    const concurrency = options.concurrency || 3;

    // Process images in batches to avoid overwhelming the system
    for (let i = 0; i < imagePaths.length; i += concurrency) {
      const batch = imagePaths.slice(i, i + concurrency);
      const batchPromises = batch.map(async (imagePath) => {
        const result = await this.processImage(imagePath, options);
        return { path: imagePath, result };
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const imagePath = batch[index];
        if (result.status === "fulfilled") {
          results[imagePath] = result.value.result;
        } else {
          this.errors.push(`Failed to process ${imagePath}: ${result.reason}`);
          results[imagePath] = imagePath; // Keep original on error
        }
      });
    }

    return results;
  }

  /**
   * Get optimized path for an image
   */
  getOptimizedPath(originalPath) {
    const { dir, name } = path.parse(originalPath);
    return `${dir}/${name}.webp`;
  }

  /**
   * Convert absolute path to relative path from project root
   */
  getRelativePath(absolutePath) {
    const relativePath = path.relative(process.cwd(), absolutePath);
    return "/" + relativePath.replace(/\\/g, "/"); // Ensure forward slashes
  }

  /**
   * Clean up temporary files
   */
  async cleanup() {
    // Implementation for cleaning up temporary files if needed
    // This could be used to remove intermediate files during processing
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      processedCount: this.processedImages.size,
      errorCount: this.errors.length,
      errors: [...this.errors],
    };
  }

  /**
   * Validate image file
   */
  async validateImage(imagePath) {
    try {
      const fullPath = path.resolve(imagePath.replace(/^\//, ""));

      if (!(await fs.pathExists(fullPath))) {
        return { valid: false, error: "File not found" };
      }

      const metadata = await sharp(fullPath).metadata();

      // Check if it's a valid image format
      const supportedFormats = ["jpeg", "jpg", "png", "webp", "gif", "svg"];
      if (!supportedFormats.includes(metadata.format)) {
        return {
          valid: false,
          error: `Unsupported format: ${metadata.format}`,
        };
      }

      // Check image dimensions
      if (metadata.width < 100 || metadata.height < 100) {
        return { valid: false, error: "Image too small (minimum 100x100px)" };
      }

      return {
        valid: true,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: (await fs.stat(fullPath)).size,
        },
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Generate responsive image srcset
   */
  generateSrcSet(imagePath, sizes = [300, 600, 1200]) {
    const { dir, name } = path.parse(imagePath);

    return sizes
      .map((size) => `${dir}/${name}-${size}w.webp ${size}w`)
      .join(", ");
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(processingTime, sizeSaved) {
    this.performanceMetrics.totalProcessed++;
    this.performanceMetrics.totalTimeSaved += processingTime;
    this.performanceMetrics.totalSizeSaved += sizeSaved;

    // Calculate running average
    this.performanceMetrics.averageProcessingTime =
      this.performanceMetrics.totalTimeSaved /
      this.performanceMetrics.totalProcessed;
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    return {
      ...this.performanceMetrics,
      totalSizeSavedFormatted: this.formatBytes(
        this.performanceMetrics.totalSizeSaved
      ),
      averageProcessingTimeFormatted: `${Math.round(
        this.performanceMetrics.averageProcessingTime
      )}ms`,
    };
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Auto-save functionality for image processing queue
   */
  async enableAutoSave(interval = 30000) {
    setInterval(async () => {
      if (this.processedImages.size > 0) {
        await this.saveProcessingState();
        console.log("Auto-saved image processing state");
      }
    }, interval);
  }

  /**
   * Save processing state for recovery
   */
  async saveProcessingState() {
    try {
      const stateData = {
        processedImages: Array.from(this.processedImages),
        performanceMetrics: this.performanceMetrics,
        timestamp: Date.now(),
      };

      const stateFile = path.join(
        process.cwd(),
        "assets",
        "cache",
        "image-processing-state.json"
      );
      await fs.ensureDir(path.dirname(stateFile));
      await fs.writeJson(stateFile, stateData, { spaces: 2 });
    } catch (error) {
      console.error("Failed to save processing state:", error);
    }
  }

  /**
   * Load processing state for recovery
   */
  async loadProcessingState() {
    try {
      const stateFile = path.join(
        process.cwd(),
        "assets",
        "cache",
        "image-processing-state.json"
      );

      if (await fs.pathExists(stateFile)) {
        const stateData = await fs.readJson(stateFile);

        this.processedImages = new Set(stateData.processedImages || []);
        this.performanceMetrics = {
          ...this.performanceMetrics,
          ...stateData.performanceMetrics,
        };

        console.log(
          `Loaded processing state: ${this.processedImages.size} processed images`
        );
      }
    } catch (error) {
      console.error("Failed to load processing state:", error);
    }
  }

  /**
   * Progressive image loading optimization
   */
  async generateProgressiveVersions(imagePath, options = {}) {
    const { dir, name } = path.parse(imagePath);
    const outputDir = options.outputDir || dir;
    const results = {};

    await fs.ensureDir(outputDir);

    const image = sharp(imagePath);
    const metadata = await image.metadata();

    // Generate low-quality placeholder (LQIP)
    const lqipPath = path.join(outputDir, `${name}-lqip.webp`);
    await image
      .clone()
      .resize(20, Math.round((20 * metadata.height) / metadata.width))
      .webp({ quality: 20 })
      .toFile(lqipPath);

    results.lqip = this.getRelativePath(lqipPath);

    // Generate medium quality version for faster loading
    const mediumPath = path.join(outputDir, `${name}-medium.webp`);
    await image
      .clone()
      .resize(800, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(mediumPath);

    results.medium = this.getRelativePath(mediumPath);

    // Generate high quality version
    const highPath = path.join(outputDir, `${name}-high.webp`);
    await image
      .clone()
      .resize(this.config.maxWidth, this.config.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: this.config.quality })
      .toFile(highPath);

    results.high = this.getRelativePath(highPath);

    return results;
  }
}

module.exports = ImageProcessor;
