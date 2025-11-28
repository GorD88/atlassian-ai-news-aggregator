/**
 * Keyword filtering and topic classification service
 */

import { NewsItem, FeedConfig, TopicMapping } from '../types/config';
import { logger } from '../utils/logger';

/**
 * Check if a text contains any of the given keywords (case-insensitive)
 */
function matchesKeywords(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  return keywords.filter((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    return lowerText.includes(lowerKeyword);
  });
}

/**
 * Filter news items by keywords and classify topics
 */
export function filterAndClassifyItems(
  items: NewsItem[],
  feedConfig: FeedConfig,
  topicMappings: TopicMapping[]
): NewsItem[] {
  if (feedConfig.keywords.length === 0) {
    logger.warn(`Feed ${feedConfig.name} has no keywords configured`);
    return [];
  }

  const filtered: NewsItem[] = [];

  for (const item of items) {
    // Check title, description, and content for keywords
    const searchText = `${item.title} ${item.description} ${item.content || ''}`;
    const matchedKeywords = matchesKeywords(searchText, feedConfig.keywords);

    if (matchedKeywords.length > 0) {
      // Find topics that match the keywords
      const topics = topicMappings
        .filter((mapping) => matchedKeywords.includes(mapping.topic))
        .map((mapping) => mapping.topic);

      const filteredItem: NewsItem = {
        ...item,
        matchedKeywords,
        topics: topics.length > 0 ? topics : matchedKeywords, // Use matched keywords as topics if no mapping
      };

      filtered.push(filteredItem);
      logger.debug(
        `Item "${item.title}" matched keywords: ${matchedKeywords.join(', ')}`
      );
    }
  }

  logger.info(
    `Filtered ${filtered.length} relevant items from ${items.length} total items for feed ${feedConfig.name}`
  );

  return filtered;
}

/**
 * Group items by their primary topic
 * If an item has multiple topics, use the first one
 */
export function groupItemsByTopic(items: NewsItem[]): Map<string, NewsItem[]> {
  const grouped = new Map<string, NewsItem[]>();

  for (const item of items) {
    const primaryTopic = item.topics.length > 0 ? item.topics[0] : 'uncategorized';
    if (!grouped.has(primaryTopic)) {
      grouped.set(primaryTopic, []);
    }
    grouped.get(primaryTopic)!.push(item);
  }

  return grouped;
}

