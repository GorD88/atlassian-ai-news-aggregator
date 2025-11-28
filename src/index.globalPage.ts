/**
 * Global page entry point
 * 
 * For Custom UI with resolver, we need to export the handler function
 * that processes all resolver calls. The resolver function name in manifest.yml
 * points to this handler.
 * 
 * IMPORTANT: The resolver must be defined in the same file where getDefinitions() is called
 * to ensure all definitions are registered before the handler is created.
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

// Create resolver instance in this file
const resolver = new Resolver();

// Define the handler function
resolver.define('global-page-handler', async (req: any) => {
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
});

// Export the resolver definitions handler
// This handler receives calls from Custom UI bridge and routes them to the correct function
// For resolver, we export both 'run' (for Forge runtime) and 'handler' (for resolver)
export const run = resolver.getDefinitions();
export const handler = resolver.getDefinitions();

