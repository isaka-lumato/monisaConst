#!/usr/bin/env node

/**
 * Site Settings Validation Script
 *
 * This script validates the site settings configuration and ensures
 * all required fields are properly configured according to the requirements.
 */

const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");

// Configuration paths
const CONFIG_PATH = path.join(__dirname, "..", "admin", "config.yml");
const SITE_CONFIG_PATH = path.join(
  __dirname,
  "..",
  "content",
  "settings",
  "site-config.md"
);

/**
 * Validate the CMS configuration for site settings
 */
function validateCMSConfig() {
  console.log("🔍 Validating CMS configuration...");

  try {
    const configContent = fs.readFileSync(CONFIG_PATH, "utf8");
    const config = yaml.load(configContent);

    // Find the settings collection
    const settingsCollection = config.collections.find(
      (col) => col.name === "settings"
    );

    if (!settingsCollection) {
      throw new Error("Settings collection not found in CMS configuration");
    }

    // Validate that it's configured as a file collection
    if (!settingsCollection.files || !Array.isArray(settingsCollection.files)) {
      throw new Error(
        "Settings collection is not configured as a file collection"
      );
    }

    // Find the site-config file
    const siteConfigFile = settingsCollection.files.find(
      (file) => file.name === "site-config"
    );

    if (!siteConfigFile) {
      throw new Error(
        "Site configuration file not found in settings collection"
      );
    }

    // Validate required field groups
    const requiredGroups = ["company", "contact", "seo"];
    const fieldGroups = siteConfigFile.fields.map((field) => field.name);

    for (const group of requiredGroups) {
      if (!fieldGroups.includes(group)) {
        throw new Error(
          `Required field group '${group}' not found in site configuration`
        );
      }
    }

    console.log("✅ CMS configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ CMS configuration validation failed:", error.message);
    return false;
  }
}

/**
 * Validate the site configuration file
 */
function validateSiteConfig() {
  console.log("🔍 Validating site configuration file...");

  try {
    const content = fs.readFileSync(SITE_CONFIG_PATH, "utf8");
    const parts = content.split("---");

    if (parts.length < 3) {
      throw new Error(
        "Site configuration file does not have proper frontmatter structure"
      );
    }

    const frontmatter = yaml.load(parts[1]);

    // Validate required sections
    const requiredSections = ["company", "contact", "seo"];

    for (const section of requiredSections) {
      if (!frontmatter[section]) {
        throw new Error(
          `Required section '${section}' not found in site configuration`
        );
      }
    }

    // Validate required company fields
    const requiredCompanyFields = ["name", "tagline", "description"];
    for (const field of requiredCompanyFields) {
      if (
        !frontmatter.company[field] ||
        frontmatter.company[field].trim() === ""
      ) {
        throw new Error(
          `Required company field '${field}' is missing or empty`
        );
      }
    }

    // Validate required contact fields
    const requiredContactFields = ["address", "phone", "email"];
    for (const field of requiredContactFields) {
      if (
        !frontmatter.contact[field] ||
        frontmatter.contact[field].trim() === ""
      ) {
        throw new Error(
          `Required contact field '${field}' is missing or empty`
        );
      }
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(frontmatter.contact.email)) {
      throw new Error("Contact email is not in valid format");
    }

    // Validate phone format (basic check for international format)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(frontmatter.contact.phone.replace(/[\s-]/g, ""))) {
      console.warn(
        "⚠️  Phone number format may not be optimal for international use"
      );
    }

    // Validate required SEO fields
    const requiredSEOFields = ["title", "description", "keywords"];
    for (const field of requiredSEOFields) {
      if (!frontmatter.seo[field] || frontmatter.seo[field].trim() === "") {
        throw new Error(`Required SEO field '${field}' is missing or empty`);
      }
    }

    // Validate SEO field lengths
    if (frontmatter.seo.title.length > 60) {
      console.warn("⚠️  SEO title is longer than recommended 60 characters");
    }

    if (frontmatter.seo.description.length > 160) {
      console.warn(
        "⚠️  SEO description is longer than recommended 160 characters"
      );
    }

    console.log("✅ Site configuration file is valid");
    return true;
  } catch (error) {
    console.error("❌ Site configuration validation failed:", error.message);
    return false;
  }
}

/**
 * Generate a summary report of the site settings
 */
function generateSummaryReport() {
  console.log("\n📊 Site Settings Summary Report");
  console.log("================================");

  try {
    const content = fs.readFileSync(SITE_CONFIG_PATH, "utf8");
    const frontmatter = yaml.load(content.split("---")[1]);

    console.log(`Company Name: ${frontmatter.company.name}`);
    console.log(`Tagline: ${frontmatter.company.tagline}`);
    console.log(`Contact Email: ${frontmatter.contact.email}`);
    console.log(`Contact Phone: ${frontmatter.contact.phone}`);
    console.log(`SEO Title: ${frontmatter.seo.title}`);

    // Count configured social media links
    const socialLinks = Object.values(frontmatter.social || {}).filter(
      (link) => link && link.trim() !== ""
    );
    console.log(`Social Media Links: ${socialLinks.length} configured`);

    // Check optional fields
    const optionalFields = [
      { section: "company", field: "foundedYear", label: "Founded Year" },
      { section: "contact", field: "whatsapp", label: "WhatsApp" },
      { section: "seo", field: "googleAnalyticsId", label: "Google Analytics" },
      {
        section: "additional",
        field: "emergencyContact",
        label: "Emergency Contact",
      },
    ];

    console.log("\nOptional Fields Status:");
    optionalFields.forEach(({ section, field, label }) => {
      const value = frontmatter[section] && frontmatter[section][field];
      const status =
        value && typeof value === "string" && value.trim() !== ""
          ? "✅ Configured"
          : value && typeof value === "number"
          ? "✅ Configured"
          : "⚪ Not set";
      console.log(`  ${label}: ${status}`);
    });
  } catch (error) {
    console.error("❌ Failed to generate summary report:", error.message);
  }
}

/**
 * Main validation function
 */
function main() {
  console.log("🚀 Starting Site Settings Validation\n");

  const cmsValid = validateCMSConfig();
  const siteValid = validateSiteConfig();

  if (cmsValid && siteValid) {
    console.log("\n🎉 All validations passed successfully!");
    generateSummaryReport();
    process.exit(0);
  } else {
    console.log("\n💥 Validation failed. Please fix the issues above.");
    process.exit(1);
  }
}

// Run the validation if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  validateCMSConfig,
  validateSiteConfig,
  generateSummaryReport,
};
