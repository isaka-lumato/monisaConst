# Site Settings

This directory contains the global configuration settings for the Monisa Construction Company website. These settings are managed through the Decap CMS admin interface and control various aspects of the site.

## Files

- `site-config.md` - Main site configuration file containing company information, contact details, social media links, and SEO settings

## Configuration Sections

### Company Information
- **Company Name**: Official company name displayed throughout the site
- **Tagline**: Company motto or slogan
- **Description**: Brief company description for about sections and SEO
- **Founded Year**: Year the company was established
- **Logo**: Company logo image
- **Registration Number**: Official business registration number

### Contact Information
- **Address**: Full business address
- **Phone**: Primary business phone number (with country code)
- **Email**: Primary business email address
- **WhatsApp**: WhatsApp business number
- **Secondary Phone**: Alternative contact number
- **Fax**: Business fax number (optional)
- **P.O. Box**: Postal address (optional)
- **Business Hours**: Operating hours for weekdays, Saturday, and Sunday

### Social Media Links
- **Facebook**: Facebook page URL
- **Twitter**: Twitter/X profile URL
- **LinkedIn**: LinkedIn company page URL
- **Instagram**: Instagram profile URL
- **YouTube**: YouTube channel URL (optional)
- **TikTok**: TikTok profile URL (optional)

### SEO Settings
- **Site Title**: Main title for search engines (50-60 characters recommended)
- **Meta Description**: Site description for search engines (150-160 characters recommended)
- **Keywords**: Comma-separated keywords for SEO
- **Site URL**: Full website URL
- **Default Image**: Default image for social media sharing (1200x630px recommended)
- **Favicon**: Website favicon (32x32px ICO or PNG format)
- **Google Analytics ID**: Google Analytics tracking ID
- **Google Tag Manager ID**: Google Tag Manager container ID

### Additional Settings
- **Language**: Primary language of the website
- **Currency**: Default currency for pricing displays
- **Timezone**: Website timezone
- **Emergency Contact**: 24/7 emergency contact number
- **Licenses**: Professional licenses and certifications

## Editing Settings

1. Navigate to `/admin` in your browser
2. Log in with your credentials
3. Go to "Site Settings" in the sidebar
4. Click on "Site Configuration"
5. Edit the fields as needed
6. Click "Save" to apply changes

## Validation

To validate the site settings configuration, run:

```bash
npm run validate:settings
```

This will check:
- YAML syntax validity
- Required field presence
- Email format validation
- Phone number format
- SEO field length recommendations
- Social media URL format validation

## Required Fields

The following fields are required and must be filled:

**Company Information:**
- Company Name
- Tagline
- Description

**Contact Information:**
- Address
- Phone
- Email

**SEO Settings:**
- Site Title
- Meta Description
- Keywords

## Field Validation

The CMS includes validation for:
- Email addresses (proper format)
- Phone numbers (international format)
- Social media URLs (proper domain validation)
- Google Analytics/Tag Manager IDs (proper format)
- Required field presence

## Best Practices

1. **SEO Title**: Keep under 60 characters for optimal search engine display
2. **Meta Description**: Keep between 150-160 characters for best results
3. **Phone Numbers**: Use international format with country code (e.g., +255757015247)
4. **Social Media URLs**: Use full URLs including https://
5. **Images**: Optimize images before uploading (recommended sizes noted in field hints)
6. **Keywords**: Use relevant, comma-separated keywords for your industry and location

## Troubleshooting

If you encounter issues:

1. **YAML Errors**: Run the validation script to check for syntax errors
2. **Required Fields**: Ensure all required fields are filled
3. **URL Validation**: Check that social media URLs are properly formatted
4. **Email Issues**: Verify email addresses are in proper format
5. **Phone Format**: Use international format without spaces or dashes

For technical support, contact the development team.