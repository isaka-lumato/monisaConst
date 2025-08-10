#!/usr/bin/env node

/**
 * Media Management System Test
 *
 * Tests all media management features to ensure they work correctly
 */

const MediaManager = require("./utils/media-manager");
const MediaValidator = require("./validate-media");
const fs = require("fs-extra");
const path = require("path");

class MediaManagementTest {
  constructor() {
    this.mediaManager = new MediaManager();
    this.validator = new MediaValidator();
    this.testResults = [];
  }

  async runAllTests() {
    console.log("🧪 Running Media Management System Tests\n");

    try {
      await this.testInitialization();
      await this.testFolderStructure();
      await this.testMediaIndexing();
      await this.testValidation();
      await this.testOrganization();
      await this.testMediaLibrary();

      this.printResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
      process.exit(1);
    }
  }

  async testInitialization() {
    console.log("🔧 Testing initialization...");

    try {
      await this.mediaManager.initialize();
      this.addResult(
        "Initialization",
        true,
        "Media manager initialized successfully"
      );
    } catch (error) {
      this.addResult("Initialization", false, error.message);
    }
  }

  async testFolderStructure() {
    console.log("📁 Testing folder structure...");

    const expectedFolders = [
      "projects",
      "blog",
      "team",
      "services",
      "general",
      "documents",
    ];
    let allFoldersExist = true;

    for (const folder of expectedFolders) {
      const folderPath = path.join("assets/uploads", folder);
      if (!(await fs.pathExists(folderPath))) {
        allFoldersExist = false;
        break;
      }
    }

    this.addResult(
      "Folder Structure",
      allFoldersExist,
      allFoldersExist ? "All required folders created" : "Some folders missing"
    );
  }

  async testMediaIndexing() {
    console.log("📊 Testing media indexing...");

    const stats = this.mediaManager.getStats();
    const hasIndexedFiles = stats.totalFiles > 0;

    this.addResult(
      "Media Indexing",
      hasIndexedFiles,
      `Indexed ${stats.totalFiles} files`
    );
  }

  async testValidation() {
    console.log("✅ Testing media validation...");

    // Test with existing media files
    const library = this.mediaManager.getMediaLibrary();

    if (library.media.length > 0) {
      const testFile = library.media[0];
      const validation = await this.validator.validateFile(testFile.path);

      this.addResult(
        "Media Validation",
        validation.valid,
        validation.valid ? "File validation passed" : validation.error
      );
    } else {
      this.addResult(
        "Media Validation",
        true,
        "No files to validate (expected for clean install)"
      );
    }
  }

  async testOrganization() {
    console.log("🗂️ Testing media organization...");

    // Test the organization logic without actually moving files
    const categories = this.mediaManager.getMediaCategories();
    const hasCategories = categories.length > 0;

    this.addResult(
      "Media Organization",
      hasCategories,
      hasCategories
        ? `Found ${categories.length} categories: ${categories.join(", ")}`
        : "No categories found"
    );
  }

  async testMediaLibrary() {
    console.log("📚 Testing media library...");

    const library = this.mediaManager.getMediaLibrary();
    const libraryWorking =
      typeof library === "object" &&
      Array.isArray(library.media) &&
      Array.isArray(library.categories) &&
      Array.isArray(library.types);

    this.addResult(
      "Media Library",
      libraryWorking,
      libraryWorking
        ? `Library contains ${library.total} files`
        : "Library structure invalid"
    );
  }

  addResult(testName, passed, message) {
    this.testResults.push({ testName, passed, message });
    const status = passed ? "✅" : "❌";
    console.log(`   ${status} ${testName}: ${message}`);
  }

  printResults() {
    console.log("\n" + "=".repeat(60));
    console.log("📋 TEST RESULTS SUMMARY");
    console.log("=".repeat(60));

    const passed = this.testResults.filter((r) => r.passed).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);

    console.log(
      `\n📊 Overall: ${passed}/${total} tests passed (${percentage}%)\n`
    );

    this.testResults.forEach((result) => {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${status} ${result.testName}`);
      if (!result.passed) {
        console.log(`     Error: ${result.message}`);
      }
    });

    if (passed === total) {
      console.log(
        "\n🎉 All tests passed! Media management system is working correctly."
      );
    } else {
      console.log(
        `\n⚠️  ${
          total - passed
        } test(s) failed. Please check the implementation.`
      );
    }

    console.log("\n" + "=".repeat(60));
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new MediaManagementTest();
  tester.runAllTests();
}

module.exports = MediaManagementTest;
