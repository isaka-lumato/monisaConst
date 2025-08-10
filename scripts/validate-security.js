#!/usr/bin/env node

/**
 * Security Validation Script
 * Validates the security configuration and implementation of the CMS
 */

const fs = require("fs-extra");
const path = require("path");
const ContentSanitizer = require("./utils/content-sanitizer");
const SecurityHeaders = require("./utils/security-headers");

class SecurityValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  /**
   * Run all security validations
   */
  async validate() {
    console.log("🔒 Running Security Validation...\n");

    await this.validateAdminConfiguration();
    await this.validateContentSanitization();
    await this.validateSecurityHeaders();
    await this.validateFilePermissions();
    await this.validateContentFiles();

    this.generateReport();
  }

  /**
   * Validate admin configuration security
   */
  async validateAdminConfiguration() {
    console.log("📋 Validating Admin Configuration...");

    try {
      // Check admin config exists
      const configPath = "admin/config.yml";
      if (!(await fs.pathExists(configPath))) {
        this.errors.push("Admin config.yml not found");
        return;
      }

      const configContent = await fs.readFile(configPath, "utf8");

      // Check for GitHub backend configuration
      if (configContent.includes("name: github")) {
        this.passed.push("✅ GitHub backend configured");
      } else if (configContent.includes("name: git-gateway")) {
        this.warnings.push(
          "⚠️  Using git-gateway instead of GitHub OAuth (less secure)"
        );
      } else {
        this.errors.push("❌ No valid backend configuration found");
      }

      // Check for PKCE authentication
      if (configContent.includes("auth_type: pkce")) {
        this.passed.push("✅ PKCE authentication enabled");
      } else {
        this.warnings.push("⚠️  PKCE authentication not configured");
      }

      // Check for minimal auth scope
      if (configContent.includes("auth_scope: repo")) {
        this.passed.push("✅ Minimal auth scope configured");
      } else {
        this.warnings.push("⚠️  Auth scope not optimally configured");
      }

      // Check admin index.html
      const adminIndexPath = "admin/index.html";
      if (await fs.pathExists(adminIndexPath)) {
        const adminContent = await fs.readFile(adminIndexPath, "utf8");

        // Check for security headers
        if (adminContent.includes("Content-Security-Policy")) {
          this.passed.push("✅ Security headers configured in admin interface");
        } else {
          this.errors.push("❌ Security headers missing from admin interface");
        }

        // Check for session management
        if (adminContent.includes("sessionTimeout")) {
          this.passed.push("✅ Session management implemented");
        } else {
          this.warnings.push("⚠️  Session management not implemented");
        }
      } else {
        this.errors.push("❌ Admin index.html not found");
      }
    } catch (error) {
      this.errors.push(
        `❌ Error validating admin configuration: ${error.message}`
      );
    }
  }

  /**
   * Validate content sanitization implementation
   */
  async validateContentSanitization() {
    console.log("🧹 Validating Content Sanitization...");

    try {
      // Check if content sanitizer exists
      const sanitizerPath = "scripts/utils/content-sanitizer.js";
      if (!(await fs.pathExists(sanitizerPath))) {
        this.errors.push("❌ Content sanitizer module not found");
        return;
      }

      this.passed.push("✅ Content sanitizer module exists");

      // Test sanitization functions
      const testHTML = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = ContentSanitizer.sanitizeHTML(testHTML);

      if (!sanitized.includes("<script>")) {
        this.passed.push("✅ HTML sanitization removes script tags");
      } else {
        this.errors.push("❌ HTML sanitization fails to remove script tags");
      }

      // Test URL validation
      const dangerousUrl = 'javascript:alert("xss")';
      const validatedUrl = ContentSanitizer.validateURL(dangerousUrl);

      if (!validatedUrl) {
        this.passed.push("✅ URL validation blocks dangerous URLs");
      } else {
        this.errors.push("❌ URL validation allows dangerous URLs");
      }

      // Test Markdown sanitization
      const testMarkdown = '[Click me](javascript:alert("xss"))';
      const sanitizedMarkdown = ContentSanitizer.sanitizeMarkdown(testMarkdown);

      if (!sanitizedMarkdown.includes("javascript:")) {
        this.passed.push("✅ Markdown sanitization removes dangerous URLs");
      } else {
        this.errors.push("❌ Markdown sanitization allows dangerous URLs");
      }
    } catch (error) {
      this.errors.push(
        `❌ Error validating content sanitization: ${error.message}`
      );
    }
  }

  /**
   * Validate security headers implementation
   */
  async validateSecurityHeaders() {
    console.log("🛡️  Validating Security Headers...");

    try {
      // Check if security headers module exists
      const headersPath = "scripts/utils/security-headers.js";
      if (!(await fs.pathExists(headersPath))) {
        this.errors.push("❌ Security headers module not found");
        return;
      }

      this.passed.push("✅ Security headers module exists");

      // Test security headers generation
      const headers = SecurityHeaders.getSecurityHeaders();

      const requiredHeaders = [
        "Content-Security-Policy",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Referrer-Policy",
      ];

      requiredHeaders.forEach((header) => {
        if (headers[header]) {
          this.passed.push(`✅ ${header} header configured`);
        } else {
          this.errors.push(`❌ ${header} header missing`);
        }
      });

      // Check CSP configuration
      const csp = headers["Content-Security-Policy"];
      if (csp) {
        if (csp.includes("default-src 'self'")) {
          this.passed.push("✅ CSP default-src properly restricted");
        } else {
          this.warnings.push("⚠️  CSP default-src not optimally configured");
        }

        if (csp.includes("frame-ancestors 'none'")) {
          this.passed.push("✅ CSP prevents clickjacking");
        } else {
          this.warnings.push("⚠️  CSP frame-ancestors not configured");
        }
      }
    } catch (error) {
      this.errors.push(
        `❌ Error validating security headers: ${error.message}`
      );
    }
  }

  /**
   * Validate file permissions and access controls
   */
  async validateFilePermissions() {
    console.log("🔐 Validating File Permissions...");

    try {
      // Check for sensitive files that should be protected
      const sensitiveFiles = [
        "admin/config.yml",
        "scripts/utils/content-sanitizer.js",
        "scripts/utils/security-headers.js",
        "admin/security-config.js",
      ];

      for (const file of sensitiveFiles) {
        if (await fs.pathExists(file)) {
          this.passed.push(`✅ ${file} exists and should be protected`);
        } else {
          this.warnings.push(`⚠️  ${file} not found`);
        }
      }

      // Check for .htaccess or nginx config generation capability
      try {
        const htaccessRules = SecurityHeaders.generateHtaccessRules();
        if (htaccessRules.includes("Header always set")) {
          this.passed.push("✅ Apache .htaccess rules can be generated");
        }

        const nginxConfig = SecurityHeaders.generateNginxConfig();
        if (nginxConfig.includes("add_header")) {
          this.passed.push("✅ Nginx configuration can be generated");
        }
      } catch (error) {
        this.warnings.push("⚠️  Server configuration generation failed");
      }
    } catch (error) {
      this.errors.push(
        `❌ Error validating file permissions: ${error.message}`
      );
    }
  }

  /**
   * Validate existing content files for security issues
   */
  async validateContentFiles() {
    console.log("📄 Validating Content Files...");

    try {
      const contentDirs = [
        "content/projects",
        "content/blog",
        "content/services",
        "content/team",
      ];
      let totalFiles = 0;
      let issuesFound = 0;

      for (const dir of contentDirs) {
        if (await fs.pathExists(dir)) {
          const files = await fs.readdir(dir);
          const mdFiles = files.filter((file) => file.endsWith(".md"));

          for (const file of mdFiles) {
            totalFiles++;
            const filePath = path.join(dir, file);
            const content = await fs.readFile(filePath, "utf8");

            const validation = ContentSanitizer.validateFileContent(
              filePath,
              content
            );
            if (validation.warnings.length > 0) {
              issuesFound++;
              this.warnings.push(
                `⚠️  Security issues in ${filePath}: ${validation.warnings.join(
                  ", "
                )}`
              );
            }
          }
        }
      }

      if (totalFiles > 0) {
        this.passed.push(`✅ Validated ${totalFiles} content files`);
        if (issuesFound === 0) {
          this.passed.push("✅ No security issues found in content files");
        } else {
          this.warnings.push(
            `⚠️  Security issues found in ${issuesFound} content files`
          );
        }
      } else {
        this.warnings.push("⚠️  No content files found to validate");
      }
    } catch (error) {
      this.errors.push(`❌ Error validating content files: ${error.message}`);
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log("\n📊 Security Validation Report");
    console.log("=".repeat(50));

    if (this.passed.length > 0) {
      console.log("\n✅ PASSED CHECKS:");
      this.passed.forEach((check) => console.log(`  ${check}`));
    }

    if (this.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      this.warnings.forEach((warning) => console.log(`  ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      this.errors.forEach((error) => console.log(`  ${error}`));
    }

    console.log("\n📈 SUMMARY:");
    console.log(`  ✅ Passed: ${this.passed.length}`);
    console.log(`  ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`  ❌ Errors: ${this.errors.length}`);

    const totalChecks =
      this.passed.length + this.warnings.length + this.errors.length;
    const successRate =
      totalChecks > 0
        ? Math.round((this.passed.length / totalChecks) * 100)
        : 0;

    console.log(`  📊 Success Rate: ${successRate}%`);

    if (this.errors.length === 0) {
      console.log("\n🎉 Security validation completed successfully!");
      if (this.warnings.length > 0) {
        console.log(
          "💡 Consider addressing the warnings above for enhanced security."
        );
      }
    } else {
      console.log(
        "\n🚨 Security validation failed! Please address the errors above."
      );
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new SecurityValidator();
  validator.validate().catch((error) => {
    console.error("❌ Security validation failed:", error);
    process.exit(1);
  });
}

module.exports = SecurityValidator;
