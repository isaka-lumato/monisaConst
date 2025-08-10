# Blog Posts Collection

This directory contains all blog posts for the Monisa Construction Company website, managed through Decap CMS.

## File Structure

Blog posts are stored as Markdown files with YAML frontmatter using the naming convention:
```
YYYY-MM-DD-slug.md
```

Example: `2024-01-15-construction-trends-tanzania.md`

## Required Fields

Each blog post must include the following frontmatter fields:

- `title`: The main title of the blog post
- `date`: Publication date and time (YYYY-MM-DD HH:mm format)
- `author`: Author name (selected from predefined list)
- `excerpt`: Brief summary for listings and SEO (150-160 characters recommended)
- `featuredImage`: Main image for the blog post
- `published`: Boolean to control draft/published status
- `body`: Main content in Markdown format

## Optional Fields

- `tags`: Array of tags for categorization
- `seoTitle`: Custom SEO title (defaults to main title)
- `seoDescription`: Custom SEO description (defaults to excerpt)

## Content Guidelines

### Writing Style
- Use clear, professional language
- Focus on construction industry topics
- Include practical insights and tips
- Maintain consistency with company voice

### Image Requirements
- Featured images should be 1200x630px for optimal social sharing
- Use high-quality, relevant images
- Ensure proper licensing for all images
- Store images in `/assets/uploads/blog/` directory

### SEO Best Practices
- Keep titles under 60 characters
- Write compelling excerpts (150-160 characters)
- Use relevant tags for categorization
- Include internal links to other pages when appropriate

## Draft vs Published Workflow

### Draft Posts (`published: false`)
- Not visible on the website
- Can be edited and refined
- Useful for collaborative review process
- Automatically hidden from public listings

### Published Posts (`published: true`)
- Visible on website blog pages
- Included in RSS feeds and sitemaps
- Indexed by search engines
- Cannot be easily unpublished without affecting SEO

## Content Categories

Common blog post categories include:
- Industry Trends
- Project Spotlights
- Safety and Best Practices
- Company News
- Construction Tips
- Sustainability
- Technology in Construction

## Author Guidelines

Available authors (configured in CMS):
- John Mwalimu (Project Manager)
- Sarah Hassan (Architect)
- Michael Kimani (Safety Manager)
- Grace Mwangi (Operations Manager)
- David Ochieng (Site Supervisor)

## Publishing Process

1. Create new blog post through CMS admin interface
2. Fill in all required fields
3. Write content using Markdown formatting
4. Set `published: false` for draft
5. Review and edit as needed
6. Set `published: true` when ready to publish
7. Content automatically appears on website

## Technical Notes

- Files are processed by the build script to generate JSON data
- Markdown content is converted to HTML for website display
- Images are automatically optimized during build process
- All changes are version controlled through Git