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
    reqType: typeof req,
    reqKeys: req ? Object.keys(req) : [],
    payload: req.payload,
    hasPayload: !!req.payload,
    payloadType: typeof req.payload,
    payloadKeys: req.payload ? Object.keys(req.payload) : [],
    payloadString: JSON.stringify(req.payload).substring(0, 500)
  });
  
  // When using resolver with Custom UI, the payload structure can vary
  // The payload can be directly in req.payload or nested
  // Try to get action from different possible locations
  let action = req.payload?.action;
  let actualPayload = req.payload;
  
  // If action is not in payload, check if it's in the request directly
  if (!action && req.action) {
    action = req.action;
  }
  
  // If still no action, check if payload is nested
  if (!action && req.payload?.payload?.action) {
    action = req.payload.payload.action;
    actualPayload = req.payload.payload;
  }
  
  // If payload is the action itself (string), use it
  if (!action && typeof req.payload === 'string') {
    action = req.payload;
  }
  
  logger.info('Extracted action and payload', { action, actualPayload });

  try {
    switch (action) {
      case 'getConfig':
        return {
          config: await loadConfig(),
        };

      case 'saveConfig':
        const config = (actualPayload?.config || req.payload?.config || req.payload?.payload?.config) as AppConfig;
        await saveConfig(config);
        return { success: true };

      case 'upsertFeed':
        logger.info('UpsertFeed called', {
          actualPayload,
          reqPayload: req.payload,
          hasActualPayloadFeed: !!actualPayload?.feed,
          hasReqPayloadFeed: !!req.payload?.feed,
          hasNestedFeed: !!req.payload?.payload?.feed
        });
        const feed = (actualPayload?.feed || req.payload?.feed || req.payload?.payload?.feed) as FeedConfig;
        logger.info('Extracted feed', { feed, feedId: feed?.id, feedName: feed?.name });
        
        if (!feed) {
          logger.error('Feed is null or undefined', { actualPayload, reqPayload: req.payload });
          return { error: 'Feed data is missing' };
        }
        
        try {
          await upsertFeed(feed);
          logger.info('Feed upserted successfully', { feedId: feed.id });
          return { success: true };
        } catch (error) {
          logger.error('Error upserting feed', { error, feed });
          return { error: error instanceof Error ? error.message : 'Unknown error' };
        }

      case 'removeFeed':
        const feedId = (actualPayload?.feedId || req.payload?.feedId || req.payload?.payload?.feedId) as string;
        await removeFeed(feedId);
        return { success: true };

      case 'upsertTopicMapping':
        const mapping = (actualPayload?.mapping || req.payload?.mapping || req.payload?.payload?.mapping) as TopicMapping;
        await upsertTopicMapping(mapping);
        return { success: true };

      case 'removeTopicMapping':
        const topic = (actualPayload?.topic || req.payload?.topic || req.payload?.payload?.topic) as string;
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

