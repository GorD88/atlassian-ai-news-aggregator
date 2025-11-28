/**
 * Main news processing service
 * Orchestrates feed parsing, filtering, and publishing
 */

import { NewsItem, FeedConfig, TopicMapping, AppConfig } from '../types/config';
import { parseFeeds } from './feedParser';
import { filterAndClassifyItems, groupItemsByTopic } from './keywordFilter';
import { publishNewsItem, pageExists } from './confluencePublisher';
import { markItemProcessed, isItemProcessed, loadConfig } from './configManager';
import { logger } from '../utils/logger';

export interface ProcessingResult {
  totalFeeds: number;
  successfulFeeds: number;
  totalItems: number;
  filteredItems: number;
  publishedItems: number;
  skippedItems: number;
  errors: string[];
}

/**
 * Process all feeds and publish relevant news to Confluence
 */
export async function processAllFeeds(): Promise<ProcessingResult> {
  const config = await loadConfig();
  const result: ProcessingResult = {
    totalFeeds: config.feeds.length,
    successfulFeeds: 0,
    totalItems: 0,
    filteredItems: 0,
    publishedItems: 0,
    skippedItems: 0,
    errors: [],
  };

  logger.info(`Starting feed processing for ${config.feeds.length} feeds`);

  // Parse all feeds
  const parseResults = await parseFeeds(config.feeds);
  result.successfulFeeds = parseResults.filter((r) => !r.error).length;

  // Process each feed's items
  for (let i = 0; i < parseResults.length; i++) {
    const parseResult = parseResults[i];
    const feedConfig = config.feeds[i];

    if (parseResult.error) {
      result.errors.push(`Feed ${feedConfig.name}: ${parseResult.error}`);
      continue;
    }

    result.totalItems += parseResult.items.length;

    // Filter items by keywords
    const filteredItems = filterAndClassifyItems(
      parseResult.items,
      feedConfig,
      config.topicMappings
    );

    result.filteredItems += filteredItems.length;

    // Group items by topic
    const groupedItems = groupItemsByTopic(filteredItems);

    // Publish items to Confluence
    for (const [topic, items] of groupedItems.entries()) {
      const mapping = config.topicMappings.find((m) => m.topic === topic);

      if (!mapping) {
        logger.warn(`No mapping found for topic: ${topic}`);
        result.errors.push(`No mapping for topic: ${topic}`);
        continue;
      }

      for (const item of items) {
        try {
          // Check if already processed
          if (await isItemProcessed(item.id)) {
            logger.debug(`Skipping already processed item: ${item.title}`);
            result.skippedItems++;
            continue;
          }

          // Check if page already exists (by title)
          const exists = await pageExists(mapping.spaceKey, item.title);
          if (exists.exists) {
            logger.debug(`Page already exists for: ${item.title}`);
            await markItemProcessed(item.id, exists.pageId);
            result.skippedItems++;
            continue;
          }

          // Publish to Confluence
          const publishResult = await publishNewsItem(item, mapping);

          if (publishResult) {
            await markItemProcessed(
              item.id,
              publishResult.pageId,
              publishResult.pageUrl
            );
            result.publishedItems++;
            logger.info(`Published: ${item.title}`);
          } else {
            result.errors.push(`Failed to publish: ${item.title}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error processing item "${item.title}": ${errorMessage}`, error);
          result.errors.push(`Error processing "${item.title}": ${errorMessage}`);
        }
      }
    }
  }

  logger.info(
    `Processing complete: ${result.publishedItems} published, ${result.skippedItems} skipped, ${result.errors.length} errors`
  );

  return result;
}

