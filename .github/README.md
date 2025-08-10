# GitHub Actions Workflows

This directory contains automated workflows for the Decap CMS implementation, providing continuous integration, deployment, and maintenance capabilities.

## Workflows Overview

### 1. Build and Deploy (`build-and-deploy.yml`)

**Triggers:**
- Push to `main`/`master` branch with changes to content, admin, or scripts
- Pull requests to `main`/`master` branch
- Manual workflow dispatch with force rebuild option

**Features:**
- ✅ Automated content processing and JSON generation
- ✅ Content validation and structure verification
- ✅ Build artifact management
- ✅ GitHub Pages deployment
- ✅ Error notifications and rollback mechanisms
- ✅ Build performance monitoring

**Jobs:**
1. **Build**: Processes content, validates structure, generates JSON files
2. **Deploy**: Deploys to GitHub Pages (main branch only)
3. **Notify**: Sends success/failure notifications
4. **Rollback**: Automatic rollback on deployment failure

### 2. Content Validation (`content-validation.yml`)

**Triggers:**
- Pull requests with content or config changes
- Manual workflow dispatch

**Features:**
- ✅ Markdown file validation
- ✅ YAML frontmatter syntax checking
- ✅ Required fields validation
- ✅ JSON generation testing
- ✅ Content structure verification

**Use Case:** Ensures content quality before merging pull requests.

### 3. Maintenance and Monitoring (`maintenance.yml`)

**Triggers:**
- Daily schedule (2 AM UTC)
- Manual workflow dispatch with task selection

**Features:**
- ✅ System health checks
- ✅ Build performance monitoring
- ✅ Artifact cleanup
- ✅ Content backup
- ✅ Image optimization
- ✅ Error monitoring

**Available Tasks:**
- `health-check`: Comprehensive system health assessment
- `cleanup-artifacts`: Remove old workflow artifacts
- `backup-content`: Create content backups
- `optimize-images`: Optimize large images

## Configuration

### Environment Variables

Set these in your repository settings under **Settings > Secrets and variables > Actions**:

#### Notification Settings
```bash
# Slack Integration (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#cms-notifications

# Discord Integration (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK

# Email Notifications (optional)
EMAIL_NOTIFICATIONS=true
EMAIL_RECIPIENTS=admin@example.com,dev@example.com
```

#### GitHub Pages Deployment
```bash
# Automatically configured by GitHub Pages
GITHUB_TOKEN=<automatically-provided>
```

### Repository Settings

#### GitHub Pages Setup
1. Go to **Settings > Pages**
2. Select **Source**: GitHub Actions
3. The workflow will automatically deploy to GitHub Pages

#### Branch Protection (Recommended)
1. Go to **Settings > Branches**
2. Add rule for `main` branch:
   - Require status checks to pass
   - Require branches to be up to date
   - Include "Content Validation" check

## Usage

### Automatic Deployment

1. **Content Updates**: Push changes to content files
2. **Automatic Processing**: Workflow triggers automatically
3. **Validation**: Content is validated and processed
4. **Deployment**: Site is deployed to GitHub Pages
5. **Notifications**: Team receives success/failure notifications

### Manual Operations

#### Force Rebuild
```bash
# Via GitHub UI: Actions > Build and Deploy > Run workflow
# Select "Force complete rebuild" option
```

#### Emergency Rollback
```bash
# Check rollback status
npm run rollback:status

# Create backup before rollback
npm run rollback:backup

# Rollback to last successful deployment
npm run rollback:last

# Rollback to specific commit
npm run rollback rollback <commit-hash>
```

#### Content Backup
```bash
# Via GitHub UI: Actions > Maintenance > Run workflow
# Select task: "backup-content"
```

#### Health Check
```bash
# Via GitHub UI: Actions > Maintenance > Run workflow  
# Select task: "health-check"
```

## Monitoring and Alerts

### Build Status
- ✅ **Success**: Green checkmark, notifications sent
- ❌ **Failure**: Red X, error notifications sent, rollback initiated
- ⚠️ **Warning**: Yellow warning, issues detected but build continues

### Health Monitoring
- **Daily Health Checks**: Automated system health assessment
- **Performance Monitoring**: Build time and resource usage tracking
- **Content Integrity**: Broken link and image reference detection
- **Error Detection**: Recent workflow failure monitoring

### Notification Channels

#### Slack Integration
- Build success/failure notifications
- Deployment status updates
- Health check alerts
- Rollback notifications

#### Discord Integration
- Real-time build status updates
- Error alerts with action links
- Daily health summaries

## Troubleshooting

### Common Issues

#### Build Failures
1. **Content Validation Errors**
   - Check content files for missing required fields
   - Validate YAML frontmatter syntax
   - Ensure image references are correct

2. **Dependency Issues**
   - Clear npm cache: Delete `package-lock.json` and reinstall
   - Check Node.js version compatibility

3. **Permission Errors**
   - Verify GitHub token permissions
   - Check repository settings for GitHub Pages

#### Deployment Issues
1. **GitHub Pages Not Updating**
   - Check Pages settings in repository
   - Verify workflow permissions
   - Check for DNS/CDN caching issues

2. **Rollback Failures**
   - Ensure Git history is available
   - Check for uncommitted changes
   - Verify backup integrity

### Debug Mode

Enable verbose logging by setting environment variables:

```bash
# In workflow file or repository secrets
DEBUG=true
VERBOSE_LOGGING=true
```

### Manual Intervention

#### Emergency Procedures
1. **Immediate Rollback**: Use emergency rollback script
2. **Disable Workflows**: Disable workflows in repository settings
3. **Manual Deployment**: Deploy manually using GitHub Pages settings
4. **Content Recovery**: Restore from automated backups

#### Recovery Steps
1. Identify the issue using workflow logs
2. Create backup of current state
3. Apply fix (content, configuration, or code)
4. Test locally if possible
5. Deploy fix or rollback as needed
6. Monitor deployment success
7. Update team on resolution

## Performance Optimization

### Build Performance
- **Incremental Builds**: Only processes changed content
- **Parallel Processing**: Concurrent image optimization
- **Caching**: NPM dependencies and build artifacts
- **Artifact Management**: Automatic cleanup of old artifacts

### Resource Usage
- **Image Optimization**: Automatic WebP conversion and compression
- **Content Compression**: Minified JSON output
- **Selective Processing**: Skip unchanged collections
- **Memory Management**: Efficient file processing

## Security Considerations

### Access Control
- **Repository Permissions**: Limit write access to content editors
- **Workflow Permissions**: Minimal required permissions
- **Secret Management**: Secure storage of API keys and webhooks

### Content Security
- **Input Validation**: Comprehensive content validation
- **XSS Prevention**: Markdown sanitization
- **File Upload Restrictions**: Limited file types and sizes
- **Backup Encryption**: Secure backup storage

## Maintenance Schedule

### Daily
- ✅ Health checks
- ✅ Error monitoring
- ✅ Performance tracking

### Weekly
- ✅ Artifact cleanup
- ✅ Backup verification
- ✅ Security updates

### Monthly
- ✅ Dependency updates
- ✅ Workflow optimization
- ✅ Performance analysis
- ✅ Documentation updates

## Support

### Getting Help
1. **Check Workflow Logs**: GitHub Actions tab for detailed error information
2. **Review Documentation**: This README and inline comments
3. **Emergency Contacts**: Use notification channels for urgent issues
4. **Issue Tracking**: Create GitHub issues for bugs or feature requests

### Contributing
1. Test changes in feature branches
2. Ensure all workflows pass
3. Update documentation as needed
4. Follow security best practices