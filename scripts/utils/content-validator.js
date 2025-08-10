/**
 * Content Validation Utilities
 *
 * Provides validation functions for content processing
 */

const fs = require("fs-extra");
const path = require("path");

class ContentValidator {
  constructor() {
    this.validationRules = {
      projects: {
        title: { required: true, type: "string", minLength: 3 },
        category: {
          required: true,
          type: "string",
          enum: ["Residential", "Commercial", "Infrastructure"],
        },
        status: {
          required: true,
          type: "string",
          enum: ["Planning", "In Progress", "Completed", "On Hold"],
        },
        location: { required: true, type: "string", minLength: 3 },
        completionDate: { type: "date" },
        budget: { type: "string" },
        featured: { type: "boolean" },
      },
      blog: {
        title: { required: true, type: "string", minLength: 5 },
        date: { required: true, type: "date" },
        author: { required: true, type: "string", minLength: 2 },
        published: { required: true, type: "boolean" },
        excerpt: { type: "string", maxLength: 200 },
        tags: { type: "array" },
      },
      services: {
        title: { required: true, type: "string", minLength: 3 },
        category: { required: true, type: "string" },
        description: { required: true, type: "string", minLength: 10 },
        features: { type: "array" },
        order: { type: "number" },
        available: { type: "boolean" },
      },
      team: {
        name: { required: true, type: "string", minLength: 2 },
        position: { required: true, type: "string", minLength: 3 },
        bio: { type: "string", minLength: 10 },
        email: { type: "email" },
        active: { type: "boolean" },
        order: { type: "number" },
      },
      settings: {
        // Settings collection is flexible, no strict validation
      },
    };
  }

  /**
   * Validate content item against collection rules
   */
  validateItem(collectionName, item, filePath) {
    const errors = [];
    const warnings = [];
    const rules = this.validationRules[collectionName];

    if (!rules) {
      warnings.push(
        `No validation rules defined for collection: ${collectionName}`
      );
      return { errors, warnings };
    }

    // Validate each field
    for (const [fieldName, rule] of Object.entries(rules)) {
      const value = item[fieldName];
      const fieldErrors = this.validateField(fieldName, value, rule, filePath);
      errors.push(...fieldErrors);
    }

    // Collection-specific validations
    const specificErrors = this.validateCollectionSpecific(
      collectionName,
      item,
      filePath
    );
    errors.push(...specificErrors);

    return { errors, warnings };
  }

  /**
   * Validate individual field
   */
  validateField(fieldName, value, rule, filePath) {
    const errors = [];
    const context = `${filePath}:${fieldName}`;

    // Required field check
    if (
      rule.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`${context}: Required field is missing`);
      return errors; // Skip other validations if required field is missing
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      return errors;
    }

    // Type validation
    if (rule.type) {
      const typeError = this.validateType(fieldName, value, rule.type, context);
      if (typeError) {
        errors.push(typeError);
        return errors; // Skip other validations if type is wrong
      }
    }

    // String validations
    if (rule.type === "string" && typeof value === "string") {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(
          `${context}: Must be at least ${rule.minLength} characters long`
        );
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(
          `${context}: Must be no more than ${rule.maxLength} characters long`
        );
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${context}: Must be one of: ${rule.enum.join(", ")}`);
    }

    // Email validation
    if (rule.type === "email" && !this.isValidEmail(value)) {
      errors.push(`${context}: Invalid email format`);
    }

    return errors;
  }

  /**
   * Validate field type
   */
  validateType(fieldName, value, expectedType, context) {
    switch (expectedType) {
      case "string":
        if (typeof value !== "string") {
          return `${context}: Expected string, got ${typeof value}`;
        }
        break;

      case "number":
        if (typeof value !== "number" || isNaN(value)) {
          return `${context}: Expected number, got ${typeof value}`;
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          return `${context}: Expected boolean, got ${typeof value}`;
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          return `${context}: Expected array, got ${typeof value}`;
        }
        break;

      case "date":
        if (!this.isValidDate(value)) {
          return `${context}: Invalid date format`;
        }
        break;

      case "email":
        if (typeof value !== "string") {
          return `${context}: Expected string for email, got ${typeof value}`;
        }
        break;
    }

    return null;
  }

  /**
   * Collection-specific validations
   */
  validateCollectionSpecific(collectionName, item, filePath) {
    const errors = [];

    switch (collectionName) {
      case "projects":
        // Validate project-specific logic
        if (item.status === "Completed" && !item.completionDate) {
          errors.push(
            `${filePath}: Completed projects must have a completion date`
          );
        }

        if (
          item.images &&
          item.images.gallery &&
          !Array.isArray(item.images.gallery)
        ) {
          errors.push(`${filePath}: Project gallery must be an array`);
        }
        break;

      case "blog":
        // Validate blog-specific logic
        if (item.published && !item.featuredImage) {
          errors.push(
            `${filePath}: Published blog posts should have a featured image`
          );
        }

        if (item.date && new Date(item.date) > new Date()) {
          errors.push(`${filePath}: Blog post date cannot be in the future`);
        }
        break;

      case "services":
        // Validate service-specific logic
        if (item.pricing && typeof item.pricing !== "object") {
          errors.push(`${filePath}: Service pricing must be an object`);
        }
        break;

      case "team":
        // Validate team-specific logic
        if (
          item.contact &&
          item.contact.email &&
          !this.isValidEmail(item.contact.email)
        ) {
          errors.push(`${filePath}: Invalid email in contact information`);
        }
        break;
    }

    return errors;
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate date format
   */
  isValidDate(dateString) {
    if (typeof dateString !== "string") return false;
    if (dateString.trim() === "") return true; // Allow empty dates
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Validate image paths exist
   */
  async validateImagePaths(item, basePath) {
    const errors = [];
    const imageFields = ["featuredImage", "photo", "images"];

    for (const field of imageFields) {
      if (item[field]) {
        const imageErrors = await this.validateImageField(
          item[field],
          field,
          basePath
        );
        errors.push(...imageErrors);
      }
    }

    return errors;
  }

  /**
   * Validate image field (handles strings, objects, and arrays)
   */
  async validateImageField(imageValue, fieldName, basePath) {
    const errors = [];

    if (typeof imageValue === "string") {
      const exists = await this.imageExists(imageValue, basePath);
      if (!exists) {
        errors.push(`Image not found: ${imageValue}`);
      }
    } else if (Array.isArray(imageValue)) {
      for (const imagePath of imageValue) {
        if (typeof imagePath === "string") {
          const exists = await this.imageExists(imagePath, basePath);
          if (!exists) {
            errors.push(`Image not found: ${imagePath}`);
          }
        }
      }
    } else if (typeof imageValue === "object") {
      for (const [key, value] of Object.entries(imageValue)) {
        if (typeof value === "string") {
          const exists = await this.imageExists(value, basePath);
          if (!exists) {
            errors.push(`Image not found: ${value}`);
          }
        } else if (Array.isArray(value)) {
          for (const imagePath of value) {
            if (typeof imagePath === "string") {
              const exists = await this.imageExists(imagePath, basePath);
              if (!exists) {
                errors.push(`Image not found: ${imagePath}`);
              }
            }
          }
        }
      }
    }

    return errors;
  }

  /**
   * Check if image file exists
   */
  async imageExists(imagePath, basePath) {
    try {
      const fullPath = path.join(basePath, imagePath.replace(/^\//, ""));
      return await fs.pathExists(fullPath);
    } catch (error) {
      return false;
    }
  }
}

module.exports = ContentValidator;
