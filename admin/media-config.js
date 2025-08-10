/**
 * Media Configuration for Decap CMS
 *
 * Defines media handling, validation, and organization settings
 */

// Media library configuration
const MEDIA_CONFIG = {
  // Storage settings
  storage: {
    folder: "assets/uploads",
    publicFolder: "/assets/uploads",
    maxFileSize: 10485760, // 10MB in bytes
    allowedExtensions: [
      // Images
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "svg",
      // Documents
      "pdf",
      "doc",
      "docx",
    ],
  },

  // Image optimization settings
  imageOptimization: {
    enabled: true,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    formats: ["webp", "jpg"],
    generateThumbnails: true,
    thumbnailSizes: [
      { width: 300, height: 200, suffix: "-thumb" },
      { width: 600, height: 400, suffix: "-medium" },
      { width: 1200, height: 800, suffix: "-large" },
    ],
  },

  // Folder organization
  folderStructure: {
    projects: {
      name: "projects",
      description: "Project images and documents",
      allowedTypes: ["image", "document"],
      subfolders: ["gallery", "documents", "plans"],
    },
    blog: {
      name: "blog",
      description: "Blog post images and media",
      allowedTypes: ["image"],
      subfolders: ["featured", "content"],
    },
    team: {
      name: "team",
      description: "Team member photos",
      allowedTypes: ["image"],
      subfolders: ["headshots", "group"],
    },
    services: {
      name: "services",
      description: "Service-related images and documents",
      allowedTypes: ["image", "document"],
      subfolders: ["icons", "brochures"],
    },
    general: {
      name: "general",
      description: "General media files",
      allowedTypes: ["image", "document"],
      subfolders: ["logos", "misc"],
    },
    documents: {
      name: "documents",
      description: "Company documents and files",
      allowedTypes: ["document"],
      subfolders: ["contracts", "reports", "certificates"],
    },
  },

  // File type definitions
  fileTypes: {
    image: {
      extensions: ["jpg", "jpeg", "png", "webp", "gif", "svg"],
      maxSize: 5242880, // 5MB
      validation: {
        minWidth: 100,
        minHeight: 100,
        maxWidth: 4000,
        maxHeight: 4000,
      },
    },
    document: {
      extensions: ["pdf", "doc", "docx"],
      maxSize: 10485760, // 10MB
      validation: {
        // Document-specific validation rules
      },
    },
  },

  // Validation rules
  validation: {
    // File naming rules
    naming: {
      allowSpaces: false,
      maxLength: 100,
      allowedCharacters: /^[a-zA-Z0-9._-]+$/,
      reservedNames: ["con", "prn", "aux", "nul"],
    },

    // Content validation
    content: {
      scanForMalware: false, // Would require external service
      checkImageContent: true,
      allowDuplicates: false,
    },
  },

  // Upload restrictions by collection
  collectionRestrictions: {
    projects: {
      maxFiles: 20,
      allowedTypes: ["image", "document"],
      requiredDimensions: {
        main: { minWidth: 800, minHeight: 600 },
      },
    },
    blog: {
      maxFiles: 10,
      allowedTypes: ["image"],
      requiredDimensions: {
        featuredImage: { width: 1200, height: 630 }, // Social media optimal
      },
    },
    team: {
      maxFiles: 1,
      allowedTypes: ["image"],
      requiredDimensions: {
        photo: { minWidth: 300, minHeight: 300, aspectRatio: 1 }, // Square
      },
    },
    services: {
      maxFiles: 5,
      allowedTypes: ["image", "document"],
    },
  },

  // Error messages
  errorMessages: {
    FILE_TOO_LARGE: "File size exceeds the maximum allowed size",
    INVALID_FILE_TYPE: "File type is not supported",
    DUPLICATE_FILE: "A file with this name already exists",
    IMAGE_TOO_SMALL: "Image dimensions are too small",
    INVALID_DIMENSIONS: "Image does not meet required dimensions",
    INVALID_FILENAME: "Filename contains invalid characters",
    FILENAME_TOO_LONG: "Filename is too long",
    RESERVED_FILENAME: "Filename is reserved and cannot be used",
    UPLOAD_LIMIT_EXCEEDED:
      "Maximum number of files exceeded for this collection",
  },

  // Success messages
  successMessages: {
    UPLOAD_SUCCESS: "File uploaded successfully",
    OPTIMIZATION_SUCCESS: "Image optimized successfully",
    ORGANIZATION_SUCCESS: "File organized into appropriate folder",
  },
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = MEDIA_CONFIG;
}

// Make available globally for CMS
if (typeof window !== "undefined") {
  window.MEDIA_CONFIG = MEDIA_CONFIG;
}
