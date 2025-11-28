/**
 * Unit tests for keyword filtering service
 */

import { filterAndClassifyItems, groupItemsByTopic } from '../keywordFilter';
import { NewsItem, FeedConfig, TopicMapping } from '../../types/config';

describe('keywordFilter', () => {
  const mockFeedConfig: FeedConfig = {
    id: 'test-feed',
    name: 'Test Feed',
    url: 'https://example.com/feed',
    keywords: ['Rovo Agent', 'AI', 'Atlassian Intelligence'],
    enabled: true,
  };

  const mockTopicMappings: TopicMapping[] = [
    {
      topic: 'Rovo Agent',
      spaceKey: 'AI',
      parentPageTitle: 'Rovo Agent Updates',
    },
    {
      topic: 'AI',
      spaceKey: 'AI',
      parentPageTitle: 'General AI Updates',
    },
  ];

  describe('filterAndClassifyItems', () => {
    it('should filter items that match keywords', () => {
      const items: NewsItem[] = [
        {
          id: '1',
          title: 'New Rovo Agent Features',
          description: 'Check out the latest Rovo Agent capabilities',
          link: 'https://example.com/1',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: [],
          topics: [],
        },
        {
          id: '2',
          title: 'Weather Update',
          description: 'Today will be sunny',
          link: 'https://example.com/2',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: [],
          topics: [],
        },
      ];

      const filtered = filterAndClassifyItems(items, mockFeedConfig, mockTopicMappings);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('New Rovo Agent Features');
      expect(filtered[0].matchedKeywords).toContain('Rovo Agent');
      expect(filtered[0].topics).toContain('Rovo Agent');
    });

    it('should match keywords case-insensitively', () => {
      const items: NewsItem[] = [
        {
          id: '1',
          title: 'New ai features',
          description: 'Artificial intelligence updates',
          link: 'https://example.com/1',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: [],
          topics: [],
        },
      ];

      const filtered = filterAndClassifyItems(items, mockFeedConfig, mockTopicMappings);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].matchedKeywords).toContain('AI');
    });

    it('should search in title, description, and content', () => {
      const items: NewsItem[] = [
        {
          id: '1',
          title: 'Regular Title',
          description: 'Regular description',
          content: 'This article mentions Rovo Agent in the content',
          link: 'https://example.com/1',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: [],
          topics: [],
        },
      ];

      const filtered = filterAndClassifyItems(items, mockFeedConfig, mockTopicMappings);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].matchedKeywords).toContain('Rovo Agent');
    });

    it('should return empty array if no keywords match', () => {
      const items: NewsItem[] = [
        {
          id: '1',
          title: 'Unrelated Article',
          description: 'This has nothing to do with AI',
          link: 'https://example.com/1',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: [],
          topics: [],
        },
      ];

      const filtered = filterAndClassifyItems(items, mockFeedConfig, mockTopicMappings);

      expect(filtered).toHaveLength(0);
    });

    it('should handle feed with no keywords', () => {
      const feedWithoutKeywords: FeedConfig = {
        ...mockFeedConfig,
        keywords: [],
      };

      const items: NewsItem[] = [
        {
          id: '1',
          title: 'Some Article',
          description: 'Some description',
          link: 'https://example.com/1',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: [],
          topics: [],
        },
      ];

      const filtered = filterAndClassifyItems(items, feedWithoutKeywords, mockTopicMappings);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('groupItemsByTopic', () => {
    it('should group items by primary topic', () => {
      const items: NewsItem[] = [
        {
          id: '1',
          title: 'Rovo Agent Article',
          description: 'About Rovo Agent',
          link: 'https://example.com/1',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: ['Rovo Agent'],
          topics: ['Rovo Agent'],
        },
        {
          id: '2',
          title: 'AI Article',
          description: 'About AI',
          link: 'https://example.com/2',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: ['AI'],
          topics: ['AI'],
        },
        {
          id: '3',
          title: 'Another Rovo Agent Article',
          description: 'More about Rovo Agent',
          link: 'https://example.com/3',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: ['Rovo Agent'],
          topics: ['Rovo Agent'],
        },
      ];

      const grouped = groupItemsByTopic(items);

      expect(grouped.has('Rovo Agent')).toBe(true);
      expect(grouped.get('Rovo Agent')).toHaveLength(2);
      expect(grouped.has('AI')).toBe(true);
      expect(grouped.get('AI')).toHaveLength(1);
    });

    it('should use first topic when item has multiple topics', () => {
      const items: NewsItem[] = [
        {
          id: '1',
          title: 'Multi-topic Article',
          description: 'About both Rovo Agent and AI',
          link: 'https://example.com/1',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: ['Rovo Agent', 'AI'],
          topics: ['Rovo Agent', 'AI'],
        },
      ];

      const grouped = groupItemsByTopic(items);

      expect(grouped.has('Rovo Agent')).toBe(true);
      expect(grouped.get('Rovo Agent')).toHaveLength(1);
      expect(grouped.has('AI')).toBe(false);
    });

    it('should use "uncategorized" for items with no topics', () => {
      const items: NewsItem[] = [
        {
          id: '1',
          title: 'No Topic Article',
          description: 'No topics assigned',
          link: 'https://example.com/1',
          pubDate: new Date().toISOString(),
          source: 'Test Feed',
          sourceUrl: 'https://example.com/feed',
          matchedKeywords: [],
          topics: [],
        },
      ];

      const grouped = groupItemsByTopic(items);

      expect(grouped.has('uncategorized')).toBe(true);
      expect(grouped.get('uncategorized')).toHaveLength(1);
    });
  });
});

