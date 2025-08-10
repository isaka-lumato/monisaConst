#!/usr/bin/env node

/**
 * Emergency Rollback Script
 *
 * Provides emergency rollback capabilities for the CMS deployment:
 * - Rollback to last known good state
 * - Rollback to specific commit
 * - Backup current state before rollback
 * - Notification of rollback actions
 */

const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

class EmergencyRollback {
  constructor() {
    this.backupDir = "emergency-backups";
    this.logFile = path.join(this.backupDir, "rollback.log");
  }

  /**
   * Initialize rollback system
   */
  async initialize() {
    await fs.ensureDir(this.backupDir);
    this.log("Emergency rollback system initialized");
  }

  /**
   * Log rollback actions
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    console.log(message);

    try {
      fs.appendFileSync(this.logFile, logMessage);
    } catch (error) {
      console.error("Failed to write to log file:", error.message);
    }
  }

  /**
   * Create backup of current state
   */
  async createBackup(reason = "emergency-rollback") {
    this.log("Creating backup of current state...");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `backup-${timestamp}-${reason}`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      // Create backup directory
      await fs.ensureDir(backupPath);

      // Backup content directory
      if (await fs.pathExists("content")) {
        await fs.copy("content", path.join(backupPath, "content"));
        this.log("✅ Content directory backed up");
      }

      // Backup generated data
      if (await fs.pathExists("assets/data")) {
        await fs.copy("assets/data", path.join(backupPath, "assets/data"));
        this.log("✅ Generated data backed up");
      }

      // Backup uploads
      if (await fs.pathExists("assets/uploads")) {
        await fs.copy(
          "assets/uploads",
          path.join(backupPath, "assets/uploads")
        );
        this.log("✅ Uploads backed up");
      }

      // Backup CMS config
      if (await fs.pathExists("admin/config.yml")) {
        await fs.copy("admin/config.yml", path.join(backupPath, "config.yml"));
        this.log("✅ CMS config backed up");
      }

      // Create backup metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        reason,
        commit: this.getCurrentCommit(),
        branch: this.getCurrentBranch(),
        backupPath,
      };

      await fs.writeJson(path.join(backupPath, "metadata.json"), metadata, {
        spaces: 2,
      });

      this.log(`✅ Backup created successfully: ${backupName}`);
      return backupPath;
    } catch (error) {
      this.log(`❌ Backup creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current Git commit hash
   */
  getCurrentCommit() {
    try {
      return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    } catch (error) {
      this.log(`Warning: Could not get current commit: ${error.message}`);
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
    } catch (error) {
      this.log(`Warning: Could not get current branch: ${error.message}`);
      return "unknown";
    }
  }

  /**
   * Find last successful deployment commit
   */
  async findLastSuccessfulCommit() {
    this.log("Finding last successful deployment...");

    try {
      // Get recent commits
      const commits = execSync("git log --oneline -20", { encoding: "utf8" })
        .trim()
        .split("\n")
        .map((line) => {
          const [hash, ...messageParts] = line.split(" ");
          return {
            hash,
            message: messageParts.join(" "),
          };
        });

      // Look for commits that are likely successful deployments
      const successfulCommit = commits.find(
        (commit) =>
          commit.message.includes("✅") ||
          commit.message.includes("deploy") ||
          commit.message.includes("build") ||
          commit.message.includes("content")
      );

      if (successfulCommit) {
        this.log(
          `Found potential last successful commit: ${successfulCommit.hash} - ${successfulCommit.message}`
        );
        return successfulCommit.hash;
      }

      // Fallback to commit from 24 hours ago
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const fallbackCommit = execSync(
        `git log --since="${oneDayAgo.toISOString()}" --oneline | tail -1`,
        { encoding: "utf8" }
      )
        .trim()
        .split(" ")[0];

      if (fallbackCommit) {
        this.log(`Using fallback commit from 24 hours ago: ${fallbackCommit}`);
        return fallbackCommit;
      }

      throw new Error("No suitable rollback commit found");
    } catch (error) {
      this.log(`❌ Failed to find last successful commit: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rollback to specific commit
   */
  async rollbackToCommit(commitHash, options = {}) {
    const { createBackup = true, force = false } = options;

    this.log(`Starting rollback to commit: ${commitHash}`);

    try {
      // Verify commit exists
      execSync(`git cat-file -e ${commitHash}`, { stdio: "ignore" });

      // Create backup if requested
      if (createBackup) {
        await this.createBackup(`rollback-to-${commitHash.substring(0, 7)}`);
      }

      // Check for uncommitted changes
      const hasChanges = execSync("git status --porcelain", {
        encoding: "utf8",
      }).trim();

      if (hasChanges && !force) {
        throw new Error(
          "Uncommitted changes detected. Use --force to override or commit changes first."
        );
      }

      // Perform rollback
      this.log("Performing Git rollback...");

      if (force && hasChanges) {
        execSync('git stash push -m "Emergency rollback stash"');
        this.log("Uncommitted changes stashed");
      }

      // Reset to target commit
      execSync(`git reset --hard ${commitHash}`);
      this.log(`✅ Git rollback completed to ${commitHash}`);

      // Rebuild content
      this.log("Rebuilding content...");
      execSync("npm run build:content", { stdio: "inherit" });
      this.log("✅ Content rebuild completed");

      // Verify rollback
      const currentCommit = this.getCurrentCommit();
      if (currentCommit === commitHash) {
        this.log(
          `✅ Rollback verification successful. Current commit: ${currentCommit}`
        );
        return true;
      } else {
        throw new Error(
          `Rollback verification failed. Expected: ${commitHash}, Got: ${currentCommit}`
        );
      }
    } catch (error) {
      this.log(`❌ Rollback failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rollback to last successful deployment
   */
  async rollbackToLastSuccessful(options = {}) {
    this.log("Initiating rollback to last successful deployment...");

    try {
      const lastSuccessfulCommit = await this.findLastSuccessfulCommit();
      await this.rollbackToCommit(lastSuccessfulCommit, options);

      this.log("✅ Emergency rollback to last successful deployment completed");
      return lastSuccessfulCommit;
    } catch (error) {
      this.log(`❌ Emergency rollback failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    this.log("Listing available backups...");

    try {
      const backups = [];
      const backupDirs = await fs.readdir(this.backupDir);

      for (const dir of backupDirs) {
        const backupPath = path.join(this.backupDir, dir);
        const stat = await fs.stat(backupPath);

        if (stat.isDirectory()) {
          const metadataPath = path.join(backupPath, "metadata.json");

          let metadata = {
            timestamp: stat.mtime.toISOString(),
            reason: "unknown",
            commit: "unknown",
            branch: "unknown",
          };

          if (await fs.pathExists(metadataPath)) {
            try {
              metadata = await fs.readJson(metadataPath);
            } catch (error) {
              this.log(`Warning: Could not read metadata for backup ${dir}`);
            }
          }

          backups.push({
            name: dir,
            path: backupPath,
            ...metadata,
          });
        }
      }

      // Sort by timestamp (newest first)
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      this.log(`Found ${backups.length} backups:`);
      backups.forEach((backup, index) => {
        this.log(
          `${index + 1}. ${backup.name} (${backup.timestamp}) - ${
            backup.reason
          }`
        );
      });

      return backups;
    } catch (error) {
      this.log(`❌ Failed to list backups: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupName, options = {}) {
    const { createBackup = true } = options;

    this.log(`Restoring from backup: ${backupName}`);

    try {
      const backupPath = path.join(this.backupDir, backupName);

      if (!(await fs.pathExists(backupPath))) {
        throw new Error(`Backup not found: ${backupName}`);
      }

      // Create backup of current state
      if (createBackup) {
        await this.createBackup(`pre-restore-${Date.now()}`);
      }

      // Restore content
      if (await fs.pathExists(path.join(backupPath, "content"))) {
        await fs.remove("content");
        await fs.copy(path.join(backupPath, "content"), "content");
        this.log("✅ Content restored");
      }

      // Restore generated data
      if (await fs.pathExists(path.join(backupPath, "assets/data"))) {
        await fs.remove("assets/data");
        await fs.copy(path.join(backupPath, "assets/data"), "assets/data");
        this.log("✅ Generated data restored");
      }

      // Restore uploads
      if (await fs.pathExists(path.join(backupPath, "assets/uploads"))) {
        await fs.remove("assets/uploads");
        await fs.copy(
          path.join(backupPath, "assets/uploads"),
          "assets/uploads"
        );
        this.log("✅ Uploads restored");
      }

      // Restore CMS config
      if (await fs.pathExists(path.join(backupPath, "config.yml"))) {
        await fs.copy(path.join(backupPath, "config.yml"), "admin/config.yml");
        this.log("✅ CMS config restored");
      }

      this.log(`✅ Restore from backup ${backupName} completed`);
    } catch (error) {
      this.log(`❌ Restore failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get rollback status
   */
  async getStatus() {
    const status = {
      currentCommit: this.getCurrentCommit(),
      currentBranch: this.getCurrentBranch(),
      hasUncommittedChanges: false,
      backupsAvailable: 0,
      lastRollback: null,
    };

    try {
      // Check for uncommitted changes
      const changes = execSync("git status --porcelain", {
        encoding: "utf8",
      }).trim();
      status.hasUncommittedChanges = changes.length > 0;

      // Count available backups
      if (await fs.pathExists(this.backupDir)) {
        const backups = await this.listBackups();
        status.backupsAvailable = backups.length;
      }

      // Check for last rollback log entry
      if (await fs.pathExists(this.logFile)) {
        const logContent = await fs.readFile(this.logFile, "utf8");
        const rollbackEntries = logContent
          .split("\n")
          .filter((line) => line.includes("rollback"))
          .reverse();

        if (rollbackEntries.length > 0) {
          status.lastRollback = rollbackEntries[0];
        }
      }
    } catch (error) {
      this.log(`Warning: Could not get complete status: ${error.message}`);
    }

    return status;
  }
}

// CLI interface
if (require.main === module) {
  const rollback = new EmergencyRollback();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  async function main() {
    await rollback.initialize();

    switch (command) {
      case "status":
        const status = await rollback.getStatus();
        console.log("\n📊 Rollback System Status:");
        console.log(`Current Commit: ${status.currentCommit}`);
        console.log(`Current Branch: ${status.currentBranch}`);
        console.log(
          `Uncommitted Changes: ${status.hasUncommittedChanges ? "Yes" : "No"}`
        );
        console.log(`Available Backups: ${status.backupsAvailable}`);
        if (status.lastRollback) {
          console.log(`Last Rollback: ${status.lastRollback}`);
        }
        break;

      case "backup":
        const reason = args[0] || "manual-backup";
        await rollback.createBackup(reason);
        break;

      case "rollback":
        const target = args[0];
        const force = args.includes("--force");

        if (!target) {
          console.error(
            "Usage: node emergency-rollback.js rollback <commit-hash|last> [--force]"
          );
          process.exit(1);
        }

        if (target === "last") {
          await rollback.rollbackToLastSuccessful({ force });
        } else {
          await rollback.rollbackToCommit(target, { force });
        }
        break;

      case "list-backups":
        await rollback.listBackups();
        break;

      case "restore":
        const backupName = args[0];
        if (!backupName) {
          console.error(
            "Usage: node emergency-rollback.js restore <backup-name>"
          );
          process.exit(1);
        }
        await rollback.restoreFromBackup(backupName);
        break;

      default:
        console.log("Emergency Rollback System");
        console.log("");
        console.log("Usage: node emergency-rollback.js <command> [options]");
        console.log("");
        console.log("Commands:");
        console.log("  status              Show rollback system status");
        console.log("  backup [reason]     Create backup of current state");
        console.log('  rollback <target>   Rollback to commit hash or "last"');
        console.log("  list-backups        List available backups");
        console.log("  restore <backup>    Restore from specific backup");
        console.log("");
        console.log("Options:");
        console.log(
          "  --force             Force rollback even with uncommitted changes"
        );
        break;
    }
  }

  main().catch((error) => {
    console.error("❌ Command failed:", error.message);
    process.exit(1);
  });
}

module.exports = EmergencyRollback;
