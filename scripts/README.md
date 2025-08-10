# Content Processing Build Scripts

This directory contains the build scripts for processing Decap CMS content and generating JSON data files for the website.

## Main Scripts

### `build-content.js`

The main content processing script that:

- Parses Markdown files with YAML frontmatter from content collections
- Generates structured JSON data files for website consumption
- Processes and optimizes images
- Validates content against defined schemas
- Provides comprehensive error handling and reporting

**Usage:**
```bash
npm run build:content
# or
node scripts/build-content.js
```

**Features:**
- ✅ YAML frontmatter parsing
- ✅ Markdown to HTML conversion
- ✅ Image optimization (WebP conversion)
- ✅ Content validation
- ✅ Error handling and reporting
- ✅ Collection-specific sorting
- ✅ Automatic excerpt generation
- ✅ Reading time calculation

### `test-build-content.js`

Test script that verifies the content processing functionality.

**Usage:**
```bash
npm test
# or
node scripts/test-build-content.js
```

## Utility Modules

### `utils/content-validator.js`

Provides content validation functionality:
- Field type validation
- Required field checking
- Collection-specific validation rules
- Email and date format validation

### `utils/image-processor.js`

Handles image processing and optimization:
- Image format conversion (WebP, JPEG)
- Automatic resizing and optimization
- Thumbnail generation
- Batch processing capabilities

## Configuration

The build script is configured through the `CONFIG` object in `build-content.js`:

```javascript
const CONFIG = {
  contentDir: 'content',
  outputDir: 'assets/data',
  uploadsDir: 'assets/uploads',
  collections: {
    projects: {
      pattern: 'content/projects/*.md',
      output: 'projects.json',
      requiredFields: ['title', 'category', 'status', 'location']
    },
    // ... other collections
  },
  imageOptimization: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    formats: ['webp', 'jpg']
  }
};
```

## Content Collections

### Projects (`content/projects/*.md`)
- **Output:** `assets/data/projects.json`
- **Required Fields:** title, category, status, location
- **Sorting:** Featured items first, then by completion date

### Blog Posts (`content/blog/*.md`)
- **Output:** `assets/data/blog.json`
- **Required Fields:** title, date, author, published
- **Sorting:** By date (newest first)

### Services (`content/services/*.md`)
- **Output:** `assets/data/services.json`
- **Required Fields:** title, category, description
- **Sorting:** By order field

### Team Members (`content/team/*.md`)
- **Output:** `assets/data/team.json`
- **Required Fields:** name, position
- **Sorting:** By order field

### Site Settings (`content/settings/*.md`)
- **Output:** `assets/data/site-settings.json`
- **Required Fields:** None (flexible)
- **Sorting:** None

## Generated JSON Structure

Each processed content item includes:

```javascript
{
  "slug": "filename-without-extension",
  // ... all frontmatter fields
  "content": "HTML content from markdown",
  "excerpt": "Auto-generated or manual excerpt",
  "wordCount": 150,
  "readingTime": 1,
  "lastModified": "2024-01-15T10:30:00.000Z",
  "filePath": "content/collection/filename.md"
}
```

## Image Processing

Images referenced in frontmatter are automatically:
1. Optimized for web (resized, compressed)
2. Converted to WebP format for better performance
3. Validated for existence
4. Processed with error handling

**Supported Image Fields:**
- `featuredImage` (string)
- `photo` (string)
- `images` (object or array)

## Error Handling

The build script provides comprehensive error handling:

- **Validation Errors:** Missing required fields, invalid data types
- **Image Processing Errors:** Missing images, optimization failures
- **File System Errors:** Permission issues, missing directories
- **Content Parsing Errors:** Invalid YAML, markdown parsing issues

## Development

### Adding New Collections

1. Add collection configuration to `CONFIG.collections`
2. Add validation rules to `utils/content-validator.js`
3. Update sorting logic in `sortCollection()` method
4. Test with sample content

### Extending Validation

Add new validation rules in `utils/content-validator.js`:

```javascript
this.validationRules = {
  newCollection: {
    fieldName: { 
      required: true, 
      type: 'string', 
      minLength: 5 
    }
  }
};
```

### Custom Image Processing

Extend `utils/image-processor.js` for custom image processing needs:

```javascript
// Add custom thumbnail sizes
thumbnailSizes: [
  { width: 150, height: 150, suffix: '-small' },
  { width: 300, height: 300, suffix: '-medium' }
]
```

## Troubleshooting

### Common Issues

1. **Missing Images:** Images referenced in frontmatter but not found in filesystem
   - **Solution:** Ensure image paths are correct and files exist

2. **Validation Errors:** Content doesn't meet validation requirements
   - **Solution:** Check required fields and data types in content files

3. **Build Failures:** Script exits with errors
   - **Solution:** Check error messages and fix content or configuration

### Debug Mode

Run with verbose logging:
```bash
DEBUG=true npm run build:content
```

## Performance

The build script is optimized for performance:
- Concurrent image processing (limited concurrency)
- Efficient file system operations
- Memory-conscious processing of large collections
- Caching of processed images

## Dependencies

- `fs-extra`: Enhanced file system operations
- `glob`: File pattern matching
- `gray-matter`: YAML frontmatter parsing
- `marked`: Markdown to HTML conversion
- `sharp`: Image processing and optimization
- `js-yaml`: YAML parsing (inherited dependency)