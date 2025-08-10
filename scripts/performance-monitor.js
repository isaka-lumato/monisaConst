/**
 * Performance Monitoring Script for Decap CMS
 * Monitors and reports on CMS performance metrics
 */

const fs = require("fs").promises;
const path = require("path");
const ImageProcessor = require("./utils/image-processor");

class PerformanceMonitor {
  constructor() {
    this.metricsFile = path.join(
      process.cwd(),
      "assets",
      "data",
      "performance-metrics.json"
    );
    this.imageProcessor = new ImageProcessor();
    this.metrics = {
      buildTimes: [],
      imageSizes: [],
      contentProcessingTimes: [],
      memoryUsage: [],
      errorCounts: [],
      userInteractions: [],
    };
  }

  /**
   * Initialize performance monitoring
   */
  async init() {
    await this.loadMetrics();
    await this.imageProcessor.init();

    // Start periodic monitoring
    this.startPeriodicMonitoring();

    console.log("Performance monitoring initialized");
  }

  /**
   * Start periodic performance monitoring
   */
  startPeriodicMonitoring() {
    // Monitor every 5 minutes
    setInterval(async () => {
      await this.collectMetrics();
    }, 5 * 60 * 1000);

    // Save metrics every 15 minutes
    setInterval(async () => {
      await this.saveMetrics();
    }, 15 * 60 * 1000);
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics() {
    try {
      // Memory usage
      if (process.memoryUsage) {
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsage.push({
          timestamp: Date.now(),
          rss: memUsage.rss,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
        });

        // Keep only last 100 entries
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
        }
      }

      // Check content directory sizes
      await this.monitorContentSizes();

      // Monitor image optimization performance
      const imageReport = this.imageProcessor.getPerformanceReport();
      if (imageReport.totalProcessed > 0) {
        this.metrics.imageSizes.push({
          timestamp: Date.now(),
          totalProcessed: imageReport.totalProcessed,
          totalSizeSaved: imageReport.totalSizeSaved,
          averageProcessingTime: imageReport.averageProcessingTime,
        });
      }
    } catch (error) {
      console.error("Error collecting performance metrics:", error);
      this.recordError("metrics_collection", error.message);
    }
  }

  /**
   * Monitor content directory sizes
   */
  async monitorContentSizes() {
    try {
      const contentDirs = [
        "content/projects",
        "content/blog",
        "content/services",
        "content/team",
        "assets/uploads",
      ];

      for (const dir of contentDirs) {
        const dirPath = path.join(process.cwd(), dir);

        try {
          const size = await this.getDirectorySize(dirPath);

          // Store size data
          if (!this.metrics.contentSizes) {
            this.metrics.contentSizes = {};
          }

          if (!this.metrics.contentSizes[dir]) {
            this.metrics.contentSizes[dir] = [];
          }

          this.metrics.contentSizes[dir].push({
            timestamp: Date.now(),
            size: size,
          });

          // Keep only last 50 entries per directory
          if (this.metrics.contentSizes[dir].length > 50) {
            this.metrics.contentSizes[dir] =
              this.metrics.contentSizes[dir].slice(-50);
          }
        } catch (error) {
          // Directory might not exist, skip
        }
      }
    } catch (error) {
      console.error("Error monitoring content sizes:", error);
    }
  }

  /**
   * Get directory size recursively
   */
  async getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Handle permission errors or missing directories
      return 0;
    }

    return totalSize;
  }

  /**
   * Record build time
   */
  recordBuildTime(duration, type = "full") {
    this.metrics.buildTimes.push({
      timestamp: Date.now(),
      duration: duration,
      type: type,
    });

    // Keep only last 50 build times
    if (this.metrics.buildTimes.length > 50) {
      this.metrics.buildTimes = this.metrics.buildTimes.slice(-50);
    }
  }

  /**
   * Record content processing time
   */
  recordContentProcessingTime(duration, contentType, operation) {
    this.metrics.contentProcessingTimes.push({
      timestamp: Date.now(),
      duration: duration,
      contentType: contentType,
      operation: operation,
    });

    // Keep only last 100 processing times
    if (this.metrics.contentProcessingTimes.length > 100) {
      this.metrics.contentProcessingTimes =
        this.metrics.contentProcessingTimes.slice(-100);
    }
  }

  /**
   * Record user interaction
   */
  recordUserInteraction(action, duration = null, metadata = {}) {
    this.metrics.userInteractions.push({
      timestamp: Date.now(),
      action: action,
      duration: duration,
      metadata: metadata,
    });

    // Keep only last 200 interactions
    if (this.metrics.userInteractions.length > 200) {
      this.metrics.userInteractions = this.metrics.userInteractions.slice(-200);
    }
  }

  /**
   * Record error
   */
  recordError(type, message, metadata = {}) {
    this.metrics.errorCounts.push({
      timestamp: Date.now(),
      type: type,
      message: message,
      metadata: metadata,
    });

    // Keep only last 100 errors
    if (this.metrics.errorCounts.length > 100) {
      this.metrics.errorCounts = this.metrics.errorCounts.slice(-100);
    }
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Filter recent data
    const recentBuildTimes = this.metrics.buildTimes.filter(
      (b) => b.timestamp > oneHourAgo
    );
    const recentErrors = this.metrics.errorCounts.filter(
      (e) => e.timestamp > oneDayAgo
    );
    const recentMemoryUsage = this.metrics.memoryUsage.filter(
      (m) => m.timestamp > oneHourAgo
    );

    // Calculate averages
    const avgBuildTime =
      recentBuildTimes.length > 0
        ? recentBuildTimes.reduce((sum, b) => sum + b.duration, 0) /
          recentBuildTimes.length
        : 0;

    const avgMemoryUsage =
      recentMemoryUsage.length > 0
        ? recentMemoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) /
          recentMemoryUsage.length
        : 0;

    // Get image optimization stats
    const imageReport = this.imageProcessor.getPerformanceReport();

    return {
      timestamp: now,
      summary: {
        averageBuildTime: Math.round(avgBuildTime),
        averageBuildTimeFormatted: `${Math.round(avgBuildTime)}ms`,
        recentBuilds: recentBuildTimes.length,
        recentErrors: recentErrors.length,
        averageMemoryUsage: Math.round(avgMemoryUsage / 1024 / 1024), // MB
        averageMemoryUsageFormatted: `${Math.round(
          avgMemoryUsage / 1024 / 1024
        )}MB`,
      },
      imageOptimization: imageReport,
      buildTimes: {
        recent: recentBuildTimes,
        average: avgBuildTime,
        fastest:
          recentBuildTimes.length > 0
            ? Math.min(...recentBuildTimes.map((b) => b.duration))
            : 0,
        slowest:
          recentBuildTimes.length > 0
            ? Math.max(...recentBuildTimes.map((b) => b.duration))
            : 0,
      },
      errors: {
        recent: recentErrors,
        count: recentErrors.length,
        types: this.groupErrorsByType(recentErrors),
      },
      memoryUsage: {
        recent: recentMemoryUsage,
        average: avgMemoryUsage,
        peak:
          recentMemoryUsage.length > 0
            ? Math.max(...recentMemoryUsage.map((m) => m.heapUsed))
            : 0,
      },
      contentSizes: this.metrics.contentSizes || {},
      userActivity: {
        recentInteractions: this.metrics.userInteractions.filter(
          (i) => i.timestamp > oneHourAgo
        ).length,
        totalInteractions: this.metrics.userInteractions.length,
      },
    };
  }

  /**
   * Group errors by type
   */
  groupErrorsByType(errors) {
    const grouped = {};

    errors.forEach((error) => {
      if (!grouped[error.type]) {
        grouped[error.type] = 0;
      }
      grouped[error.type]++;
    });

    return grouped;
  }

  /**
   * Get performance recommendations
   */
  getRecommendations() {
    const report = this.generateReport();
    const recommendations = [];

    // Build time recommendations
    if (report.summary.averageBuildTime > 5000) {
      recommendations.push({
        type: "build_performance",
        priority: "high",
        message:
          "Build times are slower than recommended (>5s). Consider optimizing content processing.",
        suggestion: "Review image sizes and content complexity",
      });
    }

    // Memory usage recommendations
    if (report.summary.averageMemoryUsage > 512) {
      recommendations.push({
        type: "memory_usage",
        priority: "medium",
        message: "Memory usage is higher than recommended (>512MB).",
        suggestion:
          "Consider reducing concurrent operations or optimizing image processing",
      });
    }

    // Error rate recommendations
    if (report.errors.count > 10) {
      recommendations.push({
        type: "error_rate",
        priority: "high",
        message: "High error rate detected in the last 24 hours.",
        suggestion: "Review error logs and fix recurring issues",
      });
    }

    // Image optimization recommendations
    if (
      report.imageOptimization.totalProcessed > 0 &&
      report.imageOptimization.averageProcessingTime > 2000
    ) {
      recommendations.push({
        type: "image_processing",
        priority: "medium",
        message: "Image processing is slower than optimal (>2s per image).",
        suggestion:
          "Consider reducing image sizes or adjusting quality settings",
      });
    }

    return recommendations;
  }

  /**
   * Load metrics from file
   */
  async loadMetrics() {
    try {
      const data = await fs.readFile(this.metricsFile, "utf8");
      this.metrics = { ...this.metrics, ...JSON.parse(data) };
      console.log("Performance metrics loaded");
    } catch (error) {
      // File doesn't exist or is invalid, use defaults
      console.log("No existing performance metrics found, starting fresh");
    }
  }

  /**
   * Save metrics to file
   */
  async saveMetrics() {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.metricsFile), { recursive: true });

      // Save metrics
      await fs.writeFile(
        this.metricsFile,
        JSON.stringify(this.metrics, null, 2)
      );
      console.log("Performance metrics saved");
    } catch (error) {
      console.error("Failed to save performance metrics:", error);
    }
  }

  /**
   * Export metrics for external analysis
   */
  async exportMetrics(format = "json") {
    const report = this.generateReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (format === "json") {
      const exportPath = path.join(
        process.cwd(),
        "assets",
        "data",
        `performance-report-${timestamp}.json`
      );
      await fs.writeFile(exportPath, JSON.stringify(report, null, 2));
      return exportPath;
    }

    // Could add CSV or other formats here
    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Clean up old metrics data
   */
  async cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) {
    // 30 days
    const cutoff = Date.now() - maxAge;

    // Clean up each metric type
    Object.keys(this.metrics).forEach((key) => {
      if (Array.isArray(this.metrics[key])) {
        this.metrics[key] = this.metrics[key].filter(
          (item) => !item.timestamp || item.timestamp > cutoff
        );
      } else if (typeof this.metrics[key] === "object") {
        // Handle nested objects like contentSizes
        Object.keys(this.metrics[key]).forEach((subKey) => {
          if (Array.isArray(this.metrics[key][subKey])) {
            this.metrics[key][subKey] = this.metrics[key][subKey].filter(
              (item) => !item.timestamp || item.timestamp > cutoff
            );
          }
        });
      }
    });

    await this.saveMetrics();
    console.log("Performance metrics cleanup completed");
  }
}

module.exports = PerformanceMonitor;

// CLI usage
if (require.main === module) {
  const monitor = new PerformanceMonitor();

  const command = process.argv[2];

  switch (command) {
    case "init":
      monitor.init();
      break;

    case "report":
      monitor.loadMetrics().then(() => {
        const report = monitor.generateReport();
        console.log(JSON.stringify(report, null, 2));
      });
      break;

    case "recommendations":
      monitor.loadMetrics().then(() => {
        const recommendations = monitor.getRecommendations();
        console.log("Performance Recommendations:");
        recommendations.forEach((rec, index) => {
          console.log(
            `${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`
          );
          console.log(`   Suggestion: ${rec.suggestion}\n`);
        });
      });
      break;

    case "export":
      const format = process.argv[3] || "json";
      monitor.loadMetrics().then(async () => {
        const exportPath = await monitor.exportMetrics(format);
        console.log(`Performance report exported to: ${exportPath}`);
      });
      break;

    case "cleanup":
      monitor.loadMetrics().then(() => {
        monitor.cleanup();
      });
      break;

    default:
      console.log(
        "Usage: node performance-monitor.js [init|report|recommendations|export|cleanup]"
      );
  }
}
