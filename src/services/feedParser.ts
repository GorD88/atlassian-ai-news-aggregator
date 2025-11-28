/**
 * Feed parser service for RSS/Atom feeds
 */

import Parser from 'rss-parser';
import { FeedConfig, NewsItem } from '../types/config';
import { logger } from '../utils/logger';
import { generateItemId } from '../utils/hash';

const parser = new Parser({
  timeout: 10000,
  maxRedirects: 5,
});

export interface FeedParseResult {
  items: NewsItem[];
  error?: string;
}

/**
 * Parse a single feed and return news items
 */
export async function parseFeed(feedConfig: FeedConfig): Promise<FeedParseResult> {
  try {
    logger.info(`Parsing feed: ${feedConfig.name} (${feedConfig.url})`);

    const feed = await parser.parseURL(feedConfig.url);

    const items: NewsItem[] = (feed.items || []).map((item) => {
      const newsItem: NewsItem = {
        id: generateItemId({
          link: item.link || '',
          title: item.title || '',
          source: feedConfig.name,
        }),
        title: item.title || 'Untitled',
        description: item.contentSnippet || item.content || item.summary || '',
        content: item.content || item['content:encoded'] || item.description || '',
        link: item.link || '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        source: feedConfig.name,
        sourceUrl: feedConfig.url,
        matchedKeywords: [],
        topics: [],
      };

      return newsItem;
    });

    logger.info(`Parsed ${items.length} items from ${feedConfig.name}`);

    return { items };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error parsing feed ${feedConfig.name}: ${errorMessage}`, error);
    return {
      items: [],
      error: errorMessage,
    };
  }
}

/**
 * Parse multiple feeds in parallel
 */
export async function parseFeeds(feedConfigs: FeedConfig[]): Promise<FeedParseResult[]> {
  const enabledFeeds = feedConfigs.filter((feed) => feed.enabled);
  logger.info(`Parsing ${enabledFeeds.length} enabled feeds`);

  const results = await Promise.allSettled(
    enabledFeeds.map((feed) => parseFeed(feed))
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    logger.error('Feed parsing failed:', result.reason);
    return {
      items: [],
      error: result.reason?.message || 'Unknown error',
    };
  });
}

