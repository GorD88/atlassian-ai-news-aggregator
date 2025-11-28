/**
 * Main entry point for Forge functions
 */

import { processAllFeeds } from './services/newsProcessor';
import { logger } from './utils/logger';

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
 * Confluence publisher function (can be called directly if needed)
 */
export const confluencePublisher = async (req: any) => {
  logger.info('Confluence publisher called');
  // This can be used for direct publishing if needed
  return { message: 'Use processAllFeeds() for full processing' };
};

