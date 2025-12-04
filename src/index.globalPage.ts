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
// For Custom UI with resolver, when using callBridge, the payload comes directly
resolver.define('global-page-handler', async (req: any) => {
  logger.info('Global page handler called', { 
    reqType: typeof req,
    reqKeys: req ? Object.keys(req) : [],
    reqString: JSON.stringify(req).substring(0, 500),
    payload: req.payload,
    hasPayload: !!req.payload,
    payloadType: typeof req.payload,
    payloadKeys: req.payload ? Object.keys(req.payload) : [],
    payloadString: JSON.stringify(req.payload).substring(0, 500),
    // Check if req itself is the payload (when using callBridge)
    reqIsPayload: req.action ? 'yes' : 'no'
  });
  
  // When using resolver with Custom UI and callBridge, the payload structure can vary:
  // 1. req.payload contains the data
  // 2. req itself might be the payload (when callBridge passes it directly)
  // 3. req.payload.payload might contain nested data
  
  let action: string | undefined;
  let actualPayload: any;
  
  // First, check if req itself is the payload (common with callBridge)
  if (req.action) {
    action = req.action;
    actualPayload = req;
    logger.info('Using req as payload (callBridge format)');
  }
  // Then check req.payload
  else if (req.payload?.action) {
    action = req.payload.action;
    actualPayload = req.payload;
    logger.info('Using req.payload');
  }
  // Check nested payload
  else if (req.payload?.payload?.action) {
    action = req.payload.payload.action;
    actualPayload = req.payload.payload;
    logger.info('Using nested req.payload.payload');
  }
  // If payload is a string, it might be the action
  else if (typeof req.payload === 'string') {
    action = req.payload;
    actualPayload = {};
    logger.info('Using req.payload as action string');
  }
  // Last resort: check if req has action directly
  else if (req.action) {
    action = req.action;
    actualPayload = req;
    logger.info('Using req.action directly');
  }
  
  logger.info('Extracted action and payload', { action, actualPayload, actualPayloadKeys: actualPayload ? Object.keys(actualPayload) : [] });

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
// For Custom UI with resolver, the payload structure is: { call: { functionKey: '...', payload: {...} } }
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
    // The resolver handler expects the payload in the format: { call: { functionKey: '...', payload: {...} } }
    // But when using callBridge, it might come in a different format
    // Let's ensure the payload is in the correct format
    let processedPayload = payload;
    
    // If payload doesn't have 'call' structure, wrap it
    if (!payload?.call && payload) {
      // Check if it's already the payload we need
      if (payload.action || payload.feed || payload.config) {
        // This is the actual payload, wrap it in call structure
        processedPayload = {
          call: {
            functionKey: 'global-page-handler',
            payload: payload
          }
        };
        logger.info('Wrapped payload in call structure', { processedPayload });
      }
    }
    
    const result = await handler(processedPayload, context);
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

