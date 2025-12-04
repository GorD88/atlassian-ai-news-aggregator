# Setup Guide

## Initial Setup Steps

### 1. Install Forge CLI

```bash
npm install -g @forge/cli
```

### 2. Login to Forge

```bash
forge login
```

### 3. Register Your App

```bash
forge register
```

This will:
- Create a new app in your Atlassian account
- Generate an app ID
- Update your `manifest.yml` with the app ID

### 4. Update Manifest

After registration, update `manifest.yml`:
- The `app.id` field will be automatically updated
- Verify the schedule interval in the trigger section (default: every 6 hours)
- Adjust permissions if needed

### 5. Install Dependencies

```bash
npm install
```

### 6. Build the App

```bash
npm run build
```

### 7. Deploy

```bash
forge deploy
```

### 8. Install to Your Site

```bash
forge install
```

You'll be prompted to select your Atlassian site.

## Configuration

### Initial Configuration

1. **Access Global Page**:
   - The "AI News Aggregator" page will appear in your Confluence navigation
   - Click on it to open the configuration interface

2. **Configure Confluence Spaces**:
   - Update topic mappings with your actual Confluence space keys
   - Create parent pages in Confluence if you want organized structure
   - Example: Create a page "Rovo Agent Updates" in your "AI" space

3. **Add Feeds**:
   - Use the global page UI to add RSS/Atom feeds
   - Configure keywords for each feed
   - Enable/disable feeds as needed

### Example Feed Configuration

**Atlassian Blog**:
- URL: `https://www.atlassian.com/blog/feed`
- Keywords:
  - Rovo Agent
  - Rovo Dev CLI
  - Atlassian Intelligence
  - AI

**Atlassian Developer Blog**:
- URL: `https://developer.atlassian.com/blog/feed`
- Keywords:
  - Rovo
  - Forge
  - AI
  - Intelligence

### Example Topic Mapping

**Rovo Agent**:
- Space Key: `AI` (or your space key)
- Parent Page: `Rovo Agent Updates`

**Rovo Dev CLI**:
- Space Key: `AI`
- Parent Page: `Rovo Dev CLI Updates`

## Global Page API Note

The global page uses Forge's `invoke` function to call backend functions. In the Forge runtime, this function is automatically available. If you encounter issues:

1. Ensure you're running in a Forge environment (not just local HTML)
2. The function key in `manifest.yml` must match: `global-page`
3. Check browser console for errors

## Testing

### Test Feed Processing

1. Use the "Process Feeds Now" button in the admin UI
2. Check the status message for results
3. Verify pages are created in Confluence

### Test Scheduled Trigger

The scheduled trigger runs automatically. To test:
1. Wait for the scheduled time, or
2. Manually trigger via admin UI

### Check Logs

```bash
forge logs
```

## Troubleshooting

### Global Page Not Loading

- Verify the app is installed
- Check that the page appears in Confluence navigation
- Check manifest.yml configuration
- Review Forge logs

### Feeds Not Processing

- Verify feed URLs are accessible
- Check keywords are configured
- Review error logs
- Ensure feeds are enabled

### Confluence Pages Not Created

- Verify space keys are correct
- Check app has write permissions
- Verify parent pages exist (if configured)
- Review Confluence API errors in logs

### Permission Issues

Ensure your app has:
- Confluence: read and write content permissions
- Storage: read-write permissions
- External fetch: permissions for your feed URLs

## Development Workflow

1. Make code changes
2. Build: `npm run build`
3. Deploy: `forge deploy`
4. Test in your environment
5. Check logs: `forge logs`

## Local Development

Use Forge tunnel for local development:

```bash
forge tunnel
```

This allows you to test changes without deploying.

## Next Steps

1. Configure your feeds and topic mappings
2. Test feed processing
3. Monitor scheduled runs
4. Adjust keywords and mappings as needed
5. Review published content in Confluence

