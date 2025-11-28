/**
 * Configuration manager using Forge storage
 */

import { storage } from '@forge/api';
import { AppConfig, FeedConfig, TopicMapping, ProcessedItem } from '../types/config';
import { logger } from '../utils/logger';

const STORAGE_KEYS = {
  APP_CONFIG: 'app_config',
  PROCESSED_ITEMS: 'processed_items',
} as const;

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AppConfig = {
  feeds: [
    {
      id: 'atlassian-blog',
      name: 'Atlassian Blog',
      url: 'https://www.atlassian.com/blog/feed',
      keywords: ['Rovo Agent', 'Rovo Dev CLI', 'Atlassian Intelligence', 'AI', 'Artificial Intelligence'],
      enabled: true,
    },
    {
      id: 'atlassian-developer-blog',
      name: 'Atlassian Developer Blog',
      url: 'https://developer.atlassian.com/blog/feed',
      keywords: ['Rovo', 'AI', 'Forge', 'Intelligence'],
      enabled: true,
    },
  ],
  topicMappings: [
    {
      topic: 'Rovo Agent',
      spaceKey: 'AI', // Replace with your actual space key
      parentPageTitle: 'Rovo Agent Updates',
    },
    {
      topic: 'Rovo Dev CLI',
      spaceKey: 'AI',
      parentPageTitle: 'Rovo Dev CLI Updates',
    },
    {
      topic: 'Atlassian Intelligence',
      spaceKey: 'AI',
      parentPageTitle: 'Atlassian Intelligence Updates',
    },
  ],
  scheduleInterval: 360, // 6 hours in minutes
  enableAISummarization: false,
  deduplicationWindow: 30, // days
};

/**
 * Load app configuration from storage
 */
export async function loadConfig(): Promise<AppConfig> {
  try {
    const stored = await storage.get(STORAGE_KEYS.APP_CONFIG);
    if (stored) {
      logger.info('Loaded configuration from storage');
      return stored as AppConfig;
    }
  } catch (error) {
    logger.warn('Error loading config from storage, using defaults', error);
  }

  // Return default config if nothing stored
  logger.info('Using default configuration');
  return DEFAULT_CONFIG;
}

/**
 * Save app configuration to storage
 */
export async function saveConfig(config: AppConfig): Promise<void> {
  try {
    await storage.set(STORAGE_KEYS.APP_CONFIG, config);
    logger.info('Configuration saved to storage');
  } catch (error) {
    logger.error('Error saving configuration', error);
    throw error;
  }
}

/**
 * Add or update a feed configuration
 */
export async function upsertFeed(feed: FeedConfig): Promise<void> {
  const config = await loadConfig();
  const existingIndex = config.feeds.findIndex((f) => f.id === feed.id);

  if (existingIndex >= 0) {
    config.feeds[existingIndex] = feed;
  } else {
    config.feeds.push(feed);
  }

  await saveConfig(config);
}

/**
 * Remove a feed configuration
 */
export async function removeFeed(feedId: string): Promise<void> {
  const config = await loadConfig();
  config.feeds = config.feeds.filter((f) => f.id !== feedId);
  await saveConfig(config);
}

/**
 * Add or update a topic mapping
 */
export async function upsertTopicMapping(mapping: TopicMapping): Promise<void> {
  const config = await loadConfig();
  const existingIndex = config.topicMappings.findIndex((m) => m.topic === mapping.topic);

  if (existingIndex >= 0) {
    config.topicMappings[existingIndex] = mapping;
  } else {
    config.topicMappings.push(mapping);
  }

  await saveConfig(config);
}

/**
 * Remove a topic mapping
 */
export async function removeTopicMapping(topic: string): Promise<void> {
  const config = await loadConfig();
  config.topicMappings = config.topicMappings.filter((m) => m.topic !== topic);
  await saveConfig(config);
}

/**
 * Load processed items (for deduplication)
 */
export async function loadProcessedItems(): Promise<Map<string, ProcessedItem>> {
  try {
    const stored = await storage.get(STORAGE_KEYS.PROCESSED_ITEMS);
    if (stored && typeof stored === 'object') {
      return new Map(Object.entries(stored as Record<string, ProcessedItem>));
    }
  } catch (error) {
    logger.warn('Error loading processed items', error);
  }

  return new Map();
}

/**
 * Save processed items
 */
export async function saveProcessedItems(items: Map<string, ProcessedItem>): Promise<void> {
  try {
    const itemsObj = Object.fromEntries(items);
    await storage.set(STORAGE_KEYS.PROCESSED_ITEMS, itemsObj);
  } catch (error) {
    logger.error('Error saving processed items', error);
    throw error;
  }
}

/**
 * Mark an item as processed
 */
export async function markItemProcessed(
  itemId: string,
  confluencePageId?: string,
  confluencePageUrl?: string
): Promise<void> {
  const processedItems = await loadProcessedItems();
  processedItems.set(itemId, {
    itemId,
    processedAt: new Date().toISOString(),
    confluencePageId,
    confluencePageUrl,
  });

  // Keep only items from the last N days (based on config)
  const config = await loadConfig();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.deduplicationWindow);

  for (const [id, item] of processedItems.entries()) {
    const processedDate = new Date(item.processedAt);
    if (processedDate < cutoffDate) {
      processedItems.delete(id);
    }
  }

  await saveProcessedItems(processedItems);
}

/**
 * Check if an item has been processed
 */
export async function isItemProcessed(itemId: string): Promise<boolean> {
  const processedItems = await loadProcessedItems();
  return processedItems.has(itemId);
}

