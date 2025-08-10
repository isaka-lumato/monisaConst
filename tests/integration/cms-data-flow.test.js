/**
 * Integration Tests for CMS to Website Data Flow
 *
 * Tests the complete flow from content creation to website display:
 * - Content processing pipeline
 * - JSON generation and consumption
 * - Image processing integration
 * - Build process integration
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import ContentProcessor from "../../scripts/build-content.js";

describe("CMS Data Flow Integration", () => {
  let processor;
  let testContentDir;
  let testOutputDir;

  beforeEach(async () => {
    testContentDir = path.join(TEST_CONFIG.tempDir, "content");
    testOutputDir = path.join(TEST_CONFIG.tempDir, "assets/data");

    await fs.ensureDir(testContentDir);
    await fs.ensureDir(testOutputDir);

    processor = new ContentProcessor();

    // Override processor configuration for testing
    processor.CONFIG = {
      contentDir: testContentDir,
      outputDir: testOutputDir,
      uploadsDir: path.join(TEST_CONFIG.tempDir, "assets/uploads"),
      collections: {
        projects: {
          pattern: path.join(testContentDir, "projects/*.md"),
          output: "projects.json",
          requiredFields: ["title", "category", "status", "location"],
        },
        blog: {
          pattern: path.join(testContentDir, "blog/*.md"),
          output: "blog.json",
          requiredFields: ["title", "date", "author", "published"],
        },
        services: {
          pattern: path.join(testContentDir, "services/*.md"),
          output: "services.json",
          requiredFields: ["title", "category", "description"],
        },
        team: {
          pattern: path.join(testContentDir, "team/*.md"),
          output: "team.json",
          requiredFields: ["name", "position"],
        },
      },
    };
  });

  afterEach(async () => {
    if (await fs.pathExists(testContentDir)) {
      await fs.remove(testContentDir);
    }
    if (await fs.pathExists(testOutputDir)) {
      await fs.remove(testOutputDir);
    }
  });

  describe("Complete Content Processing Pipeline", () => {
    it("should process all collections and generate JSON files", async () => {
      // Create test content for all collections
      await createTestContent();

      // Process all content
      await processor.process();

      // Verify all JSON files were created
      const expectedFiles = [
        "projects.json",
        "blog.json",
        "services.json",
        "team.json",
      ];

      for (const file of expectedFiles) {
        const filePath = path.join(testOutputDir, file);
        expect(await fs.pathExists(filePath)).toBe(true);

        const data = await fs.readJson(filePath);
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
      }
    });

    it("should maintain data consistency across processing runs", async () => {
      await createTestContent();

      // First processing run
      await processor.process();
      const firstRun = await readAllGeneratedData();

      // Second processing run (should produce identical results)
      const processor2 = new ContentProcessor();
      processor2.CONFIG = processor.CONFIG;
      await processor2.process();
      const secondRun = await readAllGeneratedData();

      // Compare results
      expect(firstRun.projects).toEqual(secondRun.projects);
      expect(firstRun.blog).toEqual(secondRun.blog);
      expect(firstRun.services).toEqual(secondRun.services);
      expect(firstRun.team).toEqual(secondRun.team);
    });

    it("should handle incremental content updates", async () => {
      await createTestContent();
      await processor.process();

      // Add new content
      await testUtils.createTestMarkdown(
        path.join(testContentDir, "projects/new-project.md"),
        {
          title: "New Project",
          category: "Commercial",
          status: "In Progress",
          location: "New Location",
        },
        "New project content"
      );

      // Process again
      await processor.process();

      const projectsData = await fs.readJson(
        path.join(testOutputDir, "projects.json")
      );
      expect(projectsData).toHaveLength(2); // Original + new
      expect(projectsData.some((p) => p.title === "New Project")).toBe(true);
    });

    it("should handle content deletion", async () => {
      await createTestContent();
      await processor.process();

      // Remove a content file
      const projectFile = path.join(testContentDir, "projects/test-project.md");
      await fs.remove(projectFile);

      // Process again
      await processor.process();

      const projectsData = await fs.readJson(
        path.join(testOutputDir, "projects.json")
      );
      expect(projectsData).toHaveLength(0);
    });
  });

  describe("Data Structure Validation", () => {
    it("should generate JSON with correct structure for projects", async () => {
      await createTestContent();
      await processor.process();

      const projectsData = await fs.readJson(
        path.join(testOutputDir, "projects.json")
      );
      const project = projectsData[0];

      // Verify required fields
      expect(project.slug).toBeDefined();
      expect(project.title).toBeDefined();
      expect(project.category).toBeDefined();
      expect(project.status).toBeDefined();
      expect(project.location).toBeDefined();
      expect(project.content).toBeDefined();

      // Verify computed fields
      expect(project.excerpt).toBeDefined();
      expect(project.wordCount).toBeGreaterThan(0);
      expect(project.readingTime).toBeGreaterThan(0);
      expect(project.lastModified).toBeDefined();

      // Verify data types
      expect(typeof project.title).toBe("string");
      expect(typeof project.featured).toBe("boolean");
      expect(typeof project.wordCount).toBe("number");
    });

    it("should generate JSON with correct structure for blog posts", async () => {
      await createTestContent();
      await processor.process();

      const blogData = await fs.readJson(path.join(testOutputDir, "blog.json"));
      const post = blogData[0];

      expect(post.slug).toBeDefined();
      expect(post.title).toBeDefined();
      expect(post.date).toBeDefined();
      expect(post.author).toBeDefined();
      expect(post.published).toBeDefined();
      expect(post.content).toBeDefined();

      // Verify date format
      expect(new Date(post.date).toISOString()).toBe(post.date);

      // Verify boolean type
      expect(typeof post.published).toBe("boolean");
    });

    it("should generate JSON with correct structure for services", async () => {
      await createTestContent();
      await processor.process();

      const servicesData = await fs.readJson(
        path.join(testOutputDir, "services.json")
      );
      const service = servicesData[0];

      expect(service.slug).toBeDefined();
      expect(service.title).toBeDefined();
      expect(service.category).toBeDefined();
      expect(service.description).toBeDefined();
      expect(service.content).toBeDefined();

      // Verify arrays
      if (service.features) {
        expect(Array.isArray(service.features)).toBe(true);
      }
    });

    it("should generate JSON with correct structure for team members", async () => {
      await createTestContent();
      await processor.process();

      const teamData = await fs.readJson(path.join(testOutputDir, "team.json"));
      const member = teamData[0];

      expect(member.slug).toBeDefined();
      expect(member.name).toBeDefined();
      expect(member.position).toBeDefined();
      expect(member.content).toBeDefined();

      // Verify nested objects
      if (member.socialLinks) {
        expect(typeof member.socialLinks).toBe("object");
      }
    });
  });

  describe("Content Sorting and Ordering", () => {
    it("should sort blog posts by date (newest first)", async () => {
      // Create multiple blog posts with different dates
      const posts = [
        { title: "Old Post", date: "2024-01-01" },
        { title: "New Post", date: "2024-03-01" },
        { title: "Middle Post", date: "2024-02-01" },
      ];

      for (const [index, post] of posts.entries()) {
        await testUtils.createTestMarkdown(
          path.join(testContentDir, `blog/post-${index}.md`),
          {
            ...post,
            author: "Test Author",
            published: true,
          },
          "Post content"
        );
      }

      await processor.process();

      const blogData = await fs.readJson(path.join(testOutputDir, "blog.json"));

      expect(blogData[0].title).toBe("New Post");
      expect(blogData[1].title).toBe("Middle Post");
      expect(blogData[2].title).toBe("Old Post");
    });

    it("should sort projects with featured items first", async () => {
      const projects = [
        {
          title: "Regular Project",
          featured: false,
          completionDate: "2024-03-01",
        },
        {
          title: "Featured Project",
          featured: true,
          completionDate: "2024-01-01",
        },
        {
          title: "Another Regular",
          featured: false,
          completionDate: "2024-02-01",
        },
      ];

      for (const [index, project] of projects.entries()) {
        await testUtils.createTestMarkdown(
          path.join(testContentDir, `projects/project-${index}.md`),
          {
            ...project,
            category: "Residential",
            status: "Completed",
            location: "Test Location",
          },
          "Project content"
        );
      }

      await processor.process();

      const projectsData = await fs.readJson(
        path.join(testOutputDir, "projects.json")
      );

      expect(projectsData[0].title).toBe("Featured Project");
      expect(projectsData[0].featured).toBe(true);
    });

    it("should sort services and team by order field", async () => {
      const services = [
        { title: "Service C", order: 3 },
        { title: "Service A", order: 1 },
        { title: "Service B", order: 2 },
      ];

      for (const [index, service] of services.entries()) {
        await testUtils.createTestMarkdown(
          path.join(testContentDir, `services/service-${index}.md`),
          {
            ...service,
            category: "Construction",
            description: "Service description",
          },
          "Service content"
        );
      }

      await processor.process();

      const servicesData = await fs.readJson(
        path.join(testOutputDir, "services.json")
      );

      expect(servicesData[0].title).toBe("Service A");
      expect(servicesData[1].title).toBe("Service B");
      expect(servicesData[2].title).toBe("Service C");
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle malformed markdown files gracefully", async () => {
      // Create a file with invalid YAML frontmatter
      await testUtils.createTestFile(
        path.join(testContentDir, "projects/invalid.md"),
        "---\ninvalid: yaml: content:\n---\nContent"
      );

      // Should not throw, but should log errors
      await expect(processor.process()).resolves.not.toThrow();
      expect(processor.errors.length).toBeGreaterThan(0);
    });

    it("should continue processing other files when one fails", async () => {
      // Create one valid and one invalid file
      await testUtils.createTestMarkdown(
        path.join(testContentDir, "projects/valid.md"),
        {
          title: "Valid Project",
          category: "Residential",
          status: "Completed",
          location: "Test Location",
        },
        "Valid content"
      );

      await testUtils.createTestFile(
        path.join(testContentDir, "projects/invalid.md"),
        "Invalid content without frontmatter"
      );

      await processor.process();

      const projectsData = await fs.readJson(
        path.join(testOutputDir, "projects.json")
      );
      expect(projectsData).toHaveLength(1);
      expect(projectsData[0].title).toBe("Valid Project");
    });

    it("should handle missing required fields appropriately", async () => {
      await testUtils.createTestMarkdown(
        path.join(testContentDir, "projects/incomplete.md"),
        {
          title: "Incomplete Project",
          // Missing required fields: category, status, location
        },
        "Project content"
      );

      await processor.process();

      // Should have errors but not crash
      expect(processor.errors.length).toBeGreaterThan(0);

      const projectsData = await fs.readJson(
        path.join(testOutputDir, "projects.json")
      );
      expect(projectsData).toHaveLength(0); // Invalid item should be excluded
    });
  });

  describe("Performance and Optimization", () => {
    it("should process large numbers of files efficiently", async () => {
      const startTime = Date.now();

      // Create 50 test files
      for (let i = 0; i < 50; i++) {
        await testUtils.createTestMarkdown(
          path.join(testContentDir, `blog/post-${i}.md`),
          {
            title: `Post ${i}`,
            date: `2024-01-${String(i + 1).padStart(2, "0")}`,
            author: "Test Author",
            published: true,
          },
          `Content for post ${i}`
        );
      }

      await processor.process();

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process 50 files in reasonable time (less than 10 seconds)
      expect(processingTime).toBeLessThan(10000);

      const blogData = await fs.readJson(path.join(testOutputDir, "blog.json"));
      expect(blogData).toHaveLength(50);
    });

    it("should handle concurrent processing safely", async () => {
      await createTestContent();

      // Run multiple processors concurrently
      const processors = [
        new ContentProcessor(),
        new ContentProcessor(),
        new ContentProcessor(),
      ];

      processors.forEach((p) => (p.CONFIG = processor.CONFIG));

      const promises = processors.map((p) => p.process());
      await Promise.all(promises);

      // All should complete successfully
      const projectsData = await fs.readJson(
        path.join(testOutputDir, "projects.json")
      );
      expect(Array.isArray(projectsData)).toBe(true);
    });
  });

  // Helper functions
  async function createTestContent() {
    // Create test project
    await testUtils.createTestMarkdown(
      path.join(testContentDir, "projects/test-project.md"),
      {
        title: "Test Project",
        category: "Residential",
        status: "Completed",
        location: "Test Location",
        featured: true,
      },
      "Test project content"
    );

    // Create test blog post
    await testUtils.createTestMarkdown(
      path.join(testContentDir, "blog/test-post.md"),
      {
        title: "Test Post",
        date: "2024-01-15",
        author: "Test Author",
        published: true,
      },
      "Test blog content"
    );

    // Create test service
    await testUtils.createTestMarkdown(
      path.join(testContentDir, "services/test-service.md"),
      {
        title: "Test Service",
        category: "Construction",
        description: "Test service description",
      },
      "Test service content"
    );

    // Create test team member
    await testUtils.createTestMarkdown(
      path.join(testContentDir, "team/test-member.md"),
      {
        name: "Test Member",
        position: "Test Position",
      },
      "Test member bio"
    );
  }

  async function readAllGeneratedData() {
    return {
      projects: await fs.readJson(path.join(testOutputDir, "projects.json")),
      blog: await fs.readJson(path.join(testOutputDir, "blog.json")),
      services: await fs.readJson(path.join(testOutputDir, "services.json")),
      team: await fs.readJson(path.join(testOutputDir, "team.json")),
    };
  }
});
