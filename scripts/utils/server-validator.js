/**
 * Server-side Content Validation
 *
 * Provides comprehensive server-side validation for content processing
 * with detailed error reporting and recovery mechanisms
 */

const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const ContentValidator = require("./content-validator");

class ServerValidator extends ContentValidator {
  constructor() {
    super();
    this.errors = [];
    this.warnings = [];
    this.validationResults = new Map();
    this.strictMode = process.env.VALIDATION_STRICT_MODE === "true";
  }

  /**
   * Validate all content collections
   */
  async validateAllContent(contentDir = "content") {
    console.log("🔍 Starting comprehensive content validation...");

    this.errors = [];
    this.warnings = [];
    this.validationResults.clear();

    const collections = ["projects", "blog", "services", "team", "settings"];
    const results = {
      totalFiles: 0,
      validFiles: 0,
      errorFiles: 0,
      warningFiles: 0,
      collections: {},
    };

    for (const collection of collections) {
      const collectionPath = path.join(contentDir, collection);

      if (await fs.pathExists(collectionPath)) {
        const collectionResult = await this.validateCollection(
          collection,
          collectionPath
        );
        results.collections[collection] = collectionResult;
        results.totalFiles += collectionResult.totalFiles;
        results.validFiles += collectionResult.validFiles;
        results.errorFiles += collectionResult.errorFiles;
        results.warningFiles += collectionResult.warningFiles;
      } else {
        this.warnings.push(`Collection directory not found: ${collectionPath}`);
      }
    }

    // Validate cross-collection references
    await this.validateCrossReferences();

    // Generate validation report
    this.generateValidationReport(results);

    return {
      success: this.errors.length === 0,
      results,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Validate a specific collection
   */
  async validateCollection(collectionName, collectionPath) {
    console.log(`📂 Validating ${collectionName} collection...`);

    const result = {
      collection: collectionName,
      totalFiles: 0,
      validFiles: 0,
      errorFiles: 0,
      warningFiles: 0,
      files: [],
    };

    try {
      const files = await fs.readdir(collectionPath);
      const mdFiles = files.filter(
        (file) => file.endsWith(".md") && file !== "README.md"
      );

      for (const file of mdFiles) {
        const filePath = path.join(collectionPath, file);
        const fileResult = await this.validateFile(collectionName, filePath);

        result.files.push(fileResult);
        result.totalFiles++;

        if (fileResult.errors.length > 0) {
          result.errorFiles++;
          this.errors.push(
            ...fileResult.errors.map((err) => `${filePath}: ${err}`)
          );
        } else {
          result.validFiles++;
        }

        if (fileResult.warnings.length > 0) {
          result.warningFiles++;
          this.warnings.push(
            ...fileResult.warnings.map((warn) => `${filePath}: ${warn}`)
          );
        }
      }

      console.log(
        `✅ ${collectionName}: ${result.validFiles}/${result.totalFiles} files valid`
      );
    } catch (error) {
      const errorMsg = `Failed to validate collection ${collectionName}: ${error.message}`;
      this.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }

    return result;
  }

  /**
   * Validate a single file
   */
  async validateFile(collectionName, filePath) {
    const result = {
      file: filePath,
      errors: [],
      warnings: [],
      data: null,
    };

    try {
      // Read and parse file
      const content = await fs.readFile(filePath, "utf8");
      const parsed = this.parseMarkdownFile(content, filePath);

      if (!parsed.success) {
        result.errors.push(...parsed.errors);
        return result;
      }

      result.data = parsed.data;

      // Validate frontmatter structure
      const structureValidation = this.validateItem(
        collectionName,
        parsed.data,
        filePath
      );
      result.errors.push(...structureValidation.errors);
      result.warnings.push(...structureValidation.warnings);

      // Validate file-specific rules
      const specificValidation = await this.validateFileSpecific(
        collectionName,
        parsed.data,
        filePath
      );
      result.errors.push(...specificValidation.errors);
      result.warnings.push(...specificValidation.warnings);

      // Validate image references
      const imageValidation = await this.validateImagePaths(
        parsed.data,
        path.dirname(filePath)
      );
      result.errors.push(...imageValidation);

      // Validate content security
      const securityValidation = this.validateContentSecurity(
        parsed.data,
        parsed.content
      );
      result.errors.push(...securityValidation.errors);
      result.warnings.push(...securityValidation.warnings);
    } catch (error) {
      result.errors.push(`File processing error: ${error.message}`);
    }

    return result;
  }

  /**
   * Parse markdown file with frontmatter
   */
  parseMarkdownFile(content, filePath) {
    const result = {
      success: false,
      data: null,
      content: "",
      errors: [],
    };

    try {
      // Check for frontmatter
      if (!content.startsWith("---")) {
        result.errors.push("Missing YAML frontmatter");
        return result;
      }

      // Split frontmatter and content
      const parts = content.split("---");
      if (parts.length < 3) {
        result.errors.push("Invalid frontmatter structure");
        return result;
      }

      // Parse YAML frontmatter
      const frontmatterYaml = parts[1];
      const markdownContent = parts.slice(2).join("---").trim();

      try {
        result.data = yaml.load(frontmatterYaml);
        result.content = markdownContent;
        result.success = true;
      } catch (yamlError) {
        result.errors.push(`YAML parsing error: ${yamlError.message}`);
      }
    } catch (error) {
      result.errors.push(`File parsing error: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate file-specific business rules
   */
  async validateFileSpecific(collectionName, data, filePath) {
    const errors = [];
    const warnings = [];

    switch (collectionName) {
      case "projects":
        // Project-specific validations
        if (data.status === "Completed" && !data.completionDate) {
          errors.push("Completed projects must have a completion date");
        }

        if (data.status === "Planning" && data.completionDate) {
          warnings.push("Planning projects should not have completion dates");
        }

        if (
          data.budget &&
          !data.budget.match(/^\$[\d,]+(\.\d{2})?$|^Contact for quote$/)
        ) {
          warnings.push(
            'Budget format should be "$X,XXX.XX" or "Contact for quote"'
          );
        }

        // Validate project timeline consistency
        if (data.timeline && Array.isArray(data.timeline)) {
          const completedPhases = data.timeline.filter(
            (phase) => phase.status === "completed"
          );
          const inProgressPhases = data.timeline.filter(
            (phase) => phase.status === "in-progress"
          );

          if (data.status === "Completed" && inProgressPhases.length > 0) {
            warnings.push(
              "Completed projects should not have in-progress phases"
            );
          }
        }
        break;

      case "blog":
        // Blog-specific validations
        const postDate = new Date(data.date);
        if (postDate > new Date()) {
          warnings.push("Blog post date is in the future");
        }

        if (data.published && !data.featuredImage) {
          errors.push("Published blog posts must have a featured image");
        }

        if (data.excerpt && data.excerpt.length > 200) {
          warnings.push(
            "Excerpt should be under 200 characters for better SEO"
          );
        }

        // Validate author exists
        const validAuthors = [
          "John Mwalimu",
          "Sarah Hassan",
          "Michael Kimani",
          "Grace Mwangi",
          "David Ochieng",
        ];
        if (!validAuthors.includes(data.author)) {
          warnings.push(`Author "${data.author}" is not in the approved list`);
        }
        break;

      case "services":
        // Service-specific validations
        if (data.pricing && data.pricing.startingFrom) {
          if (
            !data.pricing.startingFrom.match(/^\$[\d,]+|^Contact for quote$/)
          ) {
            warnings.push(
              'Pricing format should start with "$" or be "Contact for quote"'
            );
          }
        }

        if (data.features && data.features.length === 0) {
          errors.push("Services must have at least one feature listed");
        }

        if (data.order && (data.order < 1 || data.order > 100)) {
          warnings.push("Service order should be between 1 and 100");
        }
        break;

      case "team":
        // Team-specific validations
        if (data.contact && data.contact.email) {
          const emailDomain = data.contact.email.split("@")[1];
          if (emailDomain !== "monisa.com") {
            warnings.push(
              "Team member email should use company domain (@monisa.com)"
            );
          }
        }

        if (data.professional && data.professional.experience) {
          if (
            data.professional.experience < 0 ||
            data.professional.experience > 50
          ) {
            warnings.push("Years of experience should be between 0 and 50");
          }
        }

        if (data.joinDate) {
          const joinDate = new Date(data.joinDate);
          if (joinDate > new Date()) {
            errors.push("Join date cannot be in the future");
          }
        }
        break;

      case "settings":
        // Settings-specific validations
        if (data.company && data.company.foundedYear) {
          const currentYear = new Date().getFullYear();
          if (data.company.foundedYear > currentYear) {
            errors.push("Founded year cannot be in the future");
          }
          if (data.company.foundedYear < 1900) {
            warnings.push("Founded year seems unusually old");
          }
        }
        break;
    }

    return { errors, warnings };
  }

  /**
   * Validate content security
   */
  validateContentSecurity(data, content) {
    const errors = [];
    const warnings = [];

    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
    ];

    const contentToCheck = JSON.stringify(data) + content;

    dangerousPatterns.forEach((pattern) => {
      if (pattern.test(contentToCheck)) {
        errors.push(
          `Potentially dangerous content detected: ${pattern.source}`
        );
      }
    });

    // Check for suspicious URLs
    const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
    const urls = contentToCheck.match(urlPattern) || [];

    urls.forEach((url) => {
      try {
        const urlObj = new URL(url);

        // Check for suspicious domains
        const suspiciousDomains = ["bit.ly", "tinyurl.com", "goo.gl"];
        if (
          suspiciousDomains.some((domain) => urlObj.hostname.includes(domain))
        ) {
          warnings.push(`Shortened URL detected: ${url}`);
        }

        // Check for non-HTTPS external links
        if (
          urlObj.protocol === "http:" &&
          !urlObj.hostname.includes("localhost")
        ) {
          warnings.push(`Non-HTTPS URL detected: ${url}`);
        }
      } catch (error) {
        warnings.push(`Invalid URL format: ${url}`);
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate cross-collection references
   */
  async validateCrossReferences() {
    console.log("🔗 Validating cross-collection references...");

    // Get all team members for author validation
    const teamMembers = new Set();
    if (this.validationResults.has("team")) {
      this.validationResults.get("team").files.forEach((file) => {
        if (file.data && file.data.name) {
          teamMembers.add(file.data.name);
        }
      });
    }

    // Validate blog post authors
    if (this.validationResults.has("blog")) {
      this.validationResults.get("blog").files.forEach((file) => {
        if (
          file.data &&
          file.data.author &&
          !teamMembers.has(file.data.author)
        ) {
          this.warnings.push(
            `${file.file}: Author "${file.data.author}" not found in team collection`
          );
        }
      });
    }

    // Validate project team references
    if (this.validationResults.has("projects")) {
      this.validationResults.get("projects").files.forEach((file) => {
        if (file.data && file.data.team) {
          ["projectManager", "architect"].forEach((role) => {
            if (
              file.data.team[role] &&
              !teamMembers.has(file.data.team[role])
            ) {
              this.warnings.push(
                `${file.file}: ${role} "${file.data.team[role]}" not found in team collection`
              );
            }
          });
        }
      });
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(results) {
    console.log("\n📊 Content Validation Report");
    console.log("=".repeat(50));

    // Summary
    console.log(`\n📈 SUMMARY:`);
    console.log(`  Total Files: ${results.totalFiles}`);
    console.log(`  ✅ Valid: ${results.validFiles}`);
    console.log(`  ❌ Errors: ${results.errorFiles}`);
    console.log(`  ⚠️  Warnings: ${results.warningFiles}`);

    const successRate =
      results.totalFiles > 0
        ? Math.round((results.validFiles / results.totalFiles) * 100)
        : 0;
    console.log(`  📊 Success Rate: ${successRate}%`);

    // Collection breakdown
    console.log(`\n📂 COLLECTIONS:`);
    Object.entries(results.collections).forEach(([name, data]) => {
      console.log(`  ${name}: ${data.validFiles}/${data.totalFiles} valid`);
    });

    // Errors
    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.errors.length}):`);
      this.errors.slice(0, 10).forEach((error) => {
        console.log(`  • ${error}`);
      });
      if (this.errors.length > 10) {
        console.log(`  ... and ${this.errors.length - 10} more errors`);
      }
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.slice(0, 10).forEach((warning) => {
        console.log(`  • ${warning}`);
      });
      if (this.warnings.length > 10) {
        console.log(`  ... and ${this.warnings.length - 10} more warnings`);
      }
    }

    // Write detailed report to file
    this.writeDetailedReport(results);
  }

  /**
   * Write detailed validation report to file
   */
  async writeDetailedReport(results) {
    const reportPath = path.join("assets", "data", "validation-report.json");

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: results.totalFiles,
        validFiles: results.validFiles,
        errorFiles: results.errorFiles,
        warningFiles: results.warningFiles,
        successRate:
          results.totalFiles > 0
            ? Math.round((results.validFiles / results.totalFiles) * 100)
            : 0,
      },
      collections: results.collections,
      errors: this.errors,
      warnings: this.warnings,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        strictMode: this.strictMode,
      },
    };

    try {
      await fs.ensureDir(path.dirname(reportPath));
      await fs.writeJson(reportPath, report, { spaces: 2 });
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.error(`❌ Failed to write validation report: ${error.message}`);
    }
  }

  /**
   * Validate specific file by path
   */
  async validateSingleFile(filePath) {
    const collectionName = this.getCollectionFromPath(filePath);
    if (!collectionName) {
      throw new Error(`Cannot determine collection for file: ${filePath}`);
    }

    return await this.validateFile(collectionName, filePath);
  }

  /**
   * Get collection name from file path
   */
  getCollectionFromPath(filePath) {
    const pathParts = filePath.split(path.sep);
    const contentIndex = pathParts.indexOf("content");

    if (contentIndex >= 0 && contentIndex < pathParts.length - 1) {
      return pathParts[contentIndex + 1];
    }

    return null;
  }

  /**
   * Check if validation should fail the build
   */
  shouldFailBuild() {
    if (this.strictMode) {
      return this.errors.length > 0 || this.warnings.length > 0;
    }
    return this.errors.length > 0;
  }
}

module.exports = ServerValidator;
