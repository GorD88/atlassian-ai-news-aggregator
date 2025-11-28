/**
 * Main entry point for Forge functions
 */

import Resolver from '@forge/resolver';
import { processAllFeeds } from './services/newsProcessor';
import {
  loadConfig,
  saveConfig,
  upsertFeed,
  removeFeed,
  upsertTopicMapping,
  removeTopicMapping,
} from './services/configManager';
import { logger } from './utils/logger';
import { AppConfig, FeedConfig, TopicMapping } from './types/config';

const resolver = new Resolver();

/**
 * Scheduled trigger handler
 * Runs periodically to process feeds and publish news
 */
export const scheduledTrigger = async (context: any) => {
  logger.info('Scheduled trigger fired');
  try {
    const result = await processAllFeeds();
    logger.info('Scheduled processing completed', result);
  } catch (error) {
    logger.error('Error in scheduled trigger', error);
    throw error;
  }
};

/**
 * Global page handler
 * Provides UI for configuration management
 */
export const globalPage = async (req: any) => {
  const action = req.payload?.action;

  try {
    switch (action) {
      case 'getConfig':
        return {
          config: await loadConfig(),
        };

      case 'saveConfig':
        const config = req.payload.config as AppConfig;
        await saveConfig(config);
        return { success: true };

      case 'upsertFeed':
        const feed = req.payload.feed as FeedConfig;
        await upsertFeed(feed);
        return { success: true };

      case 'removeFeed':
        const feedId = req.payload.feedId as string;
        await removeFeed(feedId);
        return { success: true };

      case 'upsertTopicMapping':
        const mapping = req.payload.mapping as TopicMapping;
        await upsertTopicMapping(mapping);
        return { success: true };

      case 'removeTopicMapping':
        const topic = req.payload.topic as string;
        await removeTopicMapping(topic);
        return { success: true };

      case 'processFeeds':
        // Manual trigger for feed processing
        const result = await processAllFeeds();
        return { success: true, result };

      default:
        return { error: 'Unknown action' };
    }
  } catch (error) {
    logger.error('Error in global page handler', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Confluence publisher function (can be called directly if needed)
 */
export const confluencePublisher = async (req: any) => {
  logger.info('Confluence publisher called');
  // This can be used for direct publishing if needed
  return { message: 'Use processAllFeeds() for full processing' };
};

