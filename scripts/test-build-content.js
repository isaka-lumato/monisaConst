#!/usr/bin/env node

/**
 * Test script for content processing build script
 *
 * This script runs basic tests to verify the content processing functionality
 */

const fs = require("fs-extra");
const path = require("path");
const ContentProcessor = require("./build-content");

async function runTests() {
  console.log("🧪 Running content processing tests...\n");

  const tests = [
    testJSONFilesGenerated,
    testJSONStructure,
    testImageProcessing,
    testValidation,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      console.log(`✅ ${test.name} passed`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

async function testJSONFilesGenerated() {
  const expectedFiles = [
    "assets/data/projects.json",
    "assets/data/blog.json",
    "assets/data/services.json",
    "assets/data/team.json",
    "assets/data/site-settings.json",
  ];

  for (const file of expectedFiles) {
    if (!(await fs.pathExists(file))) {
      throw new Error(`Expected JSON file not found: ${file}`);
    }
  }
}

async function testJSONStructure() {
  const projectsData = await fs.readJson("assets/data/projects.json");

  if (!Array.isArray(projectsData)) {
    throw new Error("Projects data should be an array");
  }

  if (projectsData.length === 0) {
    throw new Error("Projects data should not be empty");
  }

  const firstProject = projectsData[0];
  const requiredFields = [
    "slug",
    "title",
    "category",
    "status",
    "location",
    "content",
  ];

  for (const field of requiredFields) {
    if (!firstProject[field]) {
      throw new Error(`Project missing required field: ${field}`);
    }
  }
}

async function testImageProcessing() {
  // This test checks if image processing doesn't break the build
  // In a real scenario, we'd have actual images to test with
  const teamData = await fs.readJson("assets/data/team.json");

  if (!Array.isArray(teamData)) {
    throw new Error("Team data should be an array");
  }

  // Check if team members have photo fields (even if images don't exist)
  const teamMember = teamData.find((member) => member.photo);
  if (!teamMember) {
    throw new Error("At least one team member should have a photo field");
  }
}

async function testValidation() {
  // Test that validation is working by checking processed data
  const blogData = await fs.readJson("assets/data/blog.json");

  for (const post of blogData) {
    if (!post.title || !post.author || !post.date) {
      throw new Error("Blog post missing required fields");
    }

    if (typeof post.published !== "boolean") {
      throw new Error("Blog post published field should be boolean");
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  });
}

module.exports = { runTests };
