/**
 * Configuration types for the AI News Aggregator
 */

export interface FeedConfig {
  id: string;
  name: string;
  url: string;
  keywords: string[];
  enabled: boolean;
  lastProcessed?: string; // ISO timestamp
}

export interface TopicMapping {
  topic: string; // keyword or topic name
  spaceKey: string;
  parentPageId?: string; // optional parent page ID
  parentPageTitle?: string; // optional parent page title for lookup
}

export interface AppConfig {
  feeds: FeedConfig[];
  topicMappings: TopicMapping[];
  scheduleInterval: number; // minutes
  enableAISummarization: boolean;
  deduplicationWindow: number; // days to check for duplicates
}

export interface NewsItem {
  id: string; // unique identifier (hash or feed item ID)
  title: string;
  description: string;
  content?: string;
  link: string;
  pubDate: string; // ISO timestamp
  source: string; // feed name
  sourceUrl: string; // feed URL
  matchedKeywords: string[];
  topics: string[]; // derived topics from keyword matches
}

export interface ProcessedItem {
  itemId: string;
  processedAt: string; // ISO timestamp
  confluencePageId?: string;
  confluencePageUrl?: string;
}

