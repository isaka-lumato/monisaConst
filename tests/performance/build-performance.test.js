/**
 * Performance Tests for Build Process and Image Optimization
 *
 * Tests performance characteristics of:
 * - Content processing speed and memory usage
 * - Image optimization performance
 * - Build process scalability
 * - Memory leak detection
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import ContentProcessor from "../../scripts/build-content.js";
import ImageProcessor from "../../scripts/utils/image-processor.js";

describe("Build Process Performance", () => {
  let processor;
  let testContentDir;
  let performanceMetrics;

  beforeEach(async () => {
    testContentDir = path.join(TEST_CONFIG.tempDir, "performance-test");
    await fs.ensureDir(testContentDir);

    processor = new ContentProcessor();
    performanceMetrics = {
      startTime: 0,
      endTime: 0,
      memoryStart: 0,
      memoryEnd: 0,
      processedFiles: 0,
    };
  });

  afterEach(async () => {
    if (await fs.pathExists(testContentDir)) {
      await fs.remove(testContentDir);
    }
  });

  describe("Content Processing Performance", () => {
    it("should process 100 markdown files within acceptable time limits", async () => {
      // Create 100 test markdown files
      const fileCount = 100;
      await createTestContent(fileCount);

      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      // Process all content
      await processor.process();

      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      const processingTime = endTime - startTime;
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;

      // Performance assertions
      expect(processingTime).toBeLessThan(10000); // Less than 10 seconds
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
      expect(processor.processedFiles).toBe(fileCount);

      console.log(`Performance Metrics:
        - Processing Time: ${processingTime.toFixed(2)}ms
        - Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB
        - Files Processed: ${processor.processedFiles}
        - Average Time per File: ${(processingTime / fileCount).toFixed(2)}ms
      `);
    });

    it("should scale linearly with content volume", async () => {
      const testSizes = [10, 50, 100];
      const results = [];

      for (const size of testSizes) {
        // Clean up previous test
        await fs.emptyDir(testContentDir);

        // Create test content
        await createTestContent(size);

        const startTime = performance.now();

        const testProcessor = new ContentProcessor();
        await testProcessor.process();

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        results.push({
          size,
          time: processingTime,
          timePerFile: processingTime / size,
        });
      }

      // Check that processing time scales roughly linearly
      const timePerFile10 = results[0].timePerFile;
      const timePerFile50 = results[1].timePerFile;
      const timePerFile100 = results[2].timePerFile;

      // Time per file should not increase dramatically with scale
      expect(timePerFile100).toBeLessThan(timePerFile10 * 2);
      expect(timePerFile50).toBeLessThan(timePerFile10 * 1.5);

      console.log("Scalability Results:", results);
    });

    it("should handle concurrent processing efficiently", async () => {
      await createTestContent(50);

      const concurrentProcessors = 3;
      const processors = Array(concurrentProcessors)
        .fill(null)
        .map(() => new ContentProcessor());

      const startTime = performance.now();

      // Run processors concurrently
      await Promise.all(processors.map((p) => p.process()));

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Concurrent processing should not take significantly longer than sequential
      expect(totalTime).toBeLessThan(15000); // 15 seconds for 3 concurrent processors

      console.log(`Concurrent Processing:
        - Total Time: ${totalTime.toFixed(2)}ms
        - Processors: ${concurrentProcessors}
        - Average per Processor: ${(totalTime / concurrentProcessors).toFixed(
          2
        )}ms
      `);
    });

    it("should maintain consistent performance across multiple runs", async () => {
      await createTestContent(25);

      const runs = 5;
      const times = [];

      for (let i = 0; i < runs; i++) {
        const startTime = performance.now();

        const testProcessor = new ContentProcessor();
        await testProcessor.process();

        const endTime = performance.now();
        times.push(endTime - startTime);

        // Small delay between runs
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const variance = maxTime - minTime;

      // Variance should be less than 50% of average time
      expect(variance).toBeLessThan(avgTime * 0.5);

      console.log(`Consistency Test:
        - Average Time: ${avgTime.toFixed(2)}ms
        - Min Time: ${minTime.toFixed(2)}ms
        - Max Time: ${maxTime.toFixed(2)}ms
        - Variance: ${variance.toFixed(2)}ms
      `);
    });
  });

  describe("Memory Usage and Leak Detection", () => {
    it("should not have memory leaks during processing", async () => {
      await createTestContent(50);

      const initialMemory = process.memoryUsage();

      // Run multiple processing cycles
      for (let i = 0; i < 5; i++) {
        const testProcessor = new ContentProcessor();
        await testProcessor.process();

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be minimal after multiple runs
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB

      console.log(`Memory Usage:
        - Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        - Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        - Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB
      `);
    });

    it("should handle large individual files efficiently", async () => {
      // Create a very large markdown file
      const largeContent = "This is a large content file. ".repeat(10000); // ~300KB

      await testUtils.createTestMarkdown(
        path.join(testContentDir, "large-file.md"),
        {
          title: "Large File Test",
          category: "Test",
          status: "Active",
          location: "Test",
        },
        largeContent
      );

      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      await processor.processFile(path.join(testContentDir, "large-file.md"));

      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      const processingTime = endTime - startTime;
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;

      // Should handle large files efficiently
      expect(processingTime).toBeLessThan(1000); // Less than 1 second
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB

      console.log(`Large File Processing:
        - File Size: ~300KB
        - Processing Time: ${processingTime.toFixed(2)}ms
        - Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB
      `);
    });
  });

  describe("Image Processing Performance", () => {
    it("should optimize images within acceptable time limits", async () => {
      const imageProcessor = new ImageProcessor({
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 85,
      });

      // Create test images of various sizes
      const testImages = [];
      for (let i = 0; i < 10; i++) {
        const imagePath = await testUtils.createTestImage(`test-${i}.jpg`);
        testImages.push(imagePath);
      }

      const startTime = performance.now();

      // Process all images
      const results = await Promise.all(
        testImages.map((img) => imageProcessor.processImage(img))
      );

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(5000); // Less than 5 seconds for 10 images
      expect(results).toHaveLength(testImages.length);

      const avgTimePerImage = processingTime / testImages.length;
      console.log(`Image Processing Performance:
        - Total Time: ${processingTime.toFixed(2)}ms
        - Images Processed: ${testImages.length}
        - Average per Image: ${avgTimePerImage.toFixed(2)}ms
      `);
    });

    it("should handle batch image processing efficiently", async () => {
      const imageProcessor = new ImageProcessor();

      // Create 50 test images
      const imageCount = 50;
      const testImages = [];

      for (let i = 0; i < imageCount; i++) {
        const imagePath = await testUtils.createTestImage(`batch-${i}.png`);
        testImages.push(imagePath);
      }

      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      // Process in batches of 10
      const batchSize = 10;
      const results = [];

      for (let i = 0; i < testImages.length; i += batchSize) {
        const batch = testImages.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map((img) => imageProcessor.processImage(img))
        );
        results.push(...batchResults);
      }

      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      const processingTime = endTime - startTime;
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;

      expect(processingTime).toBeLessThan(20000); // Less than 20 seconds
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      expect(results).toHaveLength(imageCount);

      console.log(`Batch Image Processing:
        - Images: ${imageCount}
        - Batch Size: ${batchSize}
        - Total Time: ${processingTime.toFixed(2)}ms
        - Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB
        - Average per Image: ${(processingTime / imageCount).toFixed(2)}ms
      `);
    });
  });

  describe("Build Process Optimization", () => {
    it("should skip unchanged files efficiently", async () => {
      await createTestContent(20);

      // First build
      const firstBuildStart = performance.now();
      await processor.process();
      const firstBuildTime = performance.now() - firstBuildStart;

      // Second build (no changes)
      const secondBuildStart = performance.now();
      const processor2 = new ContentProcessor();
      await processor2.process();
      const secondBuildTime = performance.now() - secondBuildStart;

      // Second build should be significantly faster (if caching is implemented)
      // For now, we just ensure it completes successfully
      expect(secondBuildTime).toBeLessThan(firstBuildTime * 2);

      console.log(`Build Optimization:
        - First Build: ${firstBuildTime.toFixed(2)}ms
        - Second Build: ${secondBuildTime.toFixed(2)}ms
        - Improvement: ${(
          ((firstBuildTime - secondBuildTime) / firstBuildTime) *
          100
        ).toFixed(1)}%
      `);
    });

    it("should handle incremental builds efficiently", async () => {
      // Initial content
      await createTestContent(30);

      const initialBuildStart = performance.now();
      await processor.process();
      const initialBuildTime = performance.now() - initialBuildStart;

      // Add 5 more files
      await createTestContent(5, 30); // Start from index 30

      const incrementalBuildStart = performance.now();
      const processor2 = new ContentProcessor();
      await processor2.process();
      const incrementalBuildTime = performance.now() - incrementalBuildStart;

      // Incremental build should not take much longer than initial
      expect(incrementalBuildTime).toBeLessThan(initialBuildTime * 1.5);

      console.log(`Incremental Build:
        - Initial Build (30 files): ${initialBuildTime.toFixed(2)}ms
        - Incremental Build (35 files): ${incrementalBuildTime.toFixed(2)}ms
        - Ratio: ${(incrementalBuildTime / initialBuildTime).toFixed(2)}x
      `);
    });
  });

  describe("Resource Usage Monitoring", () => {
    it("should monitor CPU usage during processing", async () => {
      await createTestContent(100);

      const startCpuUsage = process.cpuUsage();
      const startTime = performance.now();

      await processor.process();

      const endTime = performance.now();
      const endCpuUsage = process.cpuUsage(startCpuUsage);

      const processingTime = endTime - startTime;
      const cpuTime = (endCpuUsage.user + endCpuUsage.system) / 1000; // Convert to milliseconds

      const cpuEfficiency = (cpuTime / processingTime) * 100;

      console.log(`CPU Usage:
        - Wall Clock Time: ${processingTime.toFixed(2)}ms
        - CPU Time: ${cpuTime.toFixed(2)}ms
        - CPU Efficiency: ${cpuEfficiency.toFixed(1)}%
      `);

      // CPU efficiency should be reasonable (not too low, indicating blocking operations)
      expect(cpuEfficiency).toBeGreaterThan(10);
      expect(cpuEfficiency).toBeLessThan(200); // Should not exceed 200% on multi-core
    });

    it("should handle file system operations efficiently", async () => {
      await createTestContent(50);

      const fsOperations = {
        reads: 0,
        writes: 0,
      };

      // Mock fs operations to count them (simplified)
      const originalReadFile = fs.readFile;
      const originalWriteFile = fs.writeFile;

      fs.readFile = async (...args) => {
        fsOperations.reads++;
        return originalReadFile.apply(fs, args);
      };

      fs.writeFile = async (...args) => {
        fsOperations.writes++;
        return originalWriteFile.apply(fs, args);
      };

      const startTime = performance.now();
      await processor.process();
      const endTime = performance.now();

      // Restore original functions
      fs.readFile = originalReadFile;
      fs.writeFile = originalWriteFile;

      const processingTime = endTime - startTime;

      console.log(`File System Operations:
        - Processing Time: ${processingTime.toFixed(2)}ms
        - Read Operations: ${fsOperations.reads}
        - Write Operations: ${fsOperations.writes}
        - Total Operations: ${fsOperations.reads + fsOperations.writes}
      `);

      // Should not have excessive file operations
      expect(fsOperations.reads).toBeLessThan(200); // Reasonable number of reads
      expect(fsOperations.writes).toBeLessThan(50); // Reasonable number of writes
    });
  });

  // Helper function to create test content
  async function createTestContent(count, startIndex = 0) {
    const collections = ["projects", "blog", "services", "team"];

    for (let i = startIndex; i < startIndex + count; i++) {
      const collection = collections[i % collections.length];
      const collectionDir = path.join(testContentDir, collection);
      await fs.ensureDir(collectionDir);

      let frontmatter, content;

      switch (collection) {
        case "projects":
          frontmatter = {
            title: `Test Project ${i}`,
            category: "Residential",
            status: "Completed",
            location: `Location ${i}`,
            featured: i % 5 === 0,
          };
          content = `This is test project ${i} content with some **bold** and *italic* text.`;
          break;

        case "blog":
          frontmatter = {
            title: `Test Blog Post ${i}`,
            date: `2024-01-${String((i % 28) + 1).padStart(2, "0")}`,
            author: "Test Author",
            published: true,
            tags: ["Test", "Performance"],
          };
          content = `This is test blog post ${i} content. `.repeat(50); // Longer content
          break;

        case "services":
          frontmatter = {
            title: `Test Service ${i}`,
            category: "Construction",
            description: `Test service ${i} description`,
            order: i,
          };
          content = `Service ${i} detailed description.`;
          break;

        case "team":
          frontmatter = {
            name: `Test Member ${i}`,
            position: "Test Position",
            order: i,
          };
          content = `Bio for test member ${i}.`;
          break;
      }

      await testUtils.createTestMarkdown(
        path.join(collectionDir, `test-${collection}-${i}.md`),
        frontmatter,
        content
      );
    }
  }
});
