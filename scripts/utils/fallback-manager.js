/**
 * Fallback Manager
 *
 * Provides comprehensive fallback mechanisms for failed builds and deployments
 * including backup restoration, graceful degradation, and recovery procedures
 */

const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const ErrorLogger = require("./error-logger");

class FallbackManager {
  constructor(options = {}) {
    this.backupDir = options.backupDir || "fallback-backups";
    this.maxBackups = options.maxBackups || 10;
    this.fallbackDataDir = options.fallbackDataDir || "assets/data-fallback";
    this.errorLogger = ErrorLogger.instance;

    this.fallbackStrategies = {
      BUILD_FAILURE: this.handleBuildFailure.bind(this),
      VALIDATION_FAILURE: this.handleValidationFailure.bind(this),
      DEPLOYMENT_FAILURE: this.handleDeploymentFailure.bind(this),
      CONTENT_CORRUPTION: this.handleContentCorruption.bind(this),
      MEDIA_FAILURE: this.handleMediaFailure.bind(this),
    };
  }

  /**
   * Initialize fallback system
   */
  async initialize() {
    try {
      await fs.ensureDir(this.backupDir);
      await fs.ensureDir(this.fallbackDataDir);

      // Create initial fallback data if it doesn't exist
      await this.createFallbackData();

      console.log("🛡️  Fallback system initialized");
    } catch (error) {
      await this.errorLogger.logError("FALLBACK_INIT_ERROR", error);
      throw error;
    }
  }

  /**
   * Create backup before risky operations
   */
  async createBackup(reason = "pre-operation") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `backup-${timestamp}-${reason}`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      await fs.ensureDir(backupPath);

      // Backup critical directories
      const backupTargets = [
        { src: "content", dest: "content" },
        { src: "assets/data", dest: "assets/data" },
        { src: "assets/uploads", dest: "assets/uploads" },
        { src: "admin/config.yml", dest: "admin-config.yml" },
      ];

      for (const target of backupTargets) {
        const srcPath = target.src;
        const destPath = path.join(backupPath, target.dest);

        if (await fs.pathExists(srcPath)) {
          await fs.copy(srcPath, destPath);
        }
      }

      // Create backup metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        reason,
        commit: this.getCurrentCommit(),
        branch: this.getCurrentBranch(),
        backupPath,
        size: await this.getDirectorySize(backupPath),
      };

      await fs.writeJson(path.join(backupPath, "metadata.json"), metadata, {
        spaces: 2,
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      await this.errorLogger.logInfo(
        "BACKUP_CREATED",
        `Backup created: ${backupName}`,
        metadata
      );
      return backupPath;
    } catch (error) {
      await this.errorLogger.logError("BACKUP_CREATION_FAILED", error, {
        reason,
        backupName,
      });
      throw error;
    }
  }

  /**
   * Execute fallback strategy based on failure type
   */
  async executeFallback(failureType, context = {}) {
    console.log(`🚨 Executing fallback for: ${failureType}`);

    try {
      const strategy = this.fallbackStrategies[failureType];

      if (!strategy) {
        throw new Error(`No fallback strategy defined for: ${failureType}`);
      }

      const result = await strategy(context);

      await this.errorLogger.logInfo(
        "FALLBACK_EXECUTED",
        `Fallback executed for ${failureType}`,
        {
          failureType,
          context,
          result,
        }
      );

      return result;
    } catch (error) {
      await this.errorLogger.logError("FALLBACK_EXECUTION_FAILED", error, {
        failureType,
        context,
      });
      throw error;
    }
  }

  /**
   * Handle build failure fallback
   */
  async handleBuildFailure(context) {
    console.log("🔧 Handling build failure...");

    const strategies = [
      this.restoreFromLastGoodBuild.bind(this),
      this.useFallbackData.bind(this),
      this.generateMinimalData.bind(this),
    ];

    for (const strategy of strategies) {
      try {
        const result = await strategy(context);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.warn(`Fallback strategy failed: ${error.message}`);
        continue;
      }
    }

    throw new Error("All build fallback strategies failed");
  }

  /**
   * Handle validation failure fallback
   */
  async handleValidationFailure(context) {
    console.log("📋 Handling validation failure...");

    try {
      // Try to fix common validation issues automatically
      const fixResult = await this.autoFixValidationIssues(context);

      if (fixResult.fixed > 0) {
        return {
          success: true,
          strategy: "auto-fix",
          fixedIssues: fixResult.fixed,
          remainingIssues: fixResult.remaining,
        };
      }

      // If auto-fix fails, use last known good content
      return await this.restoreValidContent(context);
    } catch (error) {
      // Final fallback: use static fallback data
      return await this.useFallbackData(context);
    }
  }

  /**
   * Handle deployment failure fallback
   */
  async handleDeploymentFailure(context) {
    console.log("🚀 Handling deployment failure...");

    try {
      // Try to rollback to last successful deployment
      const rollbackResult = await this.rollbackDeployment(context);

      if (rollbackResult.success) {
        return rollbackResult;
      }

      // If rollback fails, ensure site remains functional with cached content
      return await this.maintainSiteAvailability(context);
    } catch (error) {
      throw new Error(`Deployment fallback failed: ${error.message}`);
    }
  }

  /**
   * Handle content corruption fallback
   */
  async handleContentCorruption(context) {
    console.log("🔍 Handling content corruption...");

    try {
      // Identify corrupted files
      const corruptedFiles = await this.identifyCorruptedFiles(context);

      // Try to restore from backup
      const restoredFiles = await this.restoreCorruptedFiles(corruptedFiles);

      return {
        success: true,
        strategy: "selective-restore",
        corruptedFiles: corruptedFiles.length,
        restoredFiles: restoredFiles.length,
      };
    } catch (error) {
      // Fallback to removing corrupted content and using defaults
      return await this.removeCorruptedContent(context);
    }
  }

  /**
   * Handle media failure fallback
   */
  async handleMediaFailure(context) {
    console.log("🖼️  Handling media failure...");

    try {
      // Use placeholder images for missing media
      const placeholderResult = await this.usePlaceholderMedia(context);

      // Try to restore media from backup
      const restoreResult = await this.restoreMediaFromBackup(context);

      return {
        success: true,
        strategy: "media-fallback",
        placeholders: placeholderResult.count,
        restored: restoreResult.count,
      };
    } catch (error) {
      throw new Error(`Media fallback failed: ${error.message}`);
    }
  }

  /**
   * Restore from last good build
   */
  async restoreFromLastGoodBuild(context) {
    try {
      const backups = await this.getAvailableBackups();
      const lastGoodBackup = backups.find(
        (backup) =>
          backup.metadata.reason === "pre-build" ||
          backup.metadata.reason === "successful-build"
      );

      if (!lastGoodBackup) {
        throw new Error("No good build backup found");
      }

      await this.restoreFromBackup(lastGoodBackup.name);

      return {
        success: true,
        strategy: "restore-last-good-build",
        backup: lastGoodBackup.name,
      };
    } catch (error) {
      throw new Error(
        `Failed to restore from last good build: ${error.message}`
      );
    }
  }

  /**
   * Use fallback data
   */
  async useFallbackData(context) {
    try {
      console.log("📦 Using fallback data...");

      // Copy fallback data to main data directory
      if (await fs.pathExists(this.fallbackDataDir)) {
        await fs.copy(this.fallbackDataDir, "assets/data");

        return {
          success: true,
          strategy: "fallback-data",
          message: "Using pre-generated fallback data",
        };
      }

      throw new Error("Fallback data not available");
    } catch (error) {
      throw new Error(`Failed to use fallback data: ${error.message}`);
    }
  }

  /**
   * Generate minimal data
   */
  async generateMinimalData(context) {
    try {
      console.log("⚡ Generating minimal data...");

      const minimalData = {
        projects: [],
        blog: [],
        services: [
          {
            title: "Construction Services",
            description: "Professional construction services",
            category: "Construction",
            available: true,
          },
        ],
        team: [
          {
            name: "Monisa Team",
            position: "Construction Professionals",
            bio: "Experienced construction team",
          },
        ],
        "site-settings": {
          company: {
            name: "Monisa Construction Company",
            tagline: "Building Excellence",
            description: "Professional construction services",
          },
          contact: {
            phone: "+255 757 015 247",
            email: "info@monisa.com",
            address: "Dar es Salaam, Tanzania",
          },
        },
      };

      // Write minimal data files
      await fs.ensureDir("assets/data");

      for (const [collection, data] of Object.entries(minimalData)) {
        await fs.writeJson(`assets/data/${collection}.json`, data, {
          spaces: 2,
        });
      }

      return {
        success: true,
        strategy: "minimal-data",
        message: "Generated minimal functional data",
      };
    } catch (error) {
      throw new Error(`Failed to generate minimal data: ${error.message}`);
    }
  }

  /**
   * Auto-fix common validation issues
   */
  async autoFixValidationIssues(context) {
    const fixes = {
      fixed: 0,
      remaining: 0,
      issues: [],
    };

    try {
      // Common fixes that can be automated
      const autoFixes = [
        this.fixMissingRequiredFields.bind(this),
        this.fixInvalidDates.bind(this),
        this.fixMissingImages.bind(this),
        this.fixInvalidUrls.bind(this),
      ];

      for (const fix of autoFixes) {
        try {
          const result = await fix(context);
          fixes.fixed += result.fixed;
          fixes.issues.push(...result.issues);
        } catch (error) {
          console.warn(`Auto-fix failed: ${error.message}`);
        }
      }

      return fixes;
    } catch (error) {
      throw new Error(`Auto-fix validation issues failed: ${error.message}`);
    }
  }

  /**
   * Create fallback data
   */
  async createFallbackData() {
    try {
      // Only create if fallback data doesn't exist
      if (
        await fs.pathExists(path.join(this.fallbackDataDir, "projects.json"))
      ) {
        return;
      }

      console.log("📦 Creating fallback data...");

      // Copy current data as fallback if it exists and is valid
      if (await fs.pathExists("assets/data")) {
        const dataFiles = await fs.readdir("assets/data");
        const jsonFiles = dataFiles.filter((file) => file.endsWith(".json"));

        if (jsonFiles.length > 0) {
          await fs.copy("assets/data", this.fallbackDataDir);
          console.log("✅ Fallback data created from current data");
          return;
        }
      }

      // Generate basic fallback data
      await this.generateMinimalData({});
      await fs.copy("assets/data", this.fallbackDataDir);

      console.log("✅ Basic fallback data generated");
    } catch (error) {
      console.warn("Failed to create fallback data:", error.message);
    }
  }

  /**
   * Get available backups
   */
  async getAvailableBackups() {
    try {
      const backups = [];
      const backupDirs = await fs.readdir(this.backupDir);

      for (const dir of backupDirs) {
        const backupPath = path.join(this.backupDir, dir);
        const metadataPath = path.join(backupPath, "metadata.json");

        if (await fs.pathExists(metadataPath)) {
          const metadata = await fs.readJson(metadataPath);
          backups.push({
            name: dir,
            path: backupPath,
            metadata,
          });
        }
      }

      return backups.sort(
        (a, b) =>
          new Date(b.metadata.timestamp) - new Date(a.metadata.timestamp)
      );
    } catch (error) {
      throw new Error(`Failed to get available backups: ${error.message}`);
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupName) {
    const backupPath = path.join(this.backupDir, backupName);

    if (!(await fs.pathExists(backupPath))) {
      throw new Error(`Backup not found: ${backupName}`);
    }

    try {
      // Restore content
      if (await fs.pathExists(path.join(backupPath, "content"))) {
        await fs.remove("content");
        await fs.copy(path.join(backupPath, "content"), "content");
      }

      // Restore data
      if (await fs.pathExists(path.join(backupPath, "assets/data"))) {
        await fs.remove("assets/data");
        await fs.copy(path.join(backupPath, "assets/data"), "assets/data");
      }

      // Restore uploads
      if (await fs.pathExists(path.join(backupPath, "assets/uploads"))) {
        await fs.remove("assets/uploads");
        await fs.copy(
          path.join(backupPath, "assets/uploads"),
          "assets/uploads"
        );
      }

      console.log(`✅ Restored from backup: ${backupName}`);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error.message}`);
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.getAvailableBackups();

      if (backups.length > this.maxBackups) {
        const backupsToDelete = backups.slice(this.maxBackups);

        for (const backup of backupsToDelete) {
          await fs.remove(backup.path);
        }

        console.log(`🧹 Cleaned up ${backupsToDelete.length} old backups`);
      }
    } catch (error) {
      console.warn("Failed to cleanup old backups:", error.message);
    }
  }

  /**
   * Get current Git commit
   */
  getCurrentCommit() {
    try {
      return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    } catch {
      return "unknown";
    }
  }

  /**
   * Get current Git branch
   */
  getCurrentBranch() {
    try {
      return execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf8",
      }).trim();
    } catch {
      return "unknown";
    }
  }

  /**
   * Get directory size
   */
  async getDirectorySize(dirPath) {
    try {
      let size = 0;
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
          size += await this.getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          size += stats.size;
        }
      }

      return size;
    } catch {
      return 0;
    }
  }

  // Placeholder methods for specific fix implementations
  async fixMissingRequiredFields(context) {
    return { fixed: 0, issues: [] };
  }
  async fixInvalidDates(context) {
    return { fixed: 0, issues: [] };
  }
  async fixMissingImages(context) {
    return { fixed: 0, issues: [] };
  }
  async fixInvalidUrls(context) {
    return { fixed: 0, issues: [] };
  }
  async restoreValidContent(context) {
    return { success: false };
  }
  async rollbackDeployment(context) {
    return { success: false };
  }
  async maintainSiteAvailability(context) {
    return { success: true };
  }
  async identifyCorruptedFiles(context) {
    return [];
  }
  async restoreCorruptedFiles(files) {
    return [];
  }
  async removeCorruptedContent(context) {
    return { success: true };
  }
  async usePlaceholderMedia(context) {
    return { count: 0 };
  }
  async restoreMediaFromBackup(context) {
    return { count: 0 };
  }
}

module.exports = FallbackManager;
