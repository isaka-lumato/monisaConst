# Security Implementation Guide

This document outlines the security measures implemented for the Decap CMS integration with the Monisa Construction Company website.

## Overview

The security implementation includes:
- GitHub OAuth authentication with PKCE
- Content sanitization and XSS protection
- Security headers and CSP policies
- Session management and access control
- File upload validation and restrictions

## Authentication & Authorization

### GitHub OAuth Configuration

The CMS uses GitHub OAuth for authentication with the following security features:

- **Backend**: GitHub OAuth with PKCE (Proof Key for Code Exchange)
- **Scope**: Minimal `repo` scope for repository access only
- **Branch Protection**: Configured to use `main` branch with squash merges
- **Session Management**: 1-hour session timeout with activity tracking

### User Access Control

User permissions are managed through GitHub repository collaborators:

- **Admin**: Full access to all collections and settings
- **Editor**: Access to content collections (projects, blog, services, team)
- **Contributor**: Limited access to blog and projects (create/edit only)

### Configuration Files

- `admin/config.yml`: Main CMS configuration with GitHub OAuth
- `admin/security-config.js`: User roles and permissions management
- `admin/index.html`: Security headers and session management

## Content Security

### Content Sanitization

All content is sanitized to prevent XSS attacks:

- **HTML Sanitization**: Removes dangerous tags and attributes
- **Markdown Sanitization**: Validates and sanitizes embedded HTML
- **URL Validation**: Blocks dangerous protocols (javascript:, data:, etc.)
- **Frontmatter Sanitization**: Recursively sanitizes YAML data

### Allowed Content

**HTML Tags**: p, br, strong, em, ul, ol, li, h1-h6, blockquote, a, img, etc.
**Attributes**: href, title, src, alt, class (limited set)
**Protocols**: https://, http://, mailto:, tel:, relative URLs

### Sanitization Modules

- `scripts/utils/content-sanitizer.js`: Core sanitization functions
- `scripts/build-content.js`: Integrated sanitization in build process
- `scripts/validate-security.js`: Security validation and testing

## Security Headers

### Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://unpkg.com https://api.github.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://api.github.com;
frame-ancestors 'none';
```

### Additional Headers

- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Strict-Transport-Security**: max-age=31536000; includeSubDomains

### Implementation

- `scripts/utils/security-headers.js`: Header generation and injection
- `admin/index.html`: Meta tags for security headers
- Server configuration files can be generated for Apache/Nginx

## File Upload Security

### Validation Rules

- **File Size**: Maximum 10MB for images, 5MB for documents
- **File Types**: 
  - Images: JPG, PNG, WebP, GIF, SVG
  - Documents: PDF, DOC, DOCX
- **Image Dimensions**: 100x100 to 4000x4000 pixels
- **Filename Validation**: Alphanumeric characters, dots, hyphens, underscores only

### Upload Processing

- Automatic image optimization and resizing
- Virus scanning (if configured server-side)
- Content type validation
- Duplicate detection and handling

## Session Management

### Security Features

- **Session Timeout**: 1 hour of inactivity
- **Activity Tracking**: Mouse, keyboard, and scroll events
- **Automatic Logout**: Session expiry with user notification
- **Token Management**: Secure storage and cleanup

### Implementation

```javascript
// Session configuration
const authConfig = {
  maxRetries: 3,
  sessionTimeout: 3600000, // 1 hour
  refreshThreshold: 300000, // 5 minutes
};
```

## Rate Limiting

### Request Limits

- **API Requests**: 60 requests per minute
- **File Uploads**: 50 uploads per hour
- **Content Updates**: 100 updates per hour

### Monitoring

- Request counting and throttling
- Suspicious activity detection
- Security event logging

## Security Monitoring

### Event Logging

The system logs the following security events:

- User login/logout attempts
- Content sanitization actions
- Rate limit violations
- Authentication failures
- File upload rejections

### Log Storage

- Client-side logging for development
- Server-side logging recommended for production
- Log rotation and retention policies

## Validation & Testing

### Security Validation Script

Run the security validation script to check implementation:

```bash
node scripts/validate-security.js
```

### Test Coverage

- Authentication flow testing
- Content sanitization validation
- Security header verification
- File upload security testing
- Session management testing

## Deployment Security

### Server Configuration

#### Apache (.htaccess)

```apache
# Security Headers
Header always set "Content-Security-Policy" "default-src 'self'..."
Header always set "X-Content-Type-Options" "nosniff"

# Prevent access to sensitive files
<FilesMatch "\\.(yml|yaml|json|md)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

#### Nginx

```nginx
# Security Headers
add_header Content-Security-Policy "default-src 'self'..." always;
add_header X-Content-Type-Options "nosniff" always;

# Prevent access to sensitive files
location ~* \\.(yml|yaml|json|md)$ {
    deny all;
    return 404;
}
```

### File Permissions

Ensure proper file permissions on the server:

- Content files: Read-only for web server
- Admin files: Restricted access
- Upload directory: Write permissions with validation
- Configuration files: Protected from web access

## Security Checklist

### Pre-Deployment

- [ ] GitHub OAuth configured with minimal scopes
- [ ] Content sanitization enabled and tested
- [ ] Security headers implemented
- [ ] File upload validation configured
- [ ] Session management implemented
- [ ] Rate limiting configured
- [ ] Security validation script passes

### Post-Deployment

- [ ] Server security headers configured
- [ ] File permissions set correctly
- [ ] HTTPS enabled with valid certificate
- [ ] Security monitoring enabled
- [ ] Backup and recovery procedures tested
- [ ] User access controls verified

## Incident Response

### Security Breach Response

1. **Immediate Actions**:
   - Disable affected user accounts
   - Review and rotate authentication tokens
   - Check for unauthorized content changes
   - Review security logs

2. **Investigation**:
   - Analyze attack vectors
   - Assess data exposure
   - Document findings

3. **Recovery**:
   - Apply security patches
   - Restore from clean backups if needed
   - Update security configurations
   - Notify stakeholders

### Contact Information

For security issues or questions:
- Technical Lead: [Contact Information]
- Security Team: [Contact Information]
- Emergency Contact: [Contact Information]

## Regular Maintenance

### Security Updates

- Monthly review of dependencies
- Quarterly security assessment
- Annual penetration testing
- Regular backup verification

### Monitoring

- Daily log review
- Weekly security metrics
- Monthly access review
- Quarterly security training

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Next Review**: [Date + 3 months]