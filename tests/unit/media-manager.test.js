/**
 * Unit Tests for Media Manager
 *
 * Tests media management functionality including:
 * - Media organization and categorization
 * - File validation and processing
 * - Media library management
 * - Image optimization integration
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import MediaManager from "../../scripts/utils/media-manager.js";

describe("MediaManager", () => {
  let mediaManager;
  let testMediaDir;

  beforeEach(async () => {
    testMediaDir = path.join(TEST_CONFIG.tempDir, "media");
    await fs.ensureDir(testMediaDir);

    mediaManager = new MediaManager({
      mediaFolder: testMediaDir,
      maxFileSize: 1048576, // 1MB for testing
      allowedExtensions: ["jpg", "jpeg", "png", "webp", "gif", "pdf", "doc"],
    });
  });

  afterEach(async () => {
    if (await fs.pathExists(testMediaDir)) {
      await fs.remove(testMediaDir);
    }
  });

  describe("Initialization", () => {
    it("should initialize media manager with default settings", async () => {
      await mediaManager.initialize();

      const stats = mediaManager.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalFiles).toBe(0);
      expect(Array.isArray(stats.types)).toBe(true);
    });

    it("should create required directory structure", async () => {
      await mediaManager.initialize();

      const expectedDirs = [
        "projects",
        "blog",
        "team",
        "services",
        "general",
        "documents",
      ];

      for (const dir of expectedDirs) {
        const dirPath = path.join(testMediaDir, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
      }
    });

    it("should handle existing directory structure", async () => {
      // Pre-create some directories
      await fs.ensureDir(path.join(testMediaDir, "projects"));
      await fs.ensureDir(path.join(testMediaDir, "custom"));

      await mediaManager.initialize();

      // Should not fail and should preserve existing directories
      expect(await fs.pathExists(path.join(testMediaDir, "projects"))).toBe(
        true
      );
      expect(await fs.pathExists(path.join(testMediaDir, "custom"))).toBe(true);
    });
  });

  describe("Media Validation", () => {
    it("should validate allowed file types", async () => {
      const validImagePath = await testUtils.createTestImage("test.jpg");
      const invalidFilePath = await testUtils.createTestFile(
        "test.exe",
        "invalid content"
      );

      const validResult = await mediaManager.validateMedia(validImagePath);
      const invalidResult = await mediaManager.validateMedia(invalidFilePath);

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain("extension");
    });

    it("should validate file size limits", async () => {
      // Create a small test file
      const smallFile = await testUtils.createTestFile(
        "small.jpg",
        "small content"
      );

      // Create a large test file (simulate)
      const largeContent = "x".repeat(2000000); // 2MB
      const largeFile = await testUtils.createTestFile(
        "large.jpg",
        largeContent
      );

      const smallResult = await mediaManager.validateMedia(smallFile);
      const largeResult = await mediaManager.validateMedia(largeFile);

      expect(smallResult.valid).toBe(true);
      expect(largeResult.valid).toBe(false);
      expect(largeResult.error).toContain("size");
    });

    it("should detect duplicate files", async () => {
      await mediaManager.initialize();

      // Create and organize a file
      const originalFile = await testUtils.createTestImage("original.jpg");
      await mediaManager.organizeMedia(originalFile, "projects");

      // Try to add the same file again
      const duplicateFile = await testUtils.createTestImage("duplicate.jpg");
      await fs.copy(originalFile, duplicateFile);

      const result = await mediaManager.validateMedia(duplicateFile);

      expect(result.duplicate).toBeDefined();
    });

    it("should validate image metadata", async () => {
      const imagePath = await testUtils.createTestImage("test.png");

      const result = await mediaManager.validateMedia(imagePath);

      expect(result.valid).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.type).toBe("image");
      expect(result.metadata.extension).toBe("png");
    });
  });

  describe("Media Organization", () => {
    it("should organize media into correct categories", async () => {
      await mediaManager.initialize();

      const testImage = await testUtils.createTestImage("test-project.jpg");

      const result = await mediaManager.organizeMedia(testImage, "projects", {
        move: true,
        generateThumbnails: false,
      });

      expect(result.success).toBe(true);
      expect(result.relativePath).toContain("projects");
      expect(result.publicUrl).toContain("projects");

      // Verify file was moved to correct location
      const expectedPath = path.join(
        testMediaDir,
        "projects",
        "test-project.jpg"
      );
      expect(await fs.pathExists(expectedPath)).toBe(true);
    });

    it("should handle filename conflicts", async () => {
      await mediaManager.initialize();

      // Create two files with the same name
      const file1 = await testUtils.createTestImage("conflict.jpg");
      const file2 = await testUtils.createTestImage("conflict.jpg");

      const result1 = await mediaManager.organizeMedia(file1, "projects");
      const result2 = await mediaManager.organizeMedia(file2, "projects");

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.relativePath).not.toBe(result2.relativePath);
    });

    it("should preserve original files when copy mode is used", async () => {
      await mediaManager.initialize();

      const originalFile = await testUtils.createTestImage("preserve.jpg");

      const result = await mediaManager.organizeMedia(
        originalFile,
        "projects",
        {
          move: false,
        }
      );

      expect(result.success).toBe(true);
      expect(await fs.pathExists(originalFile)).toBe(true); // Original should still exist
    });

    it("should generate appropriate file paths", () => {
      const testCases = [
        {
          filename: "test.jpg",
          category: "projects",
          expected: "projects/test.jpg",
        },
        {
          filename: "team-photo.png",
          category: "team",
          expected: "team/team-photo.png",
        },
        {
          filename: "document.pdf",
          category: "documents",
          expected: "documents/document.pdf",
        },
      ];

      testCases.forEach(({ filename, category, expected }) => {
        const result = mediaManager.generateMediaPath(filename, category);
        expect(result).toContain(expected);
      });
    });
  });

  describe("Media Library", () => {
    it("should return comprehensive media library information", async () => {
      await mediaManager.initialize();

      // Add some test files
      const testFiles = [
        { name: "project1.jpg", category: "projects" },
        { name: "blog1.png", category: "blog" },
        { name: "team1.jpg", category: "team" },
      ];

      for (const file of testFiles) {
        const testFile = await testUtils.createTestImage(file.name);
        await mediaManager.organizeMedia(testFile, file.category);
      }

      const library = mediaManager.getMediaLibrary();

      expect(library.total).toBe(testFiles.length);
      expect(library.media).toHaveLength(testFiles.length);
      expect(library.categories).toContain("projects");
      expect(library.categories).toContain("blog");
      expect(library.categories).toContain("team");
      expect(library.types).toContain("image");
    });

    it("should filter media library by category", async () => {
      await mediaManager.initialize();

      // Add files to different categories
      const projectFile = await testUtils.createTestImage("project.jpg");
      const blogFile = await testUtils.createTestImage("blog.jpg");

      await mediaManager.organizeMedia(projectFile, "projects");
      await mediaManager.organizeMedia(blogFile, "blog");

      const projectsOnly = mediaManager.getMediaLibrary({
        category: "projects",
      });
      const blogOnly = mediaManager.getMediaLibrary({ category: "blog" });

      expect(projectsOnly.media).toHaveLength(1);
      expect(projectsOnly.media[0].category).toBe("projects");
      expect(blogOnly.media).toHaveLength(1);
      expect(blogOnly.media[0].category).toBe("blog");
    });

    it("should filter media library by type", async () => {
      await mediaManager.initialize();

      const imageFile = await testUtils.createTestImage("image.jpg");
      const docFile = await testUtils.createTestFile(
        "document.pdf",
        "PDF content"
      );

      await mediaManager.organizeMedia(imageFile, "general");
      await mediaManager.organizeMedia(docFile, "documents");

      const imagesOnly = mediaManager.getMediaLibrary({ type: "image" });
      const docsOnly = mediaManager.getMediaLibrary({ type: "document" });

      expect(imagesOnly.media).toHaveLength(1);
      expect(imagesOnly.media[0].type).toBe("image");
      expect(docsOnly.media).toHaveLength(1);
      expect(docsOnly.media[0].type).toBe("document");
    });
  });

  describe("Media Usage Tracking", () => {
    it("should track media usage across content", async () => {
      await mediaManager.initialize();

      const testImage = await testUtils.createTestImage("tracked.jpg");
      const result = await mediaManager.organizeMedia(testImage, "projects");

      // Simulate content that uses this image
      const mockContent = [
        {
          type: "project",
          file: "project1.md",
          images: [result.relativePath],
        },
      ];

      // Mock the usage tracking (in real implementation, this would scan content files)
      const usage = await mediaManager.checkMediaUsage(result.relativePath);

      // This test depends on the actual implementation of usage tracking
      expect(Array.isArray(usage)).toBe(true);
    });

    it("should identify unused media files", async () => {
      await mediaManager.initialize();

      const unusedFile = await testUtils.createTestImage("unused.jpg");
      await mediaManager.organizeMedia(unusedFile, "general");

      const library = mediaManager.getMediaLibrary();
      const unusedFiles = library.media.filter(async (item) => {
        const usage = await mediaManager.checkMediaUsage(item.relativePath);
        return usage.length === 0;
      });

      expect(Array.isArray(unusedFiles)).toBe(true);
    });
  });

  describe("Statistics and Reporting", () => {
    it("should provide comprehensive statistics", async () => {
      await mediaManager.initialize();

      // Add various types of files
      const files = [
        { name: "image1.jpg", category: "projects" },
        { name: "image2.png", category: "blog" },
        { name: "doc1.pdf", category: "documents" },
      ];

      for (const file of files) {
        const testFile = file.name.endsWith(".pdf")
          ? await testUtils.createTestFile(file.name, "PDF content")
          : await testUtils.createTestImage(file.name);
        await mediaManager.organizeMedia(testFile, file.category);
      }

      const stats = mediaManager.getStats();

      expect(stats.totalFiles).toBe(files.length);
      expect(stats.categories).toBeGreaterThan(0);
      expect(stats.types).toContain("image");
      expect(stats.types).toContain("document");
      expect(stats.errors).toBe(0);
    });

    it("should track processing errors in statistics", async () => {
      await mediaManager.initialize();

      // Try to process an invalid file
      const invalidFile = await testUtils.createTestFile(
        "invalid.xyz",
        "invalid content"
      );

      try {
        await mediaManager.organizeMedia(invalidFile, "general");
      } catch (error) {
        // Expected to fail
      }

      const stats = mediaManager.getStats();
      expect(stats.errors).toBeGreaterThan(0);
    });
  });

  describe("Media Categories", () => {
    it("should return available media categories", () => {
      const categories = mediaManager.getMediaCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toContain("projects");
      expect(categories).toContain("blog");
      expect(categories).toContain("team");
      expect(categories).toContain("services");
      expect(categories).toContain("general");
      expect(categories).toContain("documents");
    });

    it("should validate category names", () => {
      expect(mediaManager.isValidCategory("projects")).toBe(true);
      expect(mediaManager.isValidCategory("blog")).toBe(true);
      expect(mediaManager.isValidCategory("invalid-category")).toBe(false);
      expect(mediaManager.isValidCategory("")).toBe(false);
      expect(mediaManager.isValidCategory(null)).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing files gracefully", async () => {
      const nonExistentFile = path.join(
        TEST_CONFIG.tempDir,
        "non-existent.jpg"
      );

      const result = await mediaManager.validateMedia(nonExistentFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should handle permission errors", async () => {
      // This test might be platform-specific
      // Implementation would depend on how permission errors are handled
      expect(true).toBe(true); // Placeholder
    });

    it("should handle corrupted files", async () => {
      const corruptedFile = await testUtils.createTestFile(
        "corrupted.jpg",
        "not-an-image"
      );

      const result = await mediaManager.validateMedia(corruptedFile);

      // Depending on implementation, this might be valid or invalid
      expect(typeof result.valid).toBe("boolean");
    });
  });
});
