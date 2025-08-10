# Decap CMS Implementation Testing Suite

This comprehensive testing suite ensures the reliability, performance, and correctness of the Decap CMS implementation for the Monisa Construction Company website.

## Test Structure

```
tests/
├── setup.js                    # Global test setup and utilities
├── test-runner.js              # Comprehensive test orchestrator
├── fixtures/                   # Test data and sample content
│   ├── sample-project.md
│   ├── sample-blog.md
│   ├── sample-service.md
│   └── sample-team.md
├── unit/                       # Unit tests for individual components
│   ├── content-processor.test.js
│   ├── content-validator.test.js
│   └── media-manager.test.js
├── integration/                # Integration tests for data flow
│   └── cms-data-flow.test.js
├── e2e/                        # End-to-end workflow tests
│   └── content-editing-workflows.test.js
├── performance/                # Performance and optimization tests
│   └── build-performance.test.js
└── coverage/                   # Test coverage reports and results
```

## Test Categories

### 1. Unit Tests (`tests/unit/`)

Test individual components and functions in isolation:

- **Content Processor**: Markdown parsing, YAML frontmatter extraction, content sanitization
- **Content Validator**: Field validation, data type checking, security validation
- **Media Manager**: File organization, validation, library management
- **Image Processor**: Image optimization, format conversion, metadata extraction
- **Utility Functions**: Helper functions, data transformation, error handling

### 2. Integration Tests (`tests/integration/`)

Test the complete data flow from content creation to website display:

- **CMS Data Flow**: Content processing pipeline, JSON generation, data consistency
- **Build Process**: Automated builds, incremental updates, error recovery
- **Media Integration**: Image processing integration, asset management
- **Collection Processing**: Multi-collection handling, sorting, relationships

### 3. End-to-End Tests (`tests/e2e/`)

Test complete user workflows and scenarios:

- **Content Creation**: Project creation, blog posting, service management
- **Content Editing**: Updates, status changes, media uploads
- **Content Publishing**: Draft to published workflows, build triggering
- **Media Workflows**: Image upload, organization, usage tracking
- **User Scenarios**: Real-world content management tasks

### 4. Performance Tests (`tests/performance/`)

Test performance characteristics and optimization:

- **Build Performance**: Processing speed, memory usage, scalability
- **Image Optimization**: Batch processing, compression efficiency
- **Memory Management**: Leak detection, resource cleanup
- **Concurrent Processing**: Multi-user scenarios, race conditions

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
```

### Advanced Usage

```bash
# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Interactive UI
npm run test:ui

# Direct Vitest usage
npm run test:vitest
```

### Test Runner Options

```bash
# Run all test suites with detailed reporting
node tests/test-runner.js

# Run specific suite
node tests/test-runner.js unit
node tests/test-runner.js integration
node tests/test-runner.js e2e
node tests/test-runner.js performance

# Get help
node tests/test-runner.js --help
```

## Test Configuration

### Vitest Configuration (`vitest.config.js`)

- **Environment**: Node.js
- **Timeout**: 30 seconds per test
- **Coverage**: V8 provider with HTML/JSON reports
- **Setup**: Global test utilities and environment

### Test Environment Variables

```javascript
// Available in all tests
global.TEST_CONFIG = {
  testDataDir: 'tests/fixtures',
  tempDir: 'tests/temp',
  backupDir: 'tests/backups',
  timeout: 30000
};

global.testUtils = {
  createTestFile,
  createTestMarkdown,
  createTestImage,
  verifyFileContent,
  // ... more utilities
};
```

## Writing Tests

### Unit Test Example

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import ContentProcessor from '../../scripts/build-content.js';

describe('ContentProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new ContentProcessor();
  });

  it('should parse markdown with frontmatter', async () => {
    const testFile = await testUtils.createTestMarkdown(
      'test.md',
      { title: 'Test', category: 'Test' },
      '# Content'
    );

    const result = await processor.processFile(testFile);

    expect(result.title).toBe('Test');
    expect(result.content).toContain('<h1>Content</h1>');
  });
});
```

### Integration Test Example

```javascript
describe('CMS Data Flow', () => {
  it('should process all collections', async () => {
    await createTestContent();
    await processor.process();

    const projectsData = await fs.readJson('assets/data/projects.json');
    expect(Array.isArray(projectsData)).toBe(true);
    expect(projectsData.length).toBeGreaterThan(0);
  });
});
```

### E2E Test Example

```javascript
describe('Content Editing Workflow', () => {
  it('should complete project creation workflow', async () => {
    // Step 1: Create content
    await createProjectContent(projectData);
    
    // Step 2: Trigger build
    const buildResult = await runBuildProcess();
    expect(buildResult.success).toBe(true);
    
    // Step 3: Verify output
    const projectsJson = await fs.readJson('assets/data/projects.json');
    const newProject = projectsJson.find(p => p.title === projectData.title);
    expect(newProject).toBeDefined();
  });
});
```

## Test Utilities

### Global Utilities

- `testUtils.createTestFile(filename, content)` - Create temporary test file
- `testUtils.createTestMarkdown(filename, frontmatter, content)` - Create test markdown
- `testUtils.createTestImage(filename)` - Create test image file
- `testUtils.verifyFileContent(path, expected)` - Verify file contents
- `testUtils.wait(ms)` - Async delay utility

### Test Fixtures

Pre-created sample content for consistent testing:

- `sample-project.md` - Complete project with all fields
- `sample-blog.md` - Blog post with rich content
- `sample-service.md` - Service with features and pricing
- `sample-team.md` - Team member with social links

## Coverage Reports

Test coverage reports are generated in `tests/coverage/`:

- `test-report.html` - Interactive HTML report
- `test-report.json` - Machine-readable results
- Coverage metrics for all source files

## Performance Benchmarks

Performance tests establish benchmarks for:

- **Content Processing**: < 100ms per file
- **Build Time**: < 10 seconds for 100 files
- **Memory Usage**: < 100MB increase during processing
- **Image Optimization**: < 500ms per image

## Continuous Integration

Tests are designed to run in CI environments:

- No external dependencies required
- Deterministic results
- Proper cleanup and isolation
- Detailed error reporting

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout in `vitest.config.js`
2. **Memory Issues**: Check for test isolation problems
3. **File System Errors**: Ensure proper cleanup in `afterEach`
4. **Flaky Tests**: Add proper async/await handling

### Debug Mode

```bash
# Run with verbose output
DEBUG=* npm test

# Run single test file
npx vitest run tests/unit/content-processor.test.js

# Run with debugger
node --inspect-brk node_modules/.bin/vitest run
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Include both positive and negative test cases
4. Add performance considerations for large-scale tests
5. Update this README if adding new test categories

## Requirements Coverage

This testing suite covers all requirements from the specification:

- **Requirement 7.1**: Content processing validation
- **Requirement 7.2**: JSON generation testing
- **Requirement 7.3**: Image processing verification
- **Requirement 7.4**: Build process automation
- **Requirement 7.5**: Error handling and recovery

The comprehensive test suite ensures the CMS implementation meets all functional and non-functional requirements while maintaining high code quality and reliability.