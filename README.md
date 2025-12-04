# AI News Aggregator for Atlassian

A Forge-based application that automatically aggregates AI-related news from multiple sources (RSS/Atom feeds, blogs, etc.) and publishes filtered content to Confluence in a structured way.

## Features

- **Multi-source feed parsing**: Supports RSS and Atom feeds from various sources
- **Keyword-based filtering**: Automatically filters content based on configurable keywords
- **Topic classification**: Maps filtered content to specific Confluence spaces and pages
- **Automatic publishing**: Creates Confluence pages with structured content
- **Deduplication**: Prevents republishing the same news items
- **Scheduled processing**: Runs automatically on a configurable schedule
- **Global Page UI**: Web-based interface accessible from Confluence navigation for managing feeds, keywords, and mappings
- **Error handling**: Robust error handling with logging and retry capabilities

## Architecture

The application is built with a clean, modular architecture:

```
src/
├── types/              # TypeScript type definitions
├── services/           # Core business logic
│   ├── feedParser.ts          # RSS/Atom feed parsing
│   ├── keywordFilter.ts       # Keyword matching and topic classification
│   ├── confluencePublisher.ts # Confluence API integration
│   ├── configManager.ts       # Configuration storage and retrieval
│   └── newsProcessor.ts        # Main orchestration service
├── utils/              # Utility functions
│   ├── logger.ts              # Logging utility
│   └── hash.ts                # Hash generation for deduplication
└── index.ts            # Forge function entry points
```

## Prerequisites

- Node.js 18+ 
- Atlassian Forge CLI (`npm install -g @forge/cli`)
- An Atlassian Cloud site (Confluence)
- Forge app development account

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd atlassian-ai-news-aggregator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure the app**:
   - Update `manifest.yml` with your app ID (you'll get this when you register the app)
   - Configure default feeds and topic mappings in `src/services/configManager.ts` or via the admin UI

4. **Build the app**:
   ```bash
   npm run build
   ```

5. **Deploy to your Atlassian site**:
   ```bash
   forge deploy
   ```

6. **Install the app**:
   ```bash
   forge install
   ```

## Configuration

### Initial Setup

After installation, access the global page in Confluence:
- The "AI News Aggregator" page will appear in your Confluence navigation
- Click on it to open the configuration interface

### Adding Feeds

1. In the global page UI, click **"Add New Feed"**
2. Fill in:
   - **Feed Name**: A descriptive name (e.g., "Atlassian Blog")
   - **Feed URL**: The RSS/Atom feed URL
   - **Keywords**: One keyword per line (e.g., "Rovo Agent", "AI", "Atlassian Intelligence")
   - **Enabled**: Check to enable the feed

### Configuring Topic Mappings

1. Click **"Add New Mapping"**
2. Configure:
   - **Topic/Keyword**: The keyword that triggers this mapping
   - **Confluence Space Key**: The target Confluence space
   - **Parent Page Title** (optional): A parent page where news will be published as child pages

### Settings

- **Schedule Interval**: How often to check feeds (in minutes, minimum 60)
- **Enable AI Summarization**: Future feature for AI-generated summaries
- **Deduplication Window**: How many days to remember processed items (default: 30)

## Usage

### Automatic Processing

The app runs automatically based on the configured schedule (default: every 6 hours). No manual intervention needed.

### Manual Processing

You can trigger feed processing manually from the global page:
1. Open the "AI News Aggregator" page from Confluence navigation
2. Click **"Process Feeds Now"** in the Actions section

### Viewing Published Content

Published news items appear in Confluence:
- Navigate to the configured Confluence space
- Find the parent page (if configured) or look for pages with news titles
- Each page contains:
  - Summary
  - Source information
  - Publication date
  - Link to original article
  - Full content (if available)

## Development

### Project Structure

- **TypeScript**: All code is written in TypeScript for type safety
- **Modular design**: Services are separated by concern for maintainability
- **Error handling**: Comprehensive error handling with logging
- **Testing**: Unit tests for core logic (keyword filtering, hashing)

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Local Development

Use Forge tunnel for local development:

```bash
forge tunnel
```

### Building

```bash
npm run build
```

## Default Configuration

The app comes with default feeds and mappings:

**Default Feeds**:
- Atlassian Blog (https://www.atlassian.com/blog/feed)
- Atlassian Developer Blog (https://developer.atlassian.com/blog/feed)

**Default Keywords**:
- Rovo Agent
- Rovo Dev CLI
- Atlassian Intelligence
- AI
- Artificial Intelligence

**Default Topic Mappings**:
- Rovo Agent → AI space → "Rovo Agent Updates" page
- Rovo Dev CLI → AI space → "Rovo Dev CLI Updates" page
- Atlassian Intelligence → AI space → "Atlassian Intelligence Updates" page

> **Note**: You'll need to update the space keys to match your Confluence spaces.

## Permissions

The app requires the following permissions:
- **Confluence**: Read and write content
- **Storage**: Read-write (for configuration and processed items tracking)
- **External fetch**: Access to configured feed URLs

## Troubleshooting

### Feeds Not Processing

1. Check feed URLs are accessible
2. Verify keywords are configured
3. Check Forge logs for errors
4. Ensure feeds are enabled in configuration

### Pages Not Appearing in Confluence

1. Verify space keys are correct
2. Check app has write permissions to the space
3. Verify parent pages exist (if configured)
4. Check Forge logs for API errors

### Duplicate Pages

1. Increase deduplication window in settings
2. Check if items are being processed multiple times
3. Verify item IDs are being generated correctly

## Best Practices

1. **Feed Selection**: Choose feeds that regularly publish AI-related content
2. **Keyword Tuning**: Use specific keywords to avoid false positives
3. **Space Organization**: Create dedicated spaces or parent pages for different topics
4. **Monitoring**: Regularly check the admin UI for processing results
5. **Maintenance**: Periodically review and clean up old processed items

## Future Enhancements

- AI-powered summarization of news items
- Support for additional feed formats (JSON feeds, APIs)
- Email notifications for new items
- Advanced topic classification using ML
- Support for updating existing pages instead of creating new ones
- Integration with Forge MCP for enhanced AI capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

[Specify your license here]

## Support

For issues and questions:
- Check the Forge documentation: https://developer.atlassian.com/platform/forge/
- Review Confluence API docs: https://developer.atlassian.com/cloud/confluence/rest/
- Open an issue in the repository

## Commit History

Suggested commit messages for the initial implementation:

- `feat: initial project setup with Forge manifest and TypeScript config`
- `feat: implement feed parser service for RSS/Atom feeds`
- `feat: add keyword filtering and topic classification`
- `feat: implement Confluence publisher service`
- `feat: add configuration management with Forge storage`
- `feat: implement scheduled trigger and news processor`
- `feat: add deduplication and state tracking`
- `feat: create admin UI for configuration management`
- `test: add unit tests for keyword filtering and hashing`
- `docs: add comprehensive README and setup instructions`

