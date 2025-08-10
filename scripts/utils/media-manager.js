/**
 * Media Management System
 *
 * Handles media library organization, validation, and optimization
 * for the Decap CMS implementation
 */

const fs = require("fs-extra");
const path = require("path");
const ImageProcessor = require("./image-processor");

class MediaManager {
  constructor(options = {}) {
    this.config = {
      mediaFolder: options.mediaFolder || "assets/uploads",
      maxFileSize: options.maxFileSize || 10485760, // 10MB
      allowedExtensions: options.allowedExtensions || [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",
        "svg",
        "pdf",
        "doc",
        "docx",
      ],
      imageExtensions: ["jpg", "jpeg", "png", "webp", "gif"],
      documentExtensions: ["pdf", "doc", "docx"],
      folderStructure: options.folderStructure || {
        projects: "projects",
        blog: "blog",
        team: "team",
        services: "services",
        general: "general",
        documents: "documents",
      },
    };

    this.imageProcessor = new ImageProcessor({
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      formats: ["webp", "jpg"],
    });

    this.mediaIndex = new Map();
    this.errors = [];
  }

  /**
   * Initialize media management system
   */
  async initialize() {
    try {
      await this.createFolderStructure();
      await this.indexExistingMedia();
      console.log("Media management system initialized successfully");
    } catch (error) {
      console.error("Failed to initialize media management:", error);
      throw error;
    }
  }

  /**
   * Create organized folder structure for media
   */
  async createFolderStructure() {
    const baseDir = this.config.mediaFolder;

    // Ensure base media directory exists
    await fs.ensureDir(baseDir);

    // Create organized subdirectories
    for (const [category, folderName] of Object.entries(
      this.config.folderStructure
    )) {
      const folderPath = path.join(baseDir, folderName);
      await fs.ensureDir(folderPath);

      // Create .gitkeep file to ensure empty folders are tracked
      const gitkeepPath = path.join(folderPath, ".gitkeep");
      if (!(await fs.pathExists(gitkeepPath))) {
        await fs.writeFile(gitkeepPath, "");
      }
    }

    console.log("Media folder structure created");
  }

  /**
   * Index existing media files
   */
  async indexExistingMedia() {
    const mediaDir = this.config.mediaFolder;

    if (!(await fs.pathExists(mediaDir))) {
      return;
    }

    const files = await this.getAllFiles(mediaDir);

    for (const filePath of files) {
      const fileName = path.basename(filePath);

      // Skip .gitkeep and other system files
      if (fileName.startsWith(".") || fileName === "README.md") {
        continue;
      }

      const relativePath = path.relative(mediaDir, filePath);
      const stats = await fs.stat(filePath);
      const extension = path.extname(filePath).toLowerCase().slice(1);

      // Only index files with allowed extensions
      if (this.config.allowedExtensions.includes(extension)) {
        this.mediaIndex.set(relativePath, {
          path: filePath,
          relativePath,
          size: stats.size,
          extension,
          type: this.getFileType(extension),
          lastModified: stats.mtime,
          category: this.getCategoryFromPath(relativePath),
        });
      }
    }

    console.log(`Indexed ${this.mediaIndex.size} media files`);
  }

  /**
   * Validate uploaded media file
   */
  async validateMedia(filePath, options = {}) {
    try {
      const stats = await fs.stat(filePath);
      const extension = path.extname(filePath).toLowerCase().slice(1);
      const fileName = path.basename(filePath);

      // Check file size
      if (stats.size > this.config.maxFileSize) {
        return {
          valid: false,
          error: `File size exceeds limit (${this.formatFileSize(
            this.config.maxFileSize
          )})`,
        };
      }

      // Check file extension
      if (!this.config.allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `File type not allowed. Supported: ${this.config.allowedExtensions.join(
            ", "
          )}`,
        };
      }

      // Additional validation for images
      if (this.config.imageExtensions.includes(extension)) {
        const imageValidation = await this.imageProcessor.validateImage(
          filePath
        );
        if (!imageValidation.valid) {
          return imageValidation;
        }
      }

      // Check for duplicate files
      const duplicate = this.findDuplicateFile(fileName, stats.size);
      if (duplicate && !options.allowDuplicates) {
        return {
          valid: false,
          error: `File already exists: ${duplicate.relativePath}`,
          duplicate: duplicate,
        };
      }

      return {
        valid: true,
        metadata: {
          size: stats.size,
          extension,
          type: this.getFileType(extension),
          lastModified: stats.mtime,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: `Validation failed: ${error.message}`,
      };
    }
  }

  /**
   * Organize media file into appropriate folder
   */
  async organizeMedia(filePath, category = "general", options = {}) {
    try {
      const fileName = path.basename(filePath);
      const extension = path.extname(filePath).toLowerCase().slice(1);

      // Determine target folder
      const folderName =
        this.config.folderStructure[category] ||
        this.config.folderStructure.general;
      const targetDir = path.join(this.config.mediaFolder, folderName);

      // Ensure target directory exists
      await fs.ensureDir(targetDir);

      // Generate unique filename if needed
      let targetPath = path.join(targetDir, fileName);
      if ((await fs.pathExists(targetPath)) && !options.overwrite) {
        targetPath = await this.generateUniqueFilename(targetDir, fileName);
      }

      // Move/copy file to organized location
      if (options.move) {
        await fs.move(filePath, targetPath);
      } else {
        await fs.copy(filePath, targetPath);
      }

      // Process images for optimization
      if (this.config.imageExtensions.includes(extension)) {
        await this.imageProcessor.processImage(targetPath, {
          generateThumbnails: options.generateThumbnails || false,
        });
      }

      // Update media index
      const relativePath = path.relative(this.config.mediaFolder, targetPath);
      const stats = await fs.stat(targetPath);

      this.mediaIndex.set(relativePath, {
        path: targetPath,
        relativePath,
        size: stats.size,
        extension,
        type: this.getFileType(extension),
        lastModified: stats.mtime,
        category,
      });

      return {
        success: true,
        path: targetPath,
        relativePath,
        publicUrl: `/${this.config.mediaFolder}/${relativePath}`,
      };
    } catch (error) {
      this.errors.push(
        `Failed to organize media ${filePath}: ${error.message}`
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get media library contents with filtering and search
   */
  getMediaLibrary(options = {}) {
    const {
      category,
      type,
      search,
      sortBy = "lastModified",
      sortOrder = "desc",
    } = options;

    let media = Array.from(this.mediaIndex.values());

    // Apply filters
    if (category) {
      media = media.filter((item) => item.category === category);
    }

    if (type) {
      media = media.filter((item) => item.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      media = media.filter((item) =>
        path.basename(item.path).toLowerCase().includes(searchLower)
      );
    }

    // Sort results
    media.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "lastModified") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "desc") {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    return {
      media,
      total: media.length,
      categories: this.getMediaCategories(),
      types: this.getMediaTypes(),
    };
  }

  /**
   * Delete media file with usage checking
   */
  async deleteMedia(relativePath, options = {}) {
    try {
      const mediaItem = this.mediaIndex.get(relativePath);
      if (!mediaItem) {
        return { success: false, error: "Media file not found" };
      }

      // Check if media is used in content (if checking is enabled)
      if (!options.force) {
        const usage = await this.checkMediaUsage(relativePath);
        if (usage.length > 0) {
          return {
            success: false,
            error: "Media file is in use",
            usage,
          };
        }
      }

      // Delete the file
      await fs.remove(mediaItem.path);

      // Remove from index
      this.mediaIndex.delete(relativePath);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check where a media file is being used
   */
  async checkMediaUsage(relativePath) {
    const usage = [];
    const contentDirs = [
      "content/projects",
      "content/blog",
      "content/services",
      "content/team",
    ];

    for (const contentDir of contentDirs) {
      if (await fs.pathExists(contentDir)) {
        const files = await this.getAllFiles(contentDir, [".md"]);

        for (const filePath of files) {
          const content = await fs.readFile(filePath, "utf8");
          if (
            content.includes(relativePath) ||
            content.includes(`/${this.config.mediaFolder}/${relativePath}`)
          ) {
            usage.push({
              file: path.relative("content", filePath),
              type: path.basename(path.dirname(filePath)),
            });
          }
        }
      }
    }

    return usage;
  }

  /**
   * Get all available media categories
   */
  getMediaCategories() {
    const categories = new Set();
    for (const item of this.mediaIndex.values()) {
      categories.add(item.category);
    }
    return Array.from(categories);
  }

  /**
   * Get all available media types
   */
  getMediaTypes() {
    const types = new Set();
    for (const item of this.mediaIndex.values()) {
      types.add(item.type);
    }
    return Array.from(types);
  }

  /**
   * Helper: Get all files recursively
   */
  async getAllFiles(dir, extensions = null) {
    const files = [];

    if (!(await fs.pathExists(dir))) {
      return files;
    }

    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        files.push(...(await this.getAllFiles(fullPath, extensions)));
      } else if (
        !extensions ||
        extensions.includes(path.extname(item).toLowerCase())
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Helper: Determine file type from extension
   */
  getFileType(extension) {
    if (this.config.imageExtensions.includes(extension)) {
      return "image";
    } else if (this.config.documentExtensions.includes(extension)) {
      return "document";
    } else {
      return "other";
    }
  }

  /**
   * Helper: Get category from file path
   */
  getCategoryFromPath(relativePath) {
    const firstDir = relativePath.split(path.sep)[0];

    for (const [category, folderName] of Object.entries(
      this.config.folderStructure
    )) {
      if (folderName === firstDir) {
        return category;
      }
    }

    return "general";
  }

  /**
   * Helper: Find duplicate file
   */
  findDuplicateFile(fileName, fileSize) {
    for (const item of this.mediaIndex.values()) {
      if (path.basename(item.path) === fileName && item.size === fileSize) {
        return item;
      }
    }
    return null;
  }

  /**
   * Helper: Generate unique filename
   */
  async generateUniqueFilename(dir, fileName) {
    const { name, ext } = path.parse(fileName);
    let counter = 1;
    let newPath;

    do {
      const newName = `${name}-${counter}${ext}`;
      newPath = path.join(dir, newName);
      counter++;
    } while (await fs.pathExists(newPath));

    return newPath;
  }

  /**
   * Helper: Format file size for display
   */
  formatFileSize(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      totalFiles: this.mediaIndex.size,
      categories: this.getMediaCategories().length,
      types: this.getMediaTypes(),
      errors: this.errors.length,
      imageProcessorStats: this.imageProcessor.getStats(),
    };
  }
}

module.exports = MediaManager;
