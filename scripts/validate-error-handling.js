#!/usr/bin/env node

/**
 * Error Handling and Validation Test Script
 *
 * Tests the comprehensive error handling and validation system
 */

const ErrorLogger = require("./utils/error-logger");
const ServerValidator = require("./utils/server-validator");
const FallbackManager = require("./utils/fallback-manager");
const fs = require("fs-extra");
const path = require("path");

class ErrorHandlingValidator {
  constructor() {
    this.errorLogger = ErrorLogger.instance;
    this.serverValidator = new ServerValidator();
    this.fallbackManager = new FallbackManager();
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  /**
   * Run all error handling tests
   */
  async runTests() {
    console.log("🧪 Testing Error Handling and Validation System\n");

    const tests = [
      this.testErrorLogging.bind(this),
      this.testServerValidation.bind(this),
      this.testFallbackMechanisms.bind(this),
      this.testClientValidation.bind(this),
      this.testNotificationSystem.bind(this),
      this.testRecoveryProcedures.bind(this),
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error(`Test failed: ${error.message}`);
        this.recordTest(test.name, false, error.message);
      }
    }

    this.generateTestReport();
  }

  /**
   * Test error logging functionality
   */
  async testErrorLogging() {
    console.log("📝 Testing Error Logging...");

    // Test basic error logging
    const testError = new Error("Test error for validation");
    const errorEntry = await this.errorLogger.logError(
      "TEST_ERROR",
      testError,
      {
        testContext: "error-handling-validation",
      }
    );

    if (!errorEntry || !errorEntry.timestamp) {
      throw new Error("Error logging failed - no entry returned");
    }

    // Test warning logging
    const warningEntry = await this.errorLogger.logWarning(
      "TEST_WARNING",
      "Test warning message",
      {
        testContext: "error-handling-validation",
      }
    );

    if (!warningEntry || !warningEntry.timestamp) {
      throw new Error("Warning logging failed - no entry returned");
    }

    // Test validation error logging
    const validationEntry = await this.errorLogger.logValidationError(
      "test-file.md",
      ["Missing required field: title"],
      ["Excerpt too long"]
    );

    if (!validationEntry || validationEntry.errorCount !== 1) {
      throw new Error("Validation error logging failed");
    }

    // Test recent logs retrieval
    const recentLogs = await this.errorLogger.getRecentLogs(1);
    if (recentLogs.length === 0) {
      throw new Error("Recent logs retrieval failed");
    }

    this.recordTest("testErrorLogging", true, "All error logging tests passed");
    console.log("✅ Error logging tests passed\n");
  }

  /**
   * Test server-side validation
   */
  async testServerValidation() {
    console.log("🔍 Testing Server-side Validation...");

    // Test content validation
    const validationResult = await this.serverValidator.validateAllContent();

    if (!validationResult || typeof validationResult.success !== "boolean") {
      throw new Error("Server validation failed to return proper result");
    }

    // Test single file validation (if content exists)
    const contentDirs = [
      "content/projects",
      "content/blog",
      "content/services",
      "content/team",
    ];
    let testFileFound = false;

    for (const dir of contentDirs) {
      if (await fs.pathExists(dir)) {
        const files = await fs.readdir(dir);
        const mdFiles = files.filter(
          (file) => file.endsWith(".md") && file !== "README.md"
        );

        if (mdFiles.length > 0) {
          const testFile = path.join(dir, mdFiles[0]);
          const fileResult = await this.serverValidator.validateSingleFile(
            testFile
          );

          if (!fileResult || !fileResult.file) {
            throw new Error("Single file validation failed");
          }

          testFileFound = true;
          break;
        }
      }
    }

    if (!testFileFound) {
      console.warn(
        "⚠️  No content files found for single file validation test"
      );
    }

    // Test validation report generation
    const reportPath = path.join("assets", "data", "validation-report.json");
    if (await fs.pathExists(reportPath)) {
      const report = await fs.readJson(reportPath);
      if (!report.timestamp || !report.summary) {
        throw new Error("Validation report format is invalid");
      }
    }

    this.recordTest(
      "testServerValidation",
      true,
      "Server validation tests passed"
    );
    console.log("✅ Server validation tests passed\n");
  }

  /**
   * Test fallback mechanisms
   */
  async testFallbackMechanisms() {
    console.log("🛡️  Testing Fallback Mechanisms...");

    // Initialize fallback manager
    await this.fallbackManager.initialize();

    // Test backup creation
    const backupPath = await this.fallbackManager.createBackup("test-backup");
    if (!backupPath || !(await fs.pathExists(backupPath))) {
      throw new Error("Backup creation failed");
    }

    // Test backup listing
    const backups = await this.fallbackManager.getAvailableBackups();
    if (!Array.isArray(backups)) {
      throw new Error("Backup listing failed");
    }

    // Test fallback data usage
    try {
      const fallbackResult = await this.fallbackManager.useFallbackData({});
      if (!fallbackResult || typeof fallbackResult.success !== "boolean") {
        console.warn(
          "⚠️  Fallback data test failed - may be expected if no fallback data exists"
        );
      }
    } catch (error) {
      console.warn("⚠️  Fallback data test failed:", error.message);
    }

    // Test minimal data generation
    const minimalResult = await this.fallbackManager.generateMinimalData({});
    if (!minimalResult || !minimalResult.success) {
      throw new Error("Minimal data generation failed");
    }

    // Verify minimal data was created
    const dataFiles = [
      "projects.json",
      "blog.json",
      "services.json",
      "team.json",
      "site-settings.json",
    ];
    for (const file of dataFiles) {
      const filePath = path.join("assets", "data", file);
      if (!(await fs.pathExists(filePath))) {
        throw new Error(`Minimal data file not created: ${file}`);
      }
    }

    this.recordTest(
      "testFallbackMechanisms",
      true,
      "Fallback mechanism tests passed"
    );
    console.log("✅ Fallback mechanism tests passed\n");
  }

  /**
   * Test client-side validation
   */
  async testClientValidation() {
    console.log("🌐 Testing Client-side Validation...");

    // Check if validation config exists
    const validationConfigPath = "admin/validation-config.js";
    if (!(await fs.pathExists(validationConfigPath))) {
      throw new Error("Client validation config file not found");
    }

    // Read and basic syntax check
    const configContent = await fs.readFile(validationConfigPath, "utf8");

    // Check for required validation functions
    const requiredFunctions = [
      "validateEmail",
      "validatePhone",
      "validateURL",
      "validateDate",
      "validateRequired",
      "validateProject",
      "validateBlog",
      "validateService",
      "validateTeam",
    ];

    for (const func of requiredFunctions) {
      if (!configContent.includes(func)) {
        throw new Error(`Required validation function missing: ${func}`);
      }
    }

    // Check for error handling utilities
    const requiredUtilities = [
      "CMS_ERROR_HANDLER",
      "showValidationErrors",
      "clearValidationErrors",
      "CMS_AUTO_SAVE",
    ];

    for (const utility of requiredUtilities) {
      if (!configContent.includes(utility)) {
        throw new Error(`Required error handling utility missing: ${utility}`);
      }
    }

    // Check if validation config is included in admin interface
    const adminIndexPath = "admin/index.html";
    if (await fs.pathExists(adminIndexPath)) {
      const adminContent = await fs.readFile(adminIndexPath, "utf8");
      if (!adminContent.includes("validation-config.js")) {
        throw new Error("Validation config not included in admin interface");
      }
    }

    this.recordTest(
      "testClientValidation",
      true,
      "Client validation tests passed"
    );
    console.log("✅ Client validation tests passed\n");
  }

  /**
   * Test notification system
   */
  async testNotificationSystem() {
    console.log("📢 Testing Notification System...");

    // Test notification manager initialization
    const NotificationManager = require("./deployment-notifications");
    const notificationManager = new NotificationManager();

    if (!notificationManager) {
      throw new Error("Notification manager initialization failed");
    }

    // Test GitHub context parsing
    const context = NotificationManager.parseGitHubContext();
    if (!context || typeof context !== "object") {
      throw new Error("GitHub context parsing failed");
    }

    // Test notification methods exist
    const requiredMethods = [
      "notifyBuildSuccess",
      "notifyBuildFailure",
      "notifyDeploymentSuccess",
      "notifyRollback",
      "notifyHealthCheck",
    ];

    for (const method of requiredMethods) {
      if (typeof notificationManager[method] !== "function") {
        throw new Error(`Required notification method missing: ${method}`);
      }
    }

    this.recordTest(
      "testNotificationSystem",
      true,
      "Notification system tests passed"
    );
    console.log("✅ Notification system tests passed\n");
  }

  /**
   * Test recovery procedures
   */
  async testRecoveryProcedures() {
    console.log("🔄 Testing Recovery Procedures...");

    // Test emergency rollback system
    const EmergencyRollback = require("./emergency-rollback");
    const rollback = new EmergencyRollback();

    await rollback.initialize();

    // Test status retrieval
    const status = await rollback.getStatus();
    if (!status || typeof status !== "object") {
      throw new Error("Rollback status retrieval failed");
    }

    // Test backup listing
    const backupList = await rollback.listBackups();
    if (!Array.isArray(backupList)) {
      throw new Error("Rollback backup listing failed");
    }

    // Test required rollback methods exist
    const requiredMethods = [
      "createBackup",
      "rollbackToCommit",
      "rollbackToLastSuccessful",
      "restoreFromBackup",
    ];

    for (const method of requiredMethods) {
      if (typeof rollback[method] !== "function") {
        throw new Error(`Required rollback method missing: ${method}`);
      }
    }

    this.recordTest(
      "testRecoveryProcedures",
      true,
      "Recovery procedure tests passed"
    );
    console.log("✅ Recovery procedure tests passed\n");
  }

  /**
   * Record test result
   */
  recordTest(testName, passed, message) {
    this.testResults.tests.push({
      name: testName,
      passed,
      message,
      timestamp: new Date().toISOString(),
    });

    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    console.log("📊 Error Handling Validation Report");
    console.log("=".repeat(50));

    console.log(`\n📈 SUMMARY:`);
    console.log(`  ✅ Passed: ${this.testResults.passed}`);
    console.log(`  ❌ Failed: ${this.testResults.failed}`);
    console.log(
      `  📊 Success Rate: ${Math.round(
        (this.testResults.passed /
          (this.testResults.passed + this.testResults.failed)) *
          100
      )}%`
    );

    console.log(`\n📋 TEST RESULTS:`);
    this.testResults.tests.forEach((test) => {
      const status = test.passed ? "✅" : "❌";
      console.log(`  ${status} ${test.name}: ${test.message}`);
    });

    if (this.testResults.failed === 0) {
      console.log("\n🎉 All error handling and validation tests passed!");
    } else {
      console.log(
        `\n⚠️  ${this.testResults.failed} test(s) failed. Please review the implementation.`
      );
    }

    // Write detailed report
    this.writeTestReport();
  }

  /**
   * Write detailed test report to file
   */
  async writeTestReport() {
    try {
      const reportPath = path.join(
        "assets",
        "data",
        "error-handling-test-report.json"
      );
      await fs.ensureDir(path.dirname(reportPath));

      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          passed: this.testResults.passed,
          failed: this.testResults.failed,
          total: this.testResults.passed + this.testResults.failed,
          successRate: Math.round(
            (this.testResults.passed /
              (this.testResults.passed + this.testResults.failed)) *
              100
          ),
        },
        tests: this.testResults.tests,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
        },
      };

      await fs.writeJson(reportPath, report, { spaces: 2 });
      console.log(`\n📄 Detailed test report saved to: ${reportPath}`);
    } catch (error) {
      console.error("Failed to write test report:", error.message);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const validator = new ErrorHandlingValidator();
  validator.runTests().catch((error) => {
    console.error("❌ Test execution failed:", error);
    process.exit(1);
  });
}

module.exports = ErrorHandlingValidator;
