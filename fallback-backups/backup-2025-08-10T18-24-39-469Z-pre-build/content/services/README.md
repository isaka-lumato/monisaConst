# Services Collection

This directory contains service offerings managed through Decap CMS. Each service is defined as a Markdown file with YAML frontmatter containing structured data.

## Service Structure

Each service file includes:

### Required Fields
- `title`: Service name
- `category`: Service category (Construction Services, Design Services, etc.)
- `icon`: Icon identifier for display
- `description`: Brief service description
- `features`: List of key features/benefits
- `order`: Display order (lower numbers appear first)
- `available`: Whether the service is currently available
- `body`: Detailed service description in Markdown

### Optional Fields
- `pricing`: Pricing information object
  - `startingFrom`: Starting price
  - `unit`: Pricing unit (project, sq ft, hour, etc.)
  - `priceRange`: Price range description
- `featured`: Whether to feature prominently on homepage

## Service Categories

- **Construction Services**: Core construction and building services
- **Design Services**: Architectural and design-related services
- **Consultation Services**: Advisory and consultation services
- **Maintenance Services**: Ongoing maintenance and repair services
- **Project Management**: Project coordination and management services

## Icon Options

Available icons for services:
- `home`: Residential/housing related
- `building`: Commercial/office buildings
- `hammer`: General construction
- `wrench`: Maintenance/repair
- `blueprint`: Design/planning
- `hard-hat`: Safety/professional services
- `crane`: Heavy construction
- `tools`: General tools/services
- `paint-brush`: Finishing/decorative
- `ruler`: Measurement/precision
- `calculator`: Estimation/consultation
- `clipboard`: Management/organization

## Content Management

Services can be managed through the Decap CMS admin interface at `/admin`. The interface provides:

- Visual editing for service details
- Drag-and-drop reordering
- Category-based filtering
- Featured service selection
- Availability toggle
- Rich text editing for detailed descriptions

## Display Integration

Service data is processed by the build script and converted to JSON format for consumption by the website's JavaScript components. The services are displayed on:

- Services overview page
- Homepage featured services section
- Service category pages
- Individual service detail pages