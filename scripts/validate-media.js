#!/usr/bin/env node

/**
 * Media Validation Script
 *
 * Validates media files for the Decap CMS
 * Can be used as a webhook or validation endpoint
 */

const MediaManager = require("./utils/media-manager");
const path = require("path");
const fs = require("fs-extra");

class MediaValidator {
  constructor() {
    this.mediaManager = new MediaManager();
  }

  /**
   * Validate a single media file
   */
  async validateFile(filePath, options = {}) {
    try {
      // Check if file exists
      if (!(await fs.pathExists(filePath))) {
        return {
          valid: false,
          error: "File not found",
          code: "FILE_NOT_FOUND",
        };
      }

      // Validate with media manager
      const validation = await this.mediaManager.validateMedia(
        filePath,
        options
      );

      if (!validation.valid) {
        return {
          valid: false,
          error: validation.error,
          code: this.getErrorCode(validation.error),
          duplicate: validation.duplicate,
        };
      }

      // Additional checks for CMS integration
      const additionalChecks = await this.performAdditionalChecks(
        filePath,
        validation.metadata
      );

      return {
        valid: additionalChecks.valid,
        error: additionalChecks.error,
        code: additionalChecks.code,
        metadata: validation.metadata,
        recommendations: additionalChecks.recommendations,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Validation error: ${error.message}`,
        code: "VALIDATION_ERROR",
      };
    }
  }

  /**
   * Perform additional checks specific to CMS usage
   */
  async performAdditionalChecks(filePath, metadata) {
    const recommendations = [];
    const extension = path.extname(filePath).toLowerCase().slice(1);

    // Image-specific checks
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
      // Check image dimensions for web usage
      if (metadata.width && metadata.height) {
        if (metadata.width > 3000 || metadata.height > 3000) {
          recommendations.push(
            "Consider resizing image for web usage (recommended max: 1920x1080)"
          );
        }

        if (metadata.width < 300 || metadata.height < 200) {
          recommendations.push(
            "Image may be too small for effective web display"
          );
        }

        // Check aspect ratio for common use cases
        const aspectRatio = metadata.width / metadata.height;
        if (aspectRatio < 0.5 || aspectRatio > 3) {
          recommendations.push(
            "Unusual aspect ratio - may not display well in all contexts"
          );
        }
      }

      // Check file size for images
      if (metadata.size > 2097152) {
        // 2MB
        recommendations.push(
          "Large image file - consider compression for faster loading"
        );
      }
    }

    // Document-specific checks
    if (["pdf", "doc", "docx"].includes(extension)) {
      if (metadata.size > 5242880) {
        // 5MB
        recommendations.push("Large document file - consider compression");
      }
    }

    // General file name checks
    const fileName = path.basename(filePath);
    if (fileName.includes(" ")) {
      recommendations.push(
        "Consider using hyphens instead of spaces in filename for better web compatibility"
      );
    }

    if (fileName.length > 100) {
      recommendations.push(
        "Very long filename - consider shortening for better compatibility"
      );
    }

    return {
      valid: true,
      recommendations,
    };
  }

  /**
   * Batch validate multiple files
   */
  async validateFiles(filePaths, options = {}) {
    const results = {};

    for (const filePath of filePaths) {
      results[filePath] = await this.validateFile(filePath, options);
    }

    return {
      results,
      summary: this.generateValidationSummary(results),
    };
  }

  /**
   * Generate validation summary
   */
  generateValidationSummary(results) {
    const total = Object.keys(results).length;
    const valid = Object.values(results).filter((r) => r.valid).length;
    const invalid = total - valid;

    const errors = {};
    Object.values(results).forEach((result) => {
      if (!result.valid && result.code) {
        errors[result.code] = (errors[result.code] || 0) + 1;
      }
    });

    return {
      total,
      valid,
      invalid,
      validPercentage: Math.round((valid / total) * 100),
      commonErrors: errors,
    };
  }

  /**
   * Get error code from error message
   */
  getErrorCode(errorMessage) {
    const errorLower = errorMessage.toLowerCase();

    if (errorLower.includes("size exceeds")) return "FILE_TOO_LARGE";
    if (errorLower.includes("file type not allowed"))
      return "INVALID_FILE_TYPE";
    if (errorLower.includes("already exists")) return "DUPLICATE_FILE";
    if (errorLower.includes("too small")) return "IMAGE_TOO_SMALL";
    if (errorLower.includes("unsupported format")) return "UNSUPPORTED_FORMAT";
    if (errorLower.includes("corrupted")) return "CORRUPTED_FILE";

    return "UNKNOWN_ERROR";
  }

  /**
   * CLI interface
   */
  async runCLI() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const command = args[0];

    switch (command) {
      case "validate":
        await this.validateCLI(args.slice(1));
        break;
      case "batch":
        await this.batchValidateCLI(args.slice(1));
        break;
      default:
        console.error(`Unknown command: ${command}`);
        this.showHelp();
    }
  }

  async validateCLI(args) {
    if (args.length === 0) {
      console.error("Please provide a file path to validate");
      return;
    }

    const filePath = args[0];
    console.log(`🔍 Validating: ${filePath}`);

    const result = await this.validateFile(filePath);

    if (result.valid) {
      console.log("✅ File is valid");

      if (result.metadata) {
        console.log("\n📊 Metadata:");
        console.log(`   Size: ${this.formatFileSize(result.metadata.size)}`);
        console.log(`   Type: ${result.metadata.type}`);
        console.log(`   Extension: ${result.metadata.extension}`);

        if (result.metadata.width && result.metadata.height) {
          console.log(
            `   Dimensions: ${result.metadata.width}x${result.metadata.height}`
          );
        }
      }

      if (result.recommendations && result.recommendations.length > 0) {
        console.log("\n💡 Recommendations:");
        result.recommendations.forEach((rec) => {
          console.log(`   • ${rec}`);
        });
      }
    } else {
      console.log("❌ Validation failed");
      console.log(`   Error: ${result.error}`);
      console.log(`   Code: ${result.code}`);

      if (result.duplicate) {
        console.log(`   Duplicate: ${result.duplicate.relativePath}`);
      }
    }
  }

  async batchValidateCLI(args) {
    if (args.length === 0) {
      console.error("Please provide file paths or a directory to validate");
      return;
    }

    const target = args[0];
    let filePaths = [];

    // Check if target is a directory
    if (await fs.pathExists(target)) {
      const stats = await fs.stat(target);
      if (stats.isDirectory()) {
        // Get all files in directory
        const files = await this.getAllFiles(target);
        filePaths = files;
      } else {
        filePaths = [target];
      }
    } else {
      console.error(`Path not found: ${target}`);
      return;
    }

    console.log(`🔍 Batch validating ${filePaths.length} files...`);

    const results = await this.validateFiles(filePaths);

    console.log("\n📊 Validation Summary:");
    console.log(`   Total files: ${results.summary.total}`);
    console.log(
      `   Valid: ${results.summary.valid} (${results.summary.validPercentage}%)`
    );
    console.log(`   Invalid: ${results.summary.invalid}`);

    if (Object.keys(results.summary.commonErrors).length > 0) {
      console.log("\n❌ Common errors:");
      Object.entries(results.summary.commonErrors).forEach(([code, count]) => {
        console.log(`   ${code}: ${count} files`);
      });
    }

    // Show details for invalid files
    const invalidFiles = Object.entries(results.results).filter(
      ([_, result]) => !result.valid
    );
    if (invalidFiles.length > 0 && invalidFiles.length <= 10) {
      console.log("\n❌ Invalid files:");
      invalidFiles.forEach(([filePath, result]) => {
        console.log(`   ${path.basename(filePath)}: ${result.error}`);
      });
    }
  }

  async getAllFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = await fs.stat(fullPath);

      if (stats.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  formatFileSize(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  showHelp() {
    console.log(`
🔍 Media Validation CLI

Usage: node scripts/validate-media.js <command> [options]

Commands:
  validate <file>     Validate a single media file
  batch <path>        Batch validate files in directory or multiple files

Examples:
  node scripts/validate-media.js validate ./image.jpg
  node scripts/validate-media.js batch ./assets/uploads
`);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const validator = new MediaValidator();
  validator.runCLI();
}

module.exports = MediaValidator;
