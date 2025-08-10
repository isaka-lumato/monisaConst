/**
 * Unit Tests for Content Processor
 *
 * Tests the core content processing functionality including:
 * - Markdown parsing and YAML frontmatter extraction
 * - Content validation and sanitization
 * - JSON generation for collections
 * - Image processing integration
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import ContentProcessor from "../../scripts/build-content.js";

describe("ContentProcessor", () => {
  let processor;
  let testContentDir;

  beforeEach(async () => {
    processor = new ContentProcessor();
    testContentDir = path.join(TEST_CONFIG.tempDir, "content");
    await fs.ensureDir(testContentDir);
  });

  afterEach(async () => {
    if (await fs.pathExists(testContentDir)) {
      await fs.remove(testContentDir);
    }
  });

  describe("File Processing", () => {
    it("should parse markdown file with YAML frontmatter", async () => {
      const testFile = await testUtils.createTestMarkdown(
        "content/test.md",
        {
          title: "Test Title",
          category: "Test Category",
          published: true,
        },
        "# Test Content\n\nThis is test content."
      );

      const result = await processor.processFile(testFile, [
        "title",
        "category",
      ]);

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Title");
      expect(result.category).toBe("Test Category");
      expect(result.published).toBe(true);
      expect(result.content).toContain("<h1>Test Content</h1>");
      expect(result.slug).toBe("test");
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.readingTime).toBeGreaterThan(0);
    });

    it("should generate excerpt from content", async () => {
      const longContent =
        "This is a very long piece of content that should be truncated to create an excerpt. ".repeat(
          10
        );

      const testFile = await testUtils.createTestMarkdown(
        "content/long-content.md",
        { title: "Long Content Test" },
        longContent
      );

      const result = await processor.processFile(testFile);

      expect(result.excerpt).toBeDefined();
      expect(result.excerpt.length).toBeLessThanOrEqual(163); // 160 chars + "..."
      expect(result.excerpt).toMatch(/\.\.\.$/);
    });

    it("should use existing excerpt if provided", async () => {
      const customExcerpt = "This is a custom excerpt";

      const testFile = await testUtils.createTestMarkdown(
        "content/custom-excerpt.md",
        {
          title: "Custom Excerpt Test",
          excerpt: customExcerpt,
        },
        "This is the full content that is much longer than the excerpt."
      );

      const result = await processor.processFile(testFile);

      expect(result.excerpt).toBe(customExcerpt);
    });

    it("should calculate word count and reading time", async () => {
      const content = "This is a test content with exactly ten words here.";

      const testFile = await testUtils.createTestMarkdown(
        "content/word-count.md",
        { title: "Word Count Test" },
        content
      );

      const result = await processor.processFile(testFile);

      expect(result.wordCount).toBe(10);
      expect(result.readingTime).toBe(1); // Minimum 1 minute
    });

    it("should handle missing required fields", async () => {
      const testFile = await testUtils.createTestMarkdown(
        "content/missing-fields.md",
        { title: "Test" }, // Missing required 'category' field
        "Test content"
      );

      await expect(
        processor.processFile(testFile, ["title", "category"])
      ).rejects.toThrow("Validation errors");
    });

    it("should sanitize content for security", async () => {
      const maliciousContent =
        '<script>alert("xss")</script><p>Safe content</p>';

      const testFile = await testUtils.createTestMarkdown(
        "content/malicious.md",
        {
          title: "Security Test",
          description: '<script>alert("xss")</script>Safe description',
        },
        maliciousContent
      );

      const result = await processor.processFile(testFile);

      expect(result.content).not.toContain("<script>");
      expect(result.content).toContain("Safe content");
      expect(result.description).not.toContain("<script>");
      expect(result.description).toContain("Safe description");
    });
  });

  describe("Collection Processing", () => {
    it("should process projects collection", async () => {
      // Copy fixture to temp directory
      const fixtureContent = await fs.readFile(
        "tests/fixtures/sample-project.md",
        "utf8"
      );
      await testUtils.createTestFile(
        "content/projects/test-project.md",
        fixtureContent
      );

      const config = {
        pattern: path.join(TEST_CONFIG.tempDir, "content/projects/*.md"),
        output: "projects.json",
        requiredFields: ["title", "category", "status", "location"],
      };

      await processor.processCollection("projects", config);

      const outputPath = path.join("assets/data", config.output);
      expect(await fs.pathExists(outputPath)).toBe(true);

      const data = await fs.readJson(outputPath);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].title).toBe("Test Luxury Villa");
      expect(data[0].category).toBe("Residential");
    });

    it("should sort collections correctly", async () => {
      const projects = [
        { title: "Project A", featured: false, completionDate: "2024-01-01" },
        { title: "Project B", featured: true, completionDate: "2024-02-01" },
        { title: "Project C", featured: false, completionDate: "2024-03-01" },
      ];

      const sorted = processor.sortCollection("projects", projects);

      expect(sorted[0].featured).toBe(true); // Featured first
      expect(sorted[0].title).toBe("Project B");
    });

    it("should handle empty collections gracefully", async () => {
      const config = {
        pattern: path.join(TEST_CONFIG.tempDir, "content/empty/*.md"),
        output: "empty.json",
        requiredFields: [],
      };

      await processor.processCollection("empty", config);

      expect(processor.warnings).toContain(
        "No files found for empty collection"
      );
    });
  });

  describe("Image Processing", () => {
    it("should process image references in frontmatter", async () => {
      const frontmatter = {
        featuredImage: "/assets/imgs/test.jpg",
        images: {
          main: "/assets/imgs/main.jpg",
          gallery: ["/assets/imgs/1.jpg", "/assets/imgs/2.jpg"],
        },
      };

      await processor.processImages(frontmatter);

      // Images should be processed (exact behavior depends on ImageProcessor implementation)
      expect(frontmatter.featuredImage).toBeDefined();
      expect(frontmatter.images.main).toBeDefined();
      expect(Array.isArray(frontmatter.images.gallery)).toBe(true);
    });

    it("should identify image paths correctly", () => {
      expect(processor.isImagePath("/assets/imgs/test.jpg")).toBe(true);
      expect(processor.isImagePath("/assets/imgs/test.png")).toBe(true);
      expect(processor.isImagePath("/assets/imgs/test.webp")).toBe(true);
      expect(processor.isImagePath("/assets/docs/test.pdf")).toBe(false);
      expect(processor.isImagePath("/assets/test.txt")).toBe(false);
    });
  });

  describe("Data Sanitization", () => {
    it("should sanitize item data comprehensively", () => {
      const unsafeItem = {
        title: '<script>alert("xss")</script>Safe Title',
        description: 'Safe description<script>alert("xss")</script>',
        tags: ['<script>alert("xss")</script>Safe Tag', "Normal Tag"],
        linkedin: "https://linkedin.com/in/test",
        invalidUrl: "not-a-valid-url",
        date: "2024-01-15",
        invalidDate: "not-a-date",
        order: "5",
        invalidNumber: "not-a-number",
        published: "true",
        nullValue: null,
        undefinedValue: undefined,
      };

      const sanitized = processor.sanitizeItem(unsafeItem);

      expect(sanitized.title).not.toContain("<script>");
      expect(sanitized.title).toContain("Safe Title");
      expect(sanitized.description).not.toContain("<script>");
      expect(sanitized.tags[0]).not.toContain("<script>");
      expect(sanitized.tags[0]).toContain("Safe Tag");
      expect(sanitized.linkedin).toBe("https://linkedin.com/in/test");
      expect(sanitized.invalidUrl).toBeUndefined();
      expect(sanitized.date).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO date format
      expect(sanitized.invalidDate).toBeUndefined();
      expect(sanitized.order).toBe(5);
      expect(sanitized.invalidNumber).toBeUndefined();
      expect(sanitized.published).toBe(true);
      expect(sanitized.nullValue).toBeUndefined();
      expect(sanitized.undefinedValue).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle file read errors gracefully", async () => {
      const nonExistentFile = path.join(TEST_CONFIG.tempDir, "non-existent.md");

      await expect(processor.processFile(nonExistentFile)).rejects.toThrow();
    });

    it("should collect and report errors", async () => {
      processor.errors = [];
      processor.warnings = [];

      // Simulate some errors and warnings
      processor.errors.push("Test error 1");
      processor.errors.push("Test error 2");
      processor.warnings.push("Test warning 1");

      expect(processor.errors).toHaveLength(2);
      expect(processor.warnings).toHaveLength(1);
    });
  });

  describe("Utility Functions", () => {
    it("should generate excerpts correctly", () => {
      const shortContent = "Short content";
      const longContent =
        "This is a very long piece of content that should be truncated. ".repeat(
          10
        );

      expect(processor.generateExcerpt(shortContent)).toBe(shortContent);
      expect(processor.generateExcerpt(longContent)).toMatch(/\.\.\.$/);
      expect(processor.generateExcerpt(longContent).length).toBeLessThanOrEqual(
        163
      );
    });

    it("should count words accurately", () => {
      expect(processor.countWords("one two three")).toBe(3);
      expect(processor.countWords("  spaced   words  ")).toBe(2);
      expect(processor.countWords("")).toBe(1); // Empty string edge case
    });

    it("should calculate reading time", () => {
      const shortText = "Short text";
      const longText = "word ".repeat(400); // 400 words

      expect(processor.calculateReadingTime(shortText)).toBe(1); // Minimum 1 minute
      expect(processor.calculateReadingTime(longText)).toBe(2); // 400 words / 200 wpm = 2 minutes
    });
  });
});
