# Team Members Content

This directory contains team member profiles for the Monisa Construction Company website. Each team member is represented by a Markdown file with YAML frontmatter containing their professional information.

## File Structure

Each team member file should follow this naming convention:
- `firstname-lastname.md` (e.g., `john-mwalimu.md`)

## Required Fields

- `name`: Full name of the team member
- `position`: Job title or role
- `photo`: Path to professional headshot image
- `bio`: Brief professional biography
- `order`: Display order (lower numbers appear first)
- `active`: Boolean indicating if the member should be displayed

## Optional Fields

- `department`: Department or division
- `contact`: Object containing email, phone, and extension
- `socialLinks`: Object containing social media profile URLs
- `professional`: Object containing experience, specializations, certifications, and education
- `featured`: Boolean for prominent display
- `joinDate`: Date when the team member joined the company
- `body`: Extended biography in Markdown format

## Image Guidelines

Team member photos should be:
- Professional headshots
- Square format (400x400px recommended)
- Stored in `/assets/imgs/team/` directory
- Named consistently with the team member's file name

## Content Management

Team members can be managed through the Decap CMS admin interface at `/admin`. The interface provides:
- Sortable fields by order, name, and position
- Filters for different departments and positions
- Validation for email addresses and social media URLs
- Rich text editing for extended biographies