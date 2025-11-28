/**
 * Unit tests for hash utilities
 */

import { generateItemId, hashString } from '../hash';
import { NewsItem } from '../../types/config';

describe('hash utilities', () => {
  describe('generateItemId', () => {
    it('should generate consistent IDs for the same item', () => {
      const item: Pick<NewsItem, 'link' | 'title' | 'source'> = {
        source: 'Test Feed',
        link: 'https://example.com/article',
        title: 'Test Article',
      };

      const id1 = generateItemId(item);
      const id2 = generateItemId(item);

      expect(id1).toBe(id2);
      expect(id1).toHaveLength(16);
    });

    it('should generate different IDs for different items', () => {
      const item1: Pick<NewsItem, 'link' | 'title' | 'source'> = {
        source: 'Test Feed',
        link: 'https://example.com/article1',
        title: 'Test Article 1',
      };

      const item2: Pick<NewsItem, 'link' | 'title' | 'source'> = {
        source: 'Test Feed',
        link: 'https://example.com/article2',
        title: 'Test Article 2',
      };

      const id1 = generateItemId(item1);
      const id2 = generateItemId(item2);

      expect(id1).not.toBe(id2);
    });

    it('should be sensitive to all fields', () => {
      const baseItem: Pick<NewsItem, 'link' | 'title' | 'source'> = {
        source: 'Test Feed',
        link: 'https://example.com/article',
        title: 'Test Article',
      };

      const id1 = generateItemId(baseItem);
      const id2 = generateItemId({ ...baseItem, title: 'Different Title' });
      const id3 = generateItemId({ ...baseItem, link: 'https://example.com/different' });
      const id4 = generateItemId({ ...baseItem, source: 'Different Feed' });

      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id1).not.toBe(id4);
    });
  });

  describe('hashString', () => {
    it('should generate consistent hashes for the same string', () => {
      const str = 'test string';
      const hash1 = hashString(str);
      const hash2 = hashString(str);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });

    it('should generate different hashes for different strings', () => {
      const hash1 = hashString('string 1');
      const hash2 = hashString('string 2');

      expect(hash1).not.toBe(hash2);
    });
  });
});

