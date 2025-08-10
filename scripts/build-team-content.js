const fs = require("fs");
const path = require("path");

/**
 * Build script for processing team member content
 * Reads Markdown files from content/team and generates JSON data
 */

// Simple YAML frontmatter parser
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content: content };
  }

  const yamlContent = match[1];
  const markdownContent = match[2];

  // Parse YAML content using a simple approach
  const frontmatter = parseYamlContent(yamlContent);

  return { frontmatter, content: markdownContent };
}

function parseYamlContent(yamlString) {
  const result = {};
  const lines = yamlString.split("\n");
  let currentPath = [];
  let currentObject = result;

  for (let line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indent = line.length - line.trimLeft().length;
    const trimmedLine = line.trim();

    // Adjust current path based on indentation
    while (
      currentPath.length > 0 &&
      currentPath[currentPath.length - 1].indent >= indent
    ) {
      currentPath.pop();
    }

    // Rebuild current object reference
    currentObject = result;
    for (let pathItem of currentPath) {
      currentObject = currentObject[pathItem.key];
    }

    if (trimmedLine.startsWith("- ")) {
      // Array item
      const value = trimmedLine.substring(2).trim();
      const lastKey =
        currentPath.length > 0 ? currentPath[currentPath.length - 1].key : null;

      if (lastKey && currentObject[lastKey] !== undefined) {
        if (!Array.isArray(currentObject[lastKey])) {
          currentObject[lastKey] = [];
        }
        currentObject[lastKey].push(parseValue(value));
      }
    } else if (trimmedLine.includes(":")) {
      // Key-value pair
      const colonIndex = trimmedLine.indexOf(":");
      const key = trimmedLine.substring(0, colonIndex).trim();
      const value = trimmedLine.substring(colonIndex + 1).trim();

      if (value === "" || value === "{}" || value === "[]") {
        // Object or array follows
        currentObject[key] = {};
        currentPath.push({ key: key, indent: indent });
      } else {
        currentObject[key] = parseValue(value);
      }
    }
  }

  return result;
}

// Parse individual values
function parseValue(value) {
  if (!value) return "";

  // Remove quotes
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // Parse boolean
  if (value === "true") return true;
  if (value === "false") return false;

  // Parse number
  if (!isNaN(value) && !isNaN(parseFloat(value))) {
    return parseFloat(value);
  }

  return value;
}

// Extract nested object values safely
function getNestedValue(obj, path, defaultValue = {}) {
  if (!obj || typeof obj !== "object") return defaultValue;

  const keys = path.split(".");
  let current = obj;

  for (let key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }

  return current || defaultValue;
}

// Main build function
function buildTeamContent() {
  const teamDir = path.join(__dirname, "../content/team");
  const outputDir = path.join(__dirname, "../assets/data");

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all team member files
  const teamFiles = fs
    .readdirSync(teamDir)
    .filter((file) => file.endsWith(".md") && file !== "README.md")
    .sort();

  const teamMembers = [];

  for (const file of teamFiles) {
    const filePath = path.join(teamDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const { frontmatter, content: markdownContent } = parseFrontmatter(content);

    // Skip inactive team members
    if (frontmatter.active === false) {
      continue;
    }

    // Create team member object with safe property access
    const teamMember = {
      id: path.basename(file, ".md"),
      name: frontmatter.name || "",
      position: frontmatter.position || "",
      department: frontmatter.department || "",
      photo: frontmatter.photo || "",
      bio: frontmatter.bio || "",
      contact: {
        email: getNestedValue(frontmatter, "contact.email", ""),
        phone: getNestedValue(frontmatter, "contact.phone", ""),
        extension: getNestedValue(frontmatter, "contact.extension", ""),
      },
      socialLinks: {
        linkedin: getNestedValue(frontmatter, "socialLinks.linkedin", ""),
        twitter: getNestedValue(frontmatter, "socialLinks.twitter", ""),
        facebook: getNestedValue(frontmatter, "socialLinks.facebook", ""),
        instagram: getNestedValue(frontmatter, "socialLinks.instagram", ""),
      },
      professional: {
        experience: getNestedValue(frontmatter, "professional.experience", 0),
        specializations: getNestedValue(
          frontmatter,
          "professional.specializations",
          []
        ),
        certifications: getNestedValue(
          frontmatter,
          "professional.certifications",
          []
        ),
        education: getNestedValue(frontmatter, "professional.education", ""),
      },
      order: frontmatter.order || 999,
      active: frontmatter.active !== false,
      featured: frontmatter.featured || false,
      joinDate: frontmatter.joinDate || null,
      content: markdownContent.trim(),
    };

    teamMembers.push(teamMember);
  }

  // Sort by order, then by name
  teamMembers.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.name.localeCompare(b.name);
  });

  // Generate different views of the data
  const teamData = {
    all: teamMembers,
    featured: teamMembers.filter((member) => member.featured),
    byDepartment: teamMembers.reduce((acc, member) => {
      const dept = member.department || "Other";
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(member);
      return acc;
    }, {}),
    count: teamMembers.length,
    lastUpdated: new Date().toISOString(),
  };

  // Write JSON file
  const outputPath = path.join(outputDir, "team.json");
  fs.writeFileSync(outputPath, JSON.stringify(teamData, null, 2));

  console.log(`✅ Team content processed successfully!`);
  console.log(`   - ${teamMembers.length} team members processed`);
  console.log(`   - ${teamData.featured.length} featured members`);
  console.log(
    `   - Departments: ${Object.keys(teamData.byDepartment).join(", ")}`
  );
  console.log(`   - Output: ${outputPath}`);

  return teamData;
}

// Run the build if this script is executed directly
if (require.main === module) {
  try {
    buildTeamContent();
  } catch (error) {
    console.error("❌ Error building team content:", error.message);
    process.exit(1);
  }
}

module.exports = { buildTeamContent };
