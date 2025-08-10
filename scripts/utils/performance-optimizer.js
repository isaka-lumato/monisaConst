/**
 * Performance Optimization Utilities for Decap CMS
 * Handles image optimization, caching, and performance monitoring
 */

const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");

class PerformanceOptimizer {
  constructor() {
    this.cacheDir = path.join(process.cwd(), "assets", "cache");
    this.optimizedDir = path.join(process.cwd(), "assets", "optimized");
    this.performanceMetrics = {
      imageOptimizations: 0,
      totalSizeSaved: 0,
      averageOptimizationTime: 0,
    };
  }

  /**
   * Initialize performance optimizer
   */
  async init() {
    try {
      // Ensure cache and optimized directories exist
      await this.ensureDirectories();

      // Load existing performance metrics
      await this.loadPerformanceMetrics();

      console.log("Performance optimizer initialized");
    } catch (error) {
      console.error("Failed to initialize performance optimizer:", error);
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [this.cacheDir, this.optimizedDir];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Optimize image with multiple format outputs
   */
  async optimizeImage(inputPath, outputBasePath, options = {}) {
    const startTime = Date.now();
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;

    const defaultOptions = {
      quality: 85,
      progressive: true,
      generateWebP: true,
      generateThumbnails: true,
      thumbnailSizes: [
        { width: 300, height: 200, suffix: "thumb" },
        { width: 600, height: 400, suffix: "medium" },
        { width: 1200, height: 800, suffix: "large" },
      ],
    };

    const config = { ...defaultOptions, ...options };
    const results = [];

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // Generate optimized JPEG
      const jpegPath = `${outputBasePath}.jpg`;
      await image
        .jpeg({
          quality: config.quality,
          progressive: config.progressive,
          mozjpeg: true, // Use mozjpeg encoder for better compression
        })
        .toFile(jpegPath);

      const jpegStats = await fs.stat(jpegPath);
      results.push({
        format: "jpeg",
        path: jpegPath,
        size: jpegStats.size,
        savings: originalSize - jpegStats.size,
      });

      // Generate WebP version if enabled
      if (config.generateWebP) {
        const webpPath = `${outputBasePath}.webp`;
        await image
          .webp({
            quality: config.quality,
            effort: 6, // Higher effort for better compression
          })
          .toFile(webpPath);

        const webpStats = await fs.stat(webpPath);
        results.push({
          format: "webp",
          path: webpPath,
          size: webpStats.size,
          savings: originalSize - webpStats.size,
        });
      }

      // Generate thumbnails if enabled
      if (config.generateThumbnails) {
        for (const thumbConfig of config.thumbnailSizes) {
          const thumbPath = `${outputBasePath}-${thumbConfig.suffix}.jpg`;

          await image
            .resize(thumbConfig.width, thumbConfig.height, {
              fit: "cover",
              position: "center",
            })
            .jpeg({ quality: config.quality, progressive: true })
            .toFile(thumbPath);

          const thumbStats = await fs.stat(thumbPath);
          results.push({
            format: "thumbnail",
            suffix: thumbConfig.suffix,
            path: thumbPath,
            size: thumbStats.size,
            dimensions: `${thumbConfig.width}x${thumbConfig.height}`,
          });
        }
      }

      // Update performance metrics
      const optimizationTime = Date.now() - startTime;
      const totalSaved = results.reduce(
        (sum, result) => sum + (result.savings || 0),
        0
      );

      this.updatePerformanceMetrics({
        optimizationTime,
        sizeSaved: totalSaved,
        originalSize,
        resultCount: results.length,
      });

      console.log(`Optimized image: ${path.basename(inputPath)}`);
      console.log(`Original size: ${this.formatBytes(originalSize)}`);
      console.log(`Total saved: ${this.formatBytes(totalSaved)}`);
      console.log(`Optimization time: ${optimizationTime}ms`);

      return {
        success: true,
        originalSize,
        totalSaved,
        optimizationTime,
        results,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          channels: metadata.channels,
        },
      };
    } catch (error) {
      console.error(`Failed to optimize image ${inputPath}:`, error);
      return {
        success: false,
        error: error.message,
        originalSize,
      };
    }
  }

  /**
   * Batch optimize images in a directory
   */
  async batchOptimizeImages(inputDir, outputDir, options = {}) {
    const startTime = Date.now();
    const results = [];

    try {
      const files = await fs.readdir(inputDir);
      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|webp|tiff)$/i.test(file)
      );

      console.log(`Found ${imageFiles.length} images to optimize`);

      // Process images with concurrency limit
      const concurrencyLimit = options.concurrency || 3;
      const chunks = this.chunkArray(imageFiles, concurrencyLimit);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (file) => {
          const inputPath = path.join(inputDir, file);
          const outputBasePath = path.join(outputDir, path.parse(file).name);

          const result = await this.optimizeImage(
            inputPath,
            outputBasePath,
            options
          );
          return { file, ...result };
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }

      const totalTime = Date.now() - startTime;
      const successCount = results.filter((r) => r.success).length;
      const totalSaved = results.reduce(
        (sum, r) => sum + (r.totalSaved || 0),
        0
      );

      console.log(`Batch optimization completed:`);
      console.log(`- Processed: ${results.length} images`);
      console.log(`- Successful: ${successCount} images`);
      console.log(`- Total time: ${totalTime}ms`);
      console.log(`- Total saved: ${this.formatBytes(totalSaved)}`);

      return {
        success: true,
        totalTime,
        processedCount: results.length,
        successCount,
        totalSaved,
        results,
      };
    } catch (error) {
      console.error("Batch optimization failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate responsive image set
   */
  async generateResponsiveImages(inputPath, outputDir, breakpoints = []) {
    const defaultBreakpoints = [
      { width: 320, suffix: "mobile" },
      { width: 768, suffix: "tablet" },
      { width: 1024, suffix: "desktop" },
      { width: 1920, suffix: "large" },
    ];

    const sizes = breakpoints.length > 0 ? breakpoints : defaultBreakpoints;
    const results = [];

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      const baseName = path.parse(inputPath).name;

      for (const size of sizes) {
        // Skip if original is smaller than target
        if (metadata.width <= size.width) continue;

        const outputPath = path.join(
          outputDir,
          `${baseName}-${size.suffix}.jpg`
        );

        await image
          .resize(size.width, null, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85, progressive: true })
          .toFile(outputPath);

        const stats = await fs.stat(outputPath);
        results.push({
          width: size.width,
          suffix: size.suffix,
          path: outputPath,
          size: stats.size,
        });
      }

      return {
        success: true,
        results,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
      };
    } catch (error) {
      console.error("Failed to generate responsive images:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clean up old optimized images
   */
  async cleanupOptimizedImages(maxAge = 7 * 24 * 60 * 60 * 1000) {
    // 7 days
    try {
      const files = await fs.readdir(this.optimizedDir);
      const now = Date.now();
      let cleanedCount = 0;
      let freedSpace = 0;

      for (const file of files) {
        const filePath = path.join(this.optimizedDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          freedSpace += stats.size;
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      console.log(
        `Cleanup completed: ${cleanedCount} files removed, ${this.formatBytes(
          freedSpace
        )} freed`
      );

      return {
        success: true,
        cleanedCount,
        freedSpace,
      };
    } catch (error) {
      console.error("Cleanup failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(data) {
    this.performanceMetrics.imageOptimizations++;
    this.performanceMetrics.totalSizeSaved += data.sizeSaved;

    // Calculate running average
    const currentAvg = this.performanceMetrics.averageOptimizationTime;
    const count = this.performanceMetrics.imageOptimizations;
    this.performanceMetrics.averageOptimizationTime =
      (currentAvg * (count - 1) + data.optimizationTime) / count;
  }

  /**
   * Load performance metrics from file
   */
  async loadPerformanceMetrics() {
    try {
      const metricsPath = path.join(this.cacheDir, "performance-metrics.json");
      const data = await fs.readFile(metricsPath, "utf8");
      this.performanceMetrics = {
        ...this.performanceMetrics,
        ...JSON.parse(data),
      };
    } catch {
      // File doesn't exist or is invalid, use defaults
    }
  }

  /**
   * Save performance metrics to file
   */
  async savePerformanceMetrics() {
    try {
      const metricsPath = path.join(this.cacheDir, "performance-metrics.json");
      await fs.writeFile(
        metricsPath,
        JSON.stringify(this.performanceMetrics, null, 2)
      );
    } catch (error) {
      console.error("Failed to save performance metrics:", error);
    }
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
      averageOptimizationTimeFormatted: `${Math.round(
        this.performanceMetrics.averageOptimizationTime
      )}ms`,
    };
  }

  /**
   * Utility: Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Utility: Chunk array into smaller arrays
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

module.exports = PerformanceOptimizer;
