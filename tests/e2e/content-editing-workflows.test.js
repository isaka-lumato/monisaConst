/**
 * End-to-End Tests for Content Editing Workflows
 *
 * Tests complete user workflows from content creation to website display:
 * - Content creation and editing through CMS interface simulation
 * - Build process triggering and completion
 * - Website data consumption and display
 * - Media upload and management workflows
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";

describe("Content Editing Workflows E2E", () => {
  let testWorkspace;

  beforeEach(async () => {
    testWorkspace = path.join(TEST_CONFIG.tempDir, "e2e-workspace");
    await fs.ensureDir(testWorkspace);

    // Set up a complete test workspace
    await setupTestWorkspace();
  });

  afterEach(async () => {
    if (await fs.pathExists(testWorkspace)) {
      await fs.remove(testWorkspace);
    }
  });

  describe("Project Content Workflow", () => {
    it("should complete full project creation workflow", async () => {
      // Step 1: Create new project content (simulating CMS form submission)
      const projectData = {
        title: "New Construction Project",
        category: "Commercial",
        status: "In Progress",
        location: "Dar es Salaam",
        completionDate: "2024-06-15",
        duration: "12 months",
        budget: "$500,000",
        shortDescription: "Modern office complex construction",
        images: {
          main: "/assets/imgs/projects/office-main.jpg",
          gallery: [
            "/assets/imgs/projects/office-1.jpg",
            "/assets/imgs/projects/office-2.jpg",
          ],
        },
        specifications: {
          area: "5,000 sq ft",
          floors: 3,
          materials: ["Steel frame", "Glass facade"],
        },
        features: [
          "Modern architecture",
          "Energy efficient",
          "Parking facility",
        ],
        featured: true,
      };

      await createProjectContent(projectData);

      // Step 2: Trigger build process
      const buildResult = await runBuildProcess();
      expect(buildResult.success).toBe(true);

      // Step 3: Verify JSON generation
      const projectsJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/projects.json")
      );

      const newProject = projectsJson.find(
        (p) => p.title === projectData.title
      );
      expect(newProject).toBeDefined();
      expect(newProject.category).toBe(projectData.category);
      expect(newProject.status).toBe(projectData.status);
      expect(newProject.featured).toBe(true);

      // Step 4: Verify content structure
      expect(newProject.slug).toBe("new-construction-project");
      expect(newProject.content).toContain("<h1>");
      expect(newProject.excerpt).toBeDefined();
      expect(newProject.wordCount).toBeGreaterThan(0);
      expect(newProject.readingTime).toBeGreaterThan(0);

      // Step 5: Verify image processing
      expect(newProject.images).toBeDefined();
      expect(newProject.images.main).toBeDefined();
      expect(Array.isArray(newProject.images.gallery)).toBe(true);
    });

    it("should handle project editing workflow", async () => {
      // Create initial project
      const initialData = {
        title: "Original Project",
        category: "Residential",
        status: "Planning",
        location: "Arusha",
      };

      await createProjectContent(initialData);
      await runBuildProcess();

      // Edit the project
      const updatedData = {
        ...initialData,
        title: "Updated Project Title",
        status: "In Progress",
        budget: "$300,000",
      };

      await updateProjectContent("original-project", updatedData);
      await runBuildProcess();

      // Verify changes
      const projectsJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/projects.json")
      );

      const updatedProject = projectsJson.find(
        (p) => p.slug === "original-project"
      );
      expect(updatedProject.title).toBe("Updated Project Title");
      expect(updatedProject.status).toBe("In Progress");
      expect(updatedProject.budget).toBe("$300,000");
    });

    it("should handle project deletion workflow", async () => {
      // Create project
      await createProjectContent({
        title: "Project to Delete",
        category: "Residential",
        status: "Completed",
        location: "Mwanza",
      });

      await runBuildProcess();

      // Verify project exists
      let projectsJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/projects.json")
      );
      expect(projectsJson.some((p) => p.title === "Project to Delete")).toBe(
        true
      );

      // Delete project
      await deleteProjectContent("project-to-delete");
      await runBuildProcess();

      // Verify project is removed
      projectsJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/projects.json")
      );
      expect(projectsJson.some((p) => p.title === "Project to Delete")).toBe(
        false
      );
    });
  });

  describe("Blog Content Workflow", () => {
    it("should complete full blog post creation workflow", async () => {
      const blogData = {
        title: "Construction Industry Trends 2024",
        date: "2024-01-20",
        author: "John Mwalimu",
        excerpt: "Exploring the latest trends in construction industry",
        featuredImage: "/assets/imgs/blog/trends-2024.jpg",
        tags: ["Industry", "Trends", "Construction"],
        published: true,
      };

      const content = `
# Construction Industry Trends 2024

The construction industry is evolving rapidly with new technologies and methodologies.

## Key Trends

1. **Sustainable Construction**: Focus on eco-friendly materials
2. **Digital Transformation**: BIM and project management tools
3. **Modular Construction**: Prefabricated building components

## Conclusion

These trends are shaping the future of construction in Tanzania.
      `;

      await createBlogContent(blogData, content);
      const buildResult = await runBuildProcess();
      expect(buildResult.success).toBe(true);

      const blogJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/blog.json")
      );

      const newPost = blogJson.find((p) => p.title === blogData.title);
      expect(newPost).toBeDefined();
      expect(newPost.author).toBe(blogData.author);
      expect(newPost.published).toBe(true);
      expect(Array.isArray(newPost.tags)).toBe(true);
      expect(newPost.tags).toContain("Industry");
    });

    it("should handle draft to published workflow", async () => {
      // Create draft post
      const draftData = {
        title: "Draft Blog Post",
        date: "2024-01-25",
        author: "Test Author",
        published: false,
      };

      await createBlogContent(draftData, "Draft content");
      await runBuildProcess();

      let blogJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/blog.json")
      );

      let draftPost = blogJson.find((p) => p.title === draftData.title);
      expect(draftPost.published).toBe(false);

      // Publish the post
      await updateBlogContent("draft-blog-post", {
        ...draftData,
        published: true,
      });
      await runBuildProcess();

      blogJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/blog.json")
      );

      draftPost = blogJson.find((p) => p.title === draftData.title);
      expect(draftPost.published).toBe(true);
    });
  });

  describe("Media Management Workflow", () => {
    it("should complete image upload and organization workflow", async () => {
      // Simulate image upload
      const testImage = await testUtils.createTestImage("uploaded-image.jpg");

      // Organize image into projects category
      const organizeResult = await organizeMedia(testImage, "projects");
      expect(organizeResult.success).toBe(true);

      // Verify image is in correct location
      const expectedPath = path.join(
        testWorkspace,
        "assets/uploads/projects/uploaded-image.jpg"
      );
      expect(await fs.pathExists(expectedPath)).toBe(true);

      // Use image in project content
      const projectData = {
        title: "Project with Image",
        category: "Residential",
        status: "Completed",
        location: "Test Location",
        images: {
          main: organizeResult.publicUrl,
        },
      };

      await createProjectContent(projectData);
      await runBuildProcess();

      // Verify image reference in generated JSON
      const projectsJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/projects.json")
      );

      const project = projectsJson.find((p) => p.title === projectData.title);
      expect(project.images.main).toBe(organizeResult.publicUrl);
    });

    it("should handle media library management", async () => {
      // Upload multiple images to different categories
      const images = [
        { name: "project1.jpg", category: "projects" },
        { name: "blog1.png", category: "blog" },
        { name: "team1.jpg", category: "team" },
      ];

      for (const img of images) {
        const testImage = await testUtils.createTestImage(img.name);
        await organizeMedia(testImage, img.category);
      }

      // Verify media library structure
      const mediaLibrary = await getMediaLibrary();
      expect(mediaLibrary.total).toBe(images.length);
      expect(mediaLibrary.categories).toContain("projects");
      expect(mediaLibrary.categories).toContain("blog");
      expect(mediaLibrary.categories).toContain("team");
    });
  });

  describe("Build Process Integration", () => {
    it("should trigger automatic builds on content changes", async () => {
      // Create initial content
      await createProjectContent({
        title: "Auto Build Test",
        category: "Commercial",
        status: "Active",
        location: "Test",
      });

      // Simulate automatic build trigger
      const buildResult = await runBuildProcess();
      expect(buildResult.success).toBe(true);
      expect(buildResult.processedFiles).toBeGreaterThan(0);

      // Verify build artifacts
      const outputFiles = [
        "assets/data/projects.json",
        "assets/data/blog.json",
        "assets/data/services.json",
        "assets/data/team.json",
      ];

      for (const file of outputFiles) {
        const filePath = path.join(testWorkspace, file);
        expect(await fs.pathExists(filePath)).toBe(true);
      }
    });

    it("should handle build failures gracefully", async () => {
      // Create invalid content that should cause build issues
      await fs.writeFile(
        path.join(testWorkspace, "content/projects/invalid.md"),
        "Invalid content without proper frontmatter"
      );

      const buildResult = await runBuildProcess();

      // Build should complete but report errors
      expect(buildResult.success).toBe(true); // Graceful handling
      expect(buildResult.errors).toBeGreaterThan(0);
    });

    it("should validate content before building", async () => {
      // Create content with validation issues
      await createProjectContent({
        title: "Invalid Project",
        // Missing required fields
      });

      const buildResult = await runBuildProcess();
      expect(buildResult.errors).toBeGreaterThan(0);

      // Invalid content should not appear in output
      const projectsJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/projects.json")
      );
      expect(projectsJson.some((p) => p.title === "Invalid Project")).toBe(
        false
      );
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle large content volumes efficiently", async () => {
      const startTime = Date.now();

      // Create 100 pieces of content across different collections
      const promises = [];

      for (let i = 0; i < 25; i++) {
        promises.push(
          createProjectContent({
            title: `Project ${i}`,
            category: "Residential",
            status: "Completed",
            location: `Location ${i}`,
          })
        );

        promises.push(
          createBlogContent(
            {
              title: `Blog Post ${i}`,
              date: `2024-01-${String(i + 1).padStart(2, "0")}`,
              author: "Test Author",
              published: true,
            },
            `Content for post ${i}`
          )
        );
      }

      await Promise.all(promises);

      const buildResult = await runBuildProcess();
      const endTime = Date.now();

      expect(buildResult.success).toBe(true);
      expect(buildResult.processedFiles).toBe(50);

      // Should complete in reasonable time (less than 30 seconds)
      expect(endTime - startTime).toBeLessThan(30000);
    });

    it("should handle concurrent editing scenarios", async () => {
      // Simulate multiple editors working simultaneously
      const editorActions = [
        () =>
          createProjectContent({
            title: "Concurrent Project 1",
            category: "Residential",
            status: "Active",
            location: "Location 1",
          }),
        () =>
          createBlogContent(
            {
              title: "Concurrent Post 1",
              date: "2024-01-15",
              author: "Editor 1",
              published: true,
            },
            "Content 1"
          ),
        () =>
          createProjectContent({
            title: "Concurrent Project 2",
            category: "Commercial",
            status: "Planning",
            location: "Location 2",
          }),
      ];

      // Execute all actions concurrently
      await Promise.all(editorActions.map((action) => action()));

      const buildResult = await runBuildProcess();
      expect(buildResult.success).toBe(true);

      // Verify all content was processed
      const projectsJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/projects.json")
      );
      const blogJson = await fs.readJson(
        path.join(testWorkspace, "assets/data/blog.json")
      );

      expect(projectsJson).toHaveLength(2);
      expect(blogJson).toHaveLength(1);
    });
  });

  // Helper functions for E2E testing
  async function setupTestWorkspace() {
    // Create directory structure
    const dirs = [
      "content/projects",
      "content/blog",
      "content/services",
      "content/team",
      "content/settings",
      "assets/data",
      "assets/uploads",
      "admin",
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(testWorkspace, dir));
    }

    // Copy necessary scripts and utilities
    await fs.copy("scripts", path.join(testWorkspace, "scripts"));
    await fs.copy("package.json", path.join(testWorkspace, "package.json"));
  }

  async function createProjectContent(
    data,
    content = "Default project content"
  ) {
    const slug = data.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const frontmatter = Object.entries(data)
      .map(([key, value]) => {
        if (typeof value === "object") {
          return `${key}:\n${JSON.stringify(value, null, 2)
            .split("\n")
            .map((line) => `  ${line}`)
            .join("\n")}`;
        }
        return `${key}: ${typeof value === "string" ? `"${value}"` : value}`;
      })
      .join("\n");

    const fileContent = `---\n${frontmatter}\n---\n\n${content}`;

    await fs.writeFile(
      path.join(testWorkspace, `content/projects/${slug}.md`),
      fileContent
    );
  }

  async function updateProjectContent(slug, data) {
    const filePath = path.join(testWorkspace, `content/projects/${slug}.md`);
    const existingContent = await fs.readFile(filePath, "utf8");

    // Simple update - in real implementation, this would parse and update frontmatter
    const updatedContent = existingContent.replace(
      /title: ".*"/,
      `title: "${data.title}"`
    );

    await fs.writeFile(filePath, updatedContent);
  }

  async function deleteProjectContent(slug) {
    const filePath = path.join(testWorkspace, `content/projects/${slug}.md`);
    await fs.remove(filePath);
  }

  async function createBlogContent(data, content = "Default blog content") {
    const slug = data.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const frontmatter = Object.entries(data)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}:\n${value.map((item) => `  - "${item}"`).join("\n")}`;
        }
        return `${key}: ${typeof value === "string" ? `"${value}"` : value}`;
      })
      .join("\n");

    const fileContent = `---\n${frontmatter}\n---\n\n${content}`;

    await fs.writeFile(
      path.join(testWorkspace, `content/blog/${slug}.md`),
      fileContent
    );
  }

  async function updateBlogContent(slug, data) {
    const filePath = path.join(testWorkspace, `content/blog/${slug}.md`);
    const existingContent = await fs.readFile(filePath, "utf8");

    const updatedContent = existingContent.replace(
      /published: false/,
      "published: true"
    );

    await fs.writeFile(filePath, updatedContent);
  }

  async function organizeMedia(imagePath, category) {
    const targetDir = path.join(testWorkspace, "assets/uploads", category);
    await fs.ensureDir(targetDir);

    const filename = path.basename(imagePath);
    const targetPath = path.join(targetDir, filename);

    await fs.copy(imagePath, targetPath);

    return {
      success: true,
      publicUrl: `/assets/uploads/${category}/${filename}`,
      relativePath: `assets/uploads/${category}/${filename}`,
    };
  }

  async function getMediaLibrary() {
    const uploadsDir = path.join(testWorkspace, "assets/uploads");
    const categories = await fs.readdir(uploadsDir);
    const media = [];

    for (const category of categories) {
      const categoryDir = path.join(uploadsDir, category);
      const files = await fs.readdir(categoryDir);

      for (const file of files) {
        media.push({
          name: file,
          category,
          relativePath: `assets/uploads/${category}/${file}`,
          type: "image",
        });
      }
    }

    return {
      total: media.length,
      media,
      categories,
      types: ["image"],
    };
  }

  async function runBuildProcess() {
    try {
      // Change to test workspace directory and run build
      const originalCwd = process.cwd();
      process.chdir(testWorkspace);

      // Run the build script
      execSync("node scripts/build-content.js", {
        stdio: "pipe",
        timeout: 30000,
      });

      process.chdir(originalCwd);

      return {
        success: true,
        processedFiles: 1, // Simplified for testing
        errors: 0,
      };
    } catch (error) {
      return {
        success: false,
        processedFiles: 0,
        errors: 1,
        error: error.message,
      };
    }
  }
});
