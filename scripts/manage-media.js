#!/usr/bin/env node

/**
 * Media Management Script
 *
 * Command-line interface for managing media files in the CMS
 */

const MediaManager = require("./utils/media-manager");
const path = require("path");
const fs = require("fs-extra");

class MediaCLI {
  constructor() {
    this.mediaManager = new MediaManager();
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
      switch (command) {
        case "init":
          await this.initializeMedia();
          break;
        case "organize":
          await this.organizeMedia(args[1], args[2]);
          break;
        case "list":
          await this.listMedia(args[1]);
          break;
        case "validate":
          await this.validateMedia(args[1]);
          break;
        case "clean":
          await this.cleanUnusedMedia();
          break;
        case "stats":
          await this.showStats();
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  }

  async initializeMedia() {
    console.log("Initializing media management system...");
    await this.mediaManager.initialize();
    console.log("✅ Media management system initialized successfully");
  }

  async organizeMedia(filePath, category = "general") {
    if (!filePath) {
      console.error("Please provide a file path to organize");
      return;
    }

    console.log(`Organizing ${filePath} into ${category} category...`);

    const validation = await this.mediaManager.validateMedia(filePath);
    if (!validation.valid) {
      console.error("❌ Validation failed:", validation.error);
      return;
    }

    const result = await this.mediaManager.organizeMedia(filePath, category, {
      move: true,
      generateThumbnails: true,
    });

    if (result.success) {
      console.log("✅ Media organized successfully:");
      console.log(`   Path: ${result.relativePath}`);
      console.log(`   URL: ${result.publicUrl}`);
    } else {
      console.error("❌ Failed to organize media:", result.error);
    }
  }

  async listMedia(category) {
    console.log("📁 Media Library Contents:");

    // Ensure media manager is initialized
    await this.mediaManager.initialize();

    const library = this.mediaManager.getMediaLibrary({ category });

    if (library.media.length === 0) {
      console.log("No media files found");
      return;
    }

    console.log(`\nFound ${library.total} files:`);
    console.log("─".repeat(80));

    library.media.forEach((item) => {
      const size = this.formatFileSize(item.size);
      const date = new Date(item.lastModified).toLocaleDateString();
      console.log(`📄 ${item.relativePath}`);
      console.log(
        `   Type: ${item.type} | Size: ${size} | Modified: ${date} | Category: ${item.category}`
      );
      console.log("");
    });

    console.log("\n📊 Summary:");
    console.log(`Categories: ${library.categories.join(", ")}`);
    console.log(`Types: ${library.types.join(", ")}`);
  }

  async validateMedia(filePath) {
    if (!filePath) {
      console.error("Please provide a file path to validate");
      return;
    }

    console.log(`Validating ${filePath}...`);

    const validation = await this.mediaManager.validateMedia(filePath);

    if (validation.valid) {
      console.log("✅ File is valid");
      console.log("Metadata:", validation.metadata);
    } else {
      console.log("❌ Validation failed:", validation.error);
      if (validation.duplicate) {
        console.log("Duplicate found:", validation.duplicate.relativePath);
      }
    }
  }

  async cleanUnusedMedia() {
    console.log("🧹 Scanning for unused media files...");

    const library = this.mediaManager.getMediaLibrary();
    let unusedCount = 0;

    for (const item of library.media) {
      const usage = await this.mediaManager.checkMediaUsage(item.relativePath);

      if (usage.length === 0) {
        console.log(`🗑️  Unused: ${item.relativePath}`);
        unusedCount++;
      }
    }

    if (unusedCount === 0) {
      console.log("✅ No unused media files found");
    } else {
      console.log(`\n⚠️  Found ${unusedCount} unused files`);
      console.log(
        "Run with --delete flag to remove them (not implemented for safety)"
      );
    }
  }

  async showStats() {
    // Ensure media manager is initialized
    await this.mediaManager.initialize();

    const stats = this.mediaManager.getStats();

    console.log("📊 Media Management Statistics:");
    console.log("─".repeat(40));
    console.log(`Total Files: ${stats.totalFiles}`);
    console.log(`Categories: ${stats.categories}`);
    console.log(`File Types: ${stats.types.join(", ")}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.imageProcessorStats) {
      console.log("\n🖼️  Image Processing:");
      console.log(`Processed: ${stats.imageProcessorStats.processedCount}`);
      console.log(`Errors: ${stats.imageProcessorStats.errorCount}`);
    }
  }

  formatFileSize(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  showHelp() {
    console.log(`
📁 Media Management CLI

Usage: node scripts/manage-media.js <command> [options]

Commands:
  init                    Initialize media management system
  organize <file> [cat]   Organize a file into specified category
  list [category]         List media files (optionally by category)
  validate <file>         Validate a media file
  clean                   Find unused media files
  stats                   Show media statistics

Categories:
  projects, blog, team, services, general, documents

Examples:
  node scripts/manage-media.js init
  node scripts/manage-media.js organize ./image.jpg projects
  node scripts/manage-media.js list projects
  node scripts/manage-media.js validate ./document.pdf
  node scripts/manage-media.js stats
`);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new MediaCLI();
  cli.run();
}

module.exports = MediaCLI;
