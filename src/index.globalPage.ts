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
// The functionKey 'global-page-handler' matches the function key in manifest.yml
resolver.define('global-page-handler', async (req: any) => {
  logger.info('Global page handler called', { 
    req,
    payload: req.payload,
    hasPayload: !!req.payload,
    payloadKeys: req.payload ? Object.keys(req.payload) : []
  });
  
  // When using resolver with Custom UI, the payload structure can vary
  // Try to get action from different possible locations
  let action = req.payload?.action;
  
  // If action is not in payload, check if it's in the request directly
  if (!action && req.action) {
    action = req.action;
  }
  
  // If still no action, check if payload is nested
  if (!action && req.payload?.payload?.action) {
    action = req.payload.payload.action;
  }

  try {
    switch (action) {
      case 'getConfig':
        return {
          config: await loadConfig(),
        };

      case 'saveConfig':
        const config = (req.payload?.config || req.payload?.payload?.config) as AppConfig;
        await saveConfig(config);
        return { success: true };

      case 'upsertFeed':
        const feed = (req.payload?.feed || req.payload?.payload?.feed) as FeedConfig;
        await upsertFeed(feed);
        return { success: true };

      case 'removeFeed':
        const feedId = (req.payload?.feedId || req.payload?.payload?.feedId) as string;
        await removeFeed(feedId);
        return { success: true };

      case 'upsertTopicMapping':
        const mapping = (req.payload?.mapping || req.payload?.payload?.mapping) as TopicMapping;
        await upsertTopicMapping(mapping);
        return { success: true };

      case 'removeTopicMapping':
        const topic = (req.payload?.topic || req.payload?.payload?.topic) as string;
        await removeTopicMapping(topic);
        return { success: true };

      case 'processFeeds':
        // Manual trigger for feed processing
        const result = await processAllFeeds();
        return { success: true, result };

      default:
        logger.warn('Unknown action', { action });
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
// The handler receives calls from Custom UI bridge and routes them to the correct function
const handler = resolver.getDefinitions();

// Export the handler function for Forge runtime
// This is called when the function is invoked
export const globalPage = async (payload: any, context: any) => {
  logger.info('=== RESOLVER HANDLER CALLED ===', {
    payload,
    payloadString: JSON.stringify(payload),
    context: context ? Object.keys(context) : 'no context',
    payloadType: typeof payload,
    hasCall: payload?.call ? 'yes' : 'no',
    functionKey: payload?.call?.functionKey,
    payloadKeys: payload ? Object.keys(payload) : [],
  });
  
  try {
    const result = await handler(payload, context);
    logger.info('=== RESOLVER HANDLER RESULT ===', {
      resultType: typeof result,
      hasError: result?.error ? 'yes' : 'no',
      resultString: JSON.stringify(result).substring(0, 200),
    });
    return result;
  } catch (error) {
    logger.error('=== RESOLVER HANDLER ERROR ===', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : 'no stack',
    });
    throw error;
  }
};

// Also export run for backward compatibility
export const run = globalPage;

