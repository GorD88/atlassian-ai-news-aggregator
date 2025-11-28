/**
 * Global page entry point
 * 
 * For Custom UI with resolver, we need to export the handler function
 * that processes all resolver calls. The resolver function name in manifest.yml
 * points to this handler.
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

// Create resolver instance
const resolver = new Resolver();

// Define the handler function
// When using resolver, the functionKey in resolver.define() should match
// what we call from Custom UI, but the actual handler receives the payload directly
resolver.define('global-page-handler', async (req: any) => {
  // For resolver, req.payload contains the actual payload sent from Custom UI
  // (not wrapped in call.functionKey structure)
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
// This is the handler that Forge runtime will call when resolver is used
export const run = resolver.getDefinitions();

