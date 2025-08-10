/**
 * Unit Tests for Content Validator
 *
 * Tests content validation functionality including:
 * - Field validation
 * - Data type validation
 * - Required field checking
 * - Custom validation rules
 */

import { describe, it, expect, beforeEach } from "vitest";
import ContentValidator from "../../scripts/utils/content-validator.js";

describe("ContentValidator", () => {
  let validator;

  beforeEach(() => {
    validator = new ContentValidator();
  });

  describe("Item Validation", () => {
    it("should validate required fields", () => {
      const validItem = {
        title: "Test Title",
        category: "Test Category",
        status: "Active",
      };

      const result = validator.validateItem("projects", validItem, "test.md");

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.valid).toBe(true);
    });

    it("should detect missing required fields", () => {
      const invalidItem = {
        title: "Test Title",
        // Missing required 'category' field
      };

      const result = validator.validateItem("projects", invalidItem, "test.md");

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.includes("category"))).toBe(
        true
      );
    });

    it("should validate data types", () => {
      const itemWithWrongTypes = {
        title: "Test Title",
        category: "Test Category",
        status: "Active",
        published: "not-a-boolean", // Should be boolean
        order: "not-a-number", // Should be number
        date: "not-a-date", // Should be valid date
      };

      const result = validator.validateItem(
        "blog",
        itemWithWrongTypes,
        "test.md"
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some((warning) => warning.includes("published"))
      ).toBe(true);
      expect(result.warnings.some((warning) => warning.includes("order"))).toBe(
        true
      );
    });

    it("should validate URL fields", () => {
      const itemWithUrls = {
        name: "Test Person",
        position: "Test Position",
        linkedin: "not-a-valid-url",
        twitter: "https://twitter.com/valid",
        photo: "/assets/imgs/valid-path.jpg",
      };

      const result = validator.validateItem("team", itemWithUrls, "test.md");

      expect(
        result.warnings.some((warning) => warning.includes("linkedin"))
      ).toBe(true);
      expect(
        result.warnings.some((warning) => warning.includes("twitter"))
      ).toBe(false);
    });

    it("should validate email addresses", () => {
      const itemWithEmails = {
        name: "Test Person",
        position: "Test Position",
        email: "invalid-email",
        contactEmail: "valid@example.com",
      };

      const result = validator.validateItem("team", itemWithEmails, "test.md");

      expect(result.warnings.some((warning) => warning.includes("email"))).toBe(
        true
      );
      expect(
        result.warnings.some((warning) => warning.includes("contactEmail"))
      ).toBe(false);
    });

    it("should validate array fields", () => {
      const itemWithArrays = {
        title: "Test Service",
        category: "Test Category",
        features: ["Feature 1", "Feature 2"], // Valid array
        tags: "not-an-array", // Should be array
        emptyArray: [], // Valid but empty
      };

      const result = validator.validateItem(
        "services",
        itemWithArrays,
        "test.md"
      );

      expect(result.warnings.some((warning) => warning.includes("tags"))).toBe(
        true
      );
      expect(
        result.warnings.some((warning) => warning.includes("features"))
      ).toBe(false);
    });
  });

  describe("Field Type Validation", () => {
    it("should validate string fields", () => {
      expect(
        validator.validateFieldType("title", "Valid String", "string")
      ).toBe(true);
      expect(validator.validateFieldType("title", 123, "string")).toBe(false);
      expect(validator.validateFieldType("title", null, "string")).toBe(false);
    });

    it("should validate boolean fields", () => {
      expect(validator.validateFieldType("published", true, "boolean")).toBe(
        true
      );
      expect(validator.validateFieldType("published", false, "boolean")).toBe(
        true
      );
      expect(validator.validateFieldType("published", "true", "boolean")).toBe(
        false
      );
      expect(validator.validateFieldType("published", 1, "boolean")).toBe(
        false
      );
    });

    it("should validate number fields", () => {
      expect(validator.validateFieldType("order", 5, "number")).toBe(true);
      expect(validator.validateFieldType("order", 0, "number")).toBe(true);
      expect(validator.validateFieldType("order", -1, "number")).toBe(true);
      expect(validator.validateFieldType("order", "5", "number")).toBe(false);
      expect(
        validator.validateFieldType("order", "not-a-number", "number")
      ).toBe(false);
    });

    it("should validate array fields", () => {
      expect(
        validator.validateFieldType("tags", ["tag1", "tag2"], "array")
      ).toBe(true);
      expect(validator.validateFieldType("tags", [], "array")).toBe(true);
      expect(validator.validateFieldType("tags", "not-an-array", "array")).toBe(
        false
      );
      expect(validator.validateFieldType("tags", null, "array")).toBe(false);
    });

    it("should validate date fields", () => {
      expect(validator.validateFieldType("date", "2024-01-15", "date")).toBe(
        true
      );
      expect(
        validator.validateFieldType("date", "2024-01-15T10:30:00Z", "date")
      ).toBe(true);
      expect(validator.validateFieldType("date", "not-a-date", "date")).toBe(
        false
      );
      expect(validator.validateFieldType("date", "2024-13-45", "date")).toBe(
        false
      );
    });
  });

  describe("URL Validation", () => {
    it("should validate HTTP/HTTPS URLs", () => {
      expect(validator.isValidUrl("https://example.com")).toBe(true);
      expect(validator.isValidUrl("http://example.com")).toBe(true);
      expect(validator.isValidUrl("https://subdomain.example.com/path")).toBe(
        true
      );
      expect(validator.isValidUrl("not-a-url")).toBe(false);
      expect(validator.isValidUrl("ftp://example.com")).toBe(false);
    });

    it("should validate relative paths", () => {
      expect(validator.isValidUrl("/assets/imgs/image.jpg")).toBe(true);
      expect(validator.isValidUrl("./relative/path.jpg")).toBe(true);
      expect(validator.isValidUrl("../parent/path.jpg")).toBe(true);
    });

    it("should reject malicious URLs", () => {
      expect(validator.isValidUrl('javascript:alert("xss")')).toBe(false);
      expect(
        validator.isValidUrl('data:text/html,<script>alert("xss")</script>')
      ).toBe(false);
      expect(validator.isValidUrl('vbscript:msgbox("xss")')).toBe(false);
    });
  });

  describe("Email Validation", () => {
    it("should validate correct email formats", () => {
      expect(validator.isValidEmail("test@example.com")).toBe(true);
      expect(validator.isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(validator.isValidEmail("user+tag@example.org")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(validator.isValidEmail("invalid-email")).toBe(false);
      expect(validator.isValidEmail("@example.com")).toBe(false);
      expect(validator.isValidEmail("user@")).toBe(false);
      expect(validator.isValidEmail("user@.com")).toBe(false);
    });
  });

  describe("Collection-Specific Validation", () => {
    it("should apply projects-specific validation rules", () => {
      const project = {
        title: "Test Project",
        category: "Residential",
        status: "Invalid Status", // Should be one of: Completed, In Progress, Planning
        location: "Test Location",
      };

      const result = validator.validateItem("projects", project, "test.md");

      expect(
        result.warnings.some((warning) => warning.includes("status"))
      ).toBe(true);
    });

    it("should apply blog-specific validation rules", () => {
      const blogPost = {
        title: "Test Post",
        date: "2024-01-15",
        author: "Test Author",
        published: true,
        tags: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"], // Too many tags
      };

      const result = validator.validateItem("blog", blogPost, "test.md");

      expect(result.warnings.some((warning) => warning.includes("tags"))).toBe(
        true
      );
    });

    it("should apply team-specific validation rules", () => {
      const teamMember = {
        name: "Test Member",
        position: "Test Position",
        email: "invalid-email",
        phone: "invalid-phone-format",
      };

      const result = validator.validateItem("team", teamMember, "test.md");

      expect(result.warnings.some((warning) => warning.includes("email"))).toBe(
        true
      );
      expect(result.warnings.some((warning) => warning.includes("phone"))).toBe(
        true
      );
    });
  });

  describe("Content Length Validation", () => {
    it("should validate content length limits", () => {
      const longTitle = "A".repeat(200); // Too long
      const validTitle = "Valid Title";

      expect(validator.validateContentLength("title", longTitle, 100)).toBe(
        false
      );
      expect(validator.validateContentLength("title", validTitle, 100)).toBe(
        true
      );
    });

    it("should validate minimum content requirements", () => {
      const shortDescription = "Too short";
      const validDescription =
        "This is a valid description that meets the minimum length requirements for content validation.";

      expect(
        validator.validateContentLength("description", shortDescription, 10, 50)
      ).toBe(false);
      expect(
        validator.validateContentLength(
          "description",
          validDescription,
          10,
          200
        )
      ).toBe(true);
    });
  });

  describe("Custom Validation Rules", () => {
    it("should apply custom validation rules when provided", () => {
      const customRules = {
        title: (value) =>
          value.includes("Test") ? null : 'Title must contain "Test"',
        category: (value) =>
          ["Valid1", "Valid2"].includes(value) ? null : "Invalid category",
      };

      validator.addCustomRules("custom", customRules);

      const validItem = {
        title: "Test Title",
        category: "Valid1",
      };

      const invalidItem = {
        title: "Invalid Title",
        category: "Invalid",
      };

      const validResult = validator.validateItem(
        "custom",
        validItem,
        "test.md"
      );
      const invalidResult = validator.validateItem(
        "custom",
        invalidItem,
        "test.md"
      );

      expect(validResult.errors).toHaveLength(0);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Batch Validation", () => {
    it("should validate multiple items efficiently", () => {
      const items = [
        { title: "Item 1", category: "Cat1", status: "Active" },
        { title: "Item 2", category: "Cat2" }, // Missing status
        { title: "Item 3", category: "Cat3", status: "Active" },
      ];

      const results = validator.validateBatch("projects", items);

      expect(results).toHaveLength(3);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
      expect(results[2].valid).toBe(true);
    });
  });
});
