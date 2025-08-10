/**
 * Test Setup Configuration
 *
 * Global setup for all tests including mocks, utilities, and environment configuration
 */

import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";

// Test environment configuration
const TEST_CONFIG = {
  testDataDir: "tests/fixtures",
  tempDir: "tests/temp",
  backupDir: "tests/backups",
  timeout: 30000,
};

// Global test utilities
global.TEST_CONFIG = TEST_CONFIG;

// Setup test directories
beforeAll(async () => {
  console.log("🔧 Setting up test environment...");

  // Ensure test directories exist
  await fs.ensureDir(TEST_CONFIG.testDataDir);
  await fs.ensureDir(TEST_CONFIG.tempDir);
  await fs.ensureDir(TEST_CONFIG.backupDir);

  // Create backup of existing data if it exists
  const dataDir = "assets/data";
  if (await fs.pathExists(dataDir)) {
    const backupPath = path.join(
      TEST_CONFIG.backupDir,
      `data-backup-${Date.now()}`
    );
    await fs.copy(dataDir, backupPath);
    console.log(`📦 Backed up existing data to ${backupPath}`);
  }
});

// Cleanup after all tests
afterAll(async () => {
  console.log("🧹 Cleaning up test environment...");

  // Clean up temp directory
  if (await fs.pathExists(TEST_CONFIG.tempDir)) {
    await fs.remove(TEST_CONFIG.tempDir);
  }

  // Restore original data if backup exists
  const backups = await fs.readdir(TEST_CONFIG.backupDir).catch(() => []);
  const latestBackup = backups
    .filter((name) => name.startsWith("data-backup-"))
    .sort()
    .pop();

  if (latestBackup) {
    const backupPath = path.join(TEST_CONFIG.backupDir, latestBackup);
    const dataDir = "assets/data";

    if (await fs.pathExists(backupPath)) {
      await fs.remove(dataDir);
      await fs.copy(backupPath, dataDir);
      console.log(`🔄 Restored data from ${backupPath}`);
    }
  }
});

// Setup for each test
beforeEach(async () => {
  // Clear temp directory for each test
  if (await fs.pathExists(TEST_CONFIG.tempDir)) {
    await fs.emptyDir(TEST_CONFIG.tempDir);
  }
});

// Cleanup after each test
afterEach(async () => {
  // Any per-test cleanup can go here
});

// Test utilities
global.testUtils = {
  /**
   * Create a temporary test file
   */
  async createTestFile(filename, content) {
    const filePath = path.join(TEST_CONFIG.tempDir, filename);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content);
    return filePath;
  },

  /**
   * Create test markdown file with frontmatter
   */
  async createTestMarkdown(filename, frontmatter, content = "") {
    const yamlFrontmatter =
      Object.keys(frontmatter).length > 0
        ? `---\n${Object.entries(frontmatter)
            .map(
              ([key, value]) =>
                `${key}: ${typeof value === "string" ? `"${value}"` : value}`
            )
            .join("\n")}\n---\n\n`
        : "";

    const fullContent = yamlFrontmatter + content;
    return await this.createTestFile(filename, fullContent);
  },

  /**
   * Create test image file (placeholder)
   */
  async createTestImage(filename, width = 100, height = 100) {
    // Create a simple test image buffer (1x1 PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const filePath = path.join(TEST_CONFIG.tempDir, filename);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, pngBuffer);
    return filePath;
  },

  /**
   * Wait for a specified amount of time
   */
  async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Check if file exists and has expected content
   */
  async verifyFileContent(filePath, expectedContent) {
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const content = await fs.readFile(filePath, "utf8");
    if (typeof expectedContent === "string") {
      return content.includes(expectedContent);
    } else if (expectedContent instanceof RegExp) {
      return expectedContent.test(content);
    }
    return content === expectedContent;
  },

  /**
   * Get file stats
   */
  async getFileStats(filePath) {
    if (!(await fs.pathExists(filePath))) {
      return null;
    }
    return await fs.stat(filePath);
  },
};

console.log("✅ Test setup completed");
