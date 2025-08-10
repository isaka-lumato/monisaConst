/**
 * Error Logging and Notification System
 *
 * Provides comprehensive error logging, tracking, and notification capabilities
 * for the CMS system with multiple output formats and notification channels
 */

const fs = require("fs-extra");
const path = require("path");
const NotificationManager = require("../deployment-notifications");

class ErrorLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || "logs";
    this.maxLogFiles = options.maxLogFiles || 30;
    this.maxLogSize = options.maxLogSize || 10485760; // 10MB
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.enableNotifications = options.enableNotifications !== false;

    this.notificationManager = new NotificationManager();
    this.errorCounts = new Map();
    this.sessionId = this.generateSessionId();

    this.initialize();
  }

  /**
   * Initialize error logging system
   */
  async initialize() {
    try {
      if (this.enableFile) {
        await fs.ensureDir(this.logDir);
        await this.rotateLogFiles();
      }

      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      console.log("📝 Error logging system initialized");
    } catch (error) {
      console.error("Failed to initialize error logging:", error);
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      this.logError("UNCAUGHT_EXCEPTION", error, {
        fatal: true,
        source: "process.uncaughtException",
      });

      // Give time for logging before exit
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      this.logError("UNHANDLED_REJECTION", reason, {
        fatal: false,
        source: "process.unhandledRejection",
        promise: promise.toString(),
      });
    });

    // Handle warnings
    process.on("warning", (warning) => {
      this.logWarning("PROCESS_WARNING", warning.message, {
        name: warning.name,
        stack: warning.stack,
      });
    });
  }

  /**
   * Log error with comprehensive details
   */
  async logError(type, error, context = {}) {
    const errorEntry = this.createErrorEntry("ERROR", type, error, context);

    // Track error frequency
    const errorKey = `${type}:${error.message}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Add frequency to context
    errorEntry.frequency = this.errorCounts.get(errorKey);

    await this.writeLog(errorEntry);

    // Send notifications for critical errors
    if (context.fatal || this.isCriticalError(type, error)) {
      await this.sendErrorNotification(errorEntry);
    }

    return errorEntry;
  }

  /**
   * Log warning
   */
  async logWarning(type, message, context = {}) {
    const warningEntry = this.createErrorEntry(
      "WARNING",
      type,
      { message },
      context
    );
    await this.writeLog(warningEntry);
    return warningEntry;
  }

  /**
   * Log info message
   */
  async logInfo(type, message, context = {}) {
    const infoEntry = this.createErrorEntry("INFO", type, { message }, context);
    await this.writeLog(infoEntry);
    return infoEntry;
  }

  /**
   * Log validation error
   */
  async logValidationError(filePath, errors, warnings = []) {
    const validationEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      level: "VALIDATION_ERROR",
      type: "CONTENT_VALIDATION",
      file: filePath,
      errors: errors,
      warnings: warnings,
      errorCount: errors.length,
      warningCount: warnings.length,
      environment: this.getEnvironmentInfo(),
    };

    await this.writeLog(validationEntry);

    // Send notification if too many validation errors
    if (errors.length > 5) {
      await this.sendValidationNotification(validationEntry);
    }

    return validationEntry;
  }

  /**
   * Log build error
   */
  async logBuildError(stage, error, context = {}) {
    const buildEntry = this.createErrorEntry("BUILD_ERROR", stage, error, {
      ...context,
      buildStage: stage,
      fatal: true,
    });

    await this.writeLog(buildEntry);
    await this.sendBuildErrorNotification(buildEntry);

    return buildEntry;
  }

  /**
   * Log deployment error
   */
  async logDeploymentError(error, context = {}) {
    const deployEntry = this.createErrorEntry(
      "DEPLOYMENT_ERROR",
      "DEPLOY_FAILED",
      error,
      {
        ...context,
        fatal: true,
      }
    );

    await this.writeLog(deployEntry);
    await this.sendDeploymentErrorNotification(deployEntry);

    return deployEntry;
  }

  /**
   * Create standardized error entry
   */
  createErrorEntry(level, type, error, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      level: level,
      type: type,
      message: error.message || error.toString(),
      stack: error.stack || null,
      context: context,
      environment: this.getEnvironmentInfo(),
      git: this.getGitInfo(),
    };

    // Add error details if available
    if (error.code) entry.code = error.code;
    if (error.errno) entry.errno = error.errno;
    if (error.syscall) entry.syscall = error.syscall;
    if (error.path) entry.path = error.path;

    return entry;
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cwd: process.cwd(),
      pid: process.pid,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        CI: process.env.CI,
        GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
      },
    };
  }

  /**
   * Get Git information
   */
  getGitInfo() {
    try {
      const { execSync } = require("child_process");
      return {
        commit: execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(),
        branch: execSync("git rev-parse --abbrev-ref HEAD", {
          encoding: "utf8",
        }).trim(),
        repository: process.env.GITHUB_REPOSITORY || "unknown",
      };
    } catch (error) {
      return {
        commit: "unknown",
        branch: "unknown",
        repository: process.env.GITHUB_REPOSITORY || "unknown",
      };
    }
  }

  /**
   * Write log entry to file and console
   */
  async writeLog(entry) {
    // Console output
    if (this.enableConsole) {
      this.writeToConsole(entry);
    }

    // File output
    if (this.enableFile) {
      await this.writeToFile(entry);
    }
  }

  /**
   * Write to console with formatting
   */
  writeToConsole(entry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.padEnd(15);

    let color = "";
    switch (entry.level) {
      case "ERROR":
      case "BUILD_ERROR":
      case "DEPLOYMENT_ERROR":
      case "UNCAUGHT_EXCEPTION":
        color = "\x1b[31m"; // Red
        break;
      case "WARNING":
      case "VALIDATION_ERROR":
        color = "\x1b[33m"; // Yellow
        break;
      case "INFO":
        color = "\x1b[36m"; // Cyan
        break;
      default:
        color = "\x1b[0m"; // Reset
    }

    console.log(`${color}[${timestamp}] ${level} ${entry.message}\x1b[0m`);

    if (entry.stack && entry.level.includes("ERROR")) {
      console.log(`${color}${entry.stack}\x1b[0m`);
    }
  }

  /**
   * Write to log file
   */
  async writeToFile(entry) {
    try {
      const logFile = path.join(this.logDir, this.getCurrentLogFileName());
      const logLine = JSON.stringify(entry) + "\n";

      await fs.appendFile(logFile, logLine);

      // Check if log rotation is needed
      const stats = await fs.stat(logFile);
      if (stats.size > this.maxLogSize) {
        await this.rotateLogFiles();
      }
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  /**
   * Get current log file name
   */
  getCurrentLogFileName() {
    const date = new Date().toISOString().split("T")[0];
    return `cms-${date}.log`;
  }

  /**
   * Rotate log files
   */
  async rotateLogFiles() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter((file) => file.startsWith("cms-") && file.endsWith(".log"))
        .sort()
        .reverse();

      // Remove old log files
      if (logFiles.length > this.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.maxLogFiles);
        for (const file of filesToDelete) {
          await fs.remove(path.join(this.logDir, file));
        }
      }
    } catch (error) {
      console.error("Failed to rotate log files:", error);
    }
  }

  /**
   * Check if error is critical
   */
  isCriticalError(type, error) {
    const criticalTypes = [
      "UNCAUGHT_EXCEPTION",
      "BUILD_ERROR",
      "DEPLOYMENT_ERROR",
      "SECURITY_VIOLATION",
    ];

    const criticalMessages = ["ENOENT", "EACCES", "EMFILE", "ENOMEM"];

    return (
      criticalTypes.includes(type) ||
      criticalMessages.some((msg) => error.message.includes(msg))
    );
  }

  /**
   * Send error notification
   */
  async sendErrorNotification(errorEntry) {
    if (!this.enableNotifications) return;

    try {
      const context = this.notificationManager.constructor.parseGitHubContext();

      await this.notificationManager.notifyBuildFailure({
        ...context,
        error: `${errorEntry.type}: ${errorEntry.message}`,
        errorDetails: {
          level: errorEntry.level,
          frequency: errorEntry.frequency,
          stack: errorEntry.stack
            ? errorEntry.stack.split("\n").slice(0, 5).join("\n")
            : null,
        },
      });
    } catch (error) {
      console.error("Failed to send error notification:", error);
    }
  }

  /**
   * Send validation notification
   */
  async sendValidationNotification(validationEntry) {
    if (!this.enableNotifications) return;

    try {
      // Create a custom notification for validation errors
      const message = {
        text: `⚠️ Content Validation Issues Detected`,
        attachments: [
          {
            color: "warning",
            fields: [
              {
                title: "File",
                value: validationEntry.file,
                short: false,
              },
              {
                title: "Errors",
                value: validationEntry.errorCount.toString(),
                short: true,
              },
              {
                title: "Warnings",
                value: validationEntry.warningCount.toString(),
                short: true,
              },
              {
                title: "Issues",
                value: validationEntry.errors.slice(0, 3).join("\n"),
                short: false,
              },
            ],
          },
        ],
      };

      await this.notificationManager.sendSlackNotification(message);
    } catch (error) {
      console.error("Failed to send validation notification:", error);
    }
  }

  /**
   * Send build error notification
   */
  async sendBuildErrorNotification(buildEntry) {
    if (!this.enableNotifications) return;

    try {
      const context = this.notificationManager.constructor.parseGitHubContext();

      await this.notificationManager.notifyBuildFailure({
        ...context,
        error: `Build failed at stage: ${buildEntry.context.buildStage}`,
        buildStage: buildEntry.context.buildStage,
        errorMessage: buildEntry.message,
      });
    } catch (error) {
      console.error("Failed to send build error notification:", error);
    }
  }

  /**
   * Send deployment error notification
   */
  async sendDeploymentErrorNotification(deployEntry) {
    if (!this.enableNotifications) return;

    try {
      const context = this.notificationManager.constructor.parseGitHubContext();

      await this.notificationManager.notifyBuildFailure({
        ...context,
        error: `Deployment failed: ${deployEntry.message}`,
        deploymentError: true,
      });
    } catch (error) {
      console.error("Failed to send deployment error notification:", error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: 0,
      errorsByType: new Map(),
      topErrors: [],
    };

    for (const [errorKey, count] of this.errorCounts.entries()) {
      const [type] = errorKey.split(":");
      stats.totalErrors += count;
      stats.errorsByType.set(type, (stats.errorsByType.get(type) || 0) + count);
    }

    // Get top 10 most frequent errors
    stats.topErrors = Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));

    return stats;
  }

  /**
   * Generate error report
   */
  async generateErrorReport() {
    const stats = this.getErrorStats();
    const report = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      summary: {
        totalErrors: stats.totalErrors,
        errorTypes: Object.fromEntries(stats.errorsByType),
        topErrors: stats.topErrors,
      },
      environment: this.getEnvironmentInfo(),
      git: this.getGitInfo(),
    };

    // Write report to file
    const reportPath = path.join(
      this.logDir,
      `error-report-${Date.now()}.json`
    );
    await fs.writeJson(reportPath, report, { spaces: 2 });

    console.log(`📊 Error report generated: ${reportPath}`);
    return report;
  }

  /**
   * Clear error counts (useful for testing)
   */
  clearErrorCounts() {
    this.errorCounts.clear();
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(hours = 24) {
    try {
      const logFile = path.join(this.logDir, this.getCurrentLogFileName());

      if (!(await fs.pathExists(logFile))) {
        return [];
      }

      const content = await fs.readFile(logFile, "utf8");
      const lines = content.trim().split("\n").filter(Boolean);
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      return lines
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((entry) => entry && new Date(entry.timestamp) > cutoffTime)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error("Failed to get recent logs:", error);
      return [];
    }
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger({
  enableNotifications: process.env.NODE_ENV === "production",
});

module.exports = ErrorLogger;
module.exports.instance = errorLogger;
