# Architecture Overview

## System Architecture

The AI News Aggregator is built as a Forge app with a modular, service-oriented architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Forge Runtime                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐      ┌──────────────────────────┐   │
│  │ Admin UI     │──────│  Configuration Manager   │   │
│  │ (HTML/JS)    │      │  (Forge Storage)          │   │
│  └──────────────┘      └──────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Scheduled Trigger (Every 6 hours)        │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                 │
│                        ▼                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │            News Processor (Orchestrator)        │  │
│  └──────────────────────────────────────────────────┘  │
│         │                    │                    │     │
│         ▼                    ▼                    ▼     │
│  ┌──────────┐      ┌──────────────┐    ┌────────────┐ │
│  │   Feed   │      │   Keyword    │    │ Confluence │ │
│  │  Parser  │─────▶│   Filter     │───▶│ Publisher  │ │
│  └──────────┘      └──────────────┘    └────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    RSS/Atom Feeds    Topic Mappings      Confluence API
```

## Key Components

### 1. Feed Parser (`src/services/feedParser.ts`)

**Responsibility**: Parse RSS/Atom feeds from configured sources

**Key Features**:
- Uses `rss-parser` library for robust feed parsing
- Handles multiple feed formats (RSS 2.0, Atom, etc.)
- Error handling per feed (doesn't fail entire batch)
- Generates unique IDs for each item

**Input**: Feed configuration (URL, name, keywords)
**Output**: Array of news items with metadata

### 2. Keyword Filter (`src/services/keywordFilter.ts`)

**Responsibility**: Filter and classify news items by keywords

**Key Features**:
- Case-insensitive keyword matching
- Searches title, description, and content
- Maps matched keywords to topics
- Groups items by primary topic

**Input**: News items, feed keywords, topic mappings
**Output**: Filtered and classified news items

### 3. Confluence Publisher (`src/services/confluencePublisher.ts`)

**Responsibility**: Create pages in Confluence

**Key Features**:
- Creates structured Confluence pages
- Supports parent page hierarchy
- Generates HTML content in Confluence storage format
- Checks for existing pages to avoid duplicates
- Error handling and logging

**Input**: News items, topic mappings
**Output**: Created Confluence pages with IDs and URLs

### 4. Configuration Manager (`src/services/configManager.ts`)

**Responsibility**: Manage app configuration and state

**Key Features**:
- Stores configuration in Forge storage
- Manages feed configurations
- Manages topic mappings
- Tracks processed items for deduplication
- Automatic cleanup of old processed items

**Storage Keys**:
- `app_config`: Main configuration
- `processed_items`: Deduplication tracking

### 5. News Processor (`src/services/newsProcessor.ts`)

**Responsibility**: Orchestrate the entire processing pipeline

**Key Features**:
- Coordinates all services
- Handles errors gracefully
- Tracks processing statistics
- Implements deduplication logic
- Groups items by topic before publishing

**Flow**:
1. Load configuration
2. Parse all feeds
3. Filter items by keywords
4. Group by topic
5. Check for duplicates
6. Publish to Confluence
7. Mark items as processed

### 6. Admin UI (`static/admin-page.html`)

**Responsibility**: Provide web interface for configuration

**Key Features**:
- Add/edit/remove feeds
- Configure topic mappings
- Adjust settings
- Manual feed processing trigger
- Real-time status updates

**API Integration**:
- Uses Forge's `invoke` function to call backend
- Function key: `admin-page` (matches manifest.yml)

## Data Flow

### Scheduled Processing Flow

```
1. Scheduled Trigger Fires (Every 6 hours)
   │
   ▼
2. News Processor Starts
   │
   ├─▶ Load Configuration from Storage
   │
   ├─▶ For Each Feed:
   │   │
   │   ├─▶ Parse Feed (Feed Parser)
   │   │   └─▶ Generate Item IDs
   │   │
   │   ├─▶ Filter by Keywords (Keyword Filter)
   │   │   └─▶ Classify Topics
   │   │
   │   └─▶ Group by Topic
   │
   ├─▶ For Each Topic Group:
   │   │
   │   ├─▶ Check Deduplication (Config Manager)
   │   │
   │   ├─▶ Check if Page Exists (Confluence Publisher)
   │   │
   │   └─▶ Publish to Confluence (Confluence Publisher)
   │       └─▶ Mark as Processed (Config Manager)
   │
   └─▶ Return Processing Results
```

### Configuration Management Flow

```
Admin UI Action
   │
   ▼
Backend Function (admin-page)
   │
   ├─▶ getConfig → Load from Storage
   │
   ├─▶ upsertFeed → Update Storage
   │
   ├─▶ removeFeed → Update Storage
   │
   ├─▶ upsertTopicMapping → Update Storage
   │
   ├─▶ removeTopicMapping → Update Storage
   │
   ├─▶ saveConfig → Update Storage
   │
   └─▶ processFeeds → Trigger News Processor
```

## Design Decisions

### 1. Modular Architecture

**Decision**: Separate services by responsibility
**Rationale**: 
- Easier to test individual components
- Clear separation of concerns
- Easier to maintain and extend

### 2. Forge Storage for Configuration

**Decision**: Use Forge storage instead of config files
**Rationale**:
- Persistent across deployments
- Accessible from all functions
- No need to redeploy for config changes
- Supports admin UI updates

### 3. Deduplication Strategy

**Decision**: Track processed items by hash of (source, link, title)
**Rationale**:
- Handles feeds that republish items
- Works across different feed sources
- Configurable retention window
- Efficient storage

### 4. Topic Grouping

**Decision**: Use first matched topic as primary topic
**Rationale**:
- Simple and predictable
- Avoids duplicate pages
- Can be extended to support multiple pages per item

### 5. Error Handling

**Decision**: Continue processing on individual failures
**Rationale**:
- One bad feed doesn't stop all processing
- Errors are logged for debugging
- Processing statistics show success/failure counts

### 6. Static HTML Admin UI

**Decision**: Use static HTML instead of React/Forge UI
**Rationale**:
- Simpler deployment
- No build step for UI
- Easier to customize
- Works with Forge's admin page feature

## Security Considerations

1. **Permissions**: Minimal required permissions
   - Confluence: read/write only to configured spaces
   - Storage: app-scoped (not user data)
   - External fetch: only to configured feed URLs

2. **Input Validation**: 
   - Feed URLs validated
   - Space keys validated
   - Keywords sanitized

3. **Error Messages**: 
   - Don't expose sensitive information
   - Log detailed errors server-side
   - Show user-friendly messages in UI

## Performance Considerations

1. **Parallel Processing**: 
   - Feeds parsed in parallel
   - Items processed sequentially to avoid rate limits

2. **Deduplication**:
   - Efficient hash-based lookup
   - Automatic cleanup of old items

3. **Rate Limiting**:
   - Sequential publishing to avoid Confluence API limits
   - Error handling with retries (future enhancement)

4. **Storage Efficiency**:
   - Only store essential processed item metadata
   - Automatic cleanup of old items

## Extensibility

The architecture supports easy extension:

1. **New Feed Types**: Add parsers in `feedParser.ts`
2. **AI Features**: Add summarization in `confluencePublisher.ts`
3. **New Filters**: Extend `keywordFilter.ts` with ML classification
4. **Additional Publishers**: Add new publisher services
5. **Notifications**: Add notification service in `newsProcessor.ts`

## Testing Strategy

1. **Unit Tests**: Core logic (filtering, hashing)
2. **Integration Tests**: Feed parsing, Confluence API (future)
3. **Manual Testing**: Admin UI, scheduled triggers

## Future Enhancements

1. **AI Summarization**: Use Forge MCP or external AI APIs
2. **Update Existing Pages**: Instead of always creating new pages
3. **Email Notifications**: Notify on new items
4. **Advanced Classification**: ML-based topic classification
5. **Multi-language Support**: Support feeds in different languages
6. **Analytics**: Track which topics get the most items

