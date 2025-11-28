/**
 * Utility functions for generating hashes/IDs from content
 */

import { createHash } from 'crypto';
import { NewsItem } from '../types/config';

/**
 * Generate a unique hash from a news item
 * Used for deduplication
 */
export function generateItemId(item: Pick<NewsItem, 'link' | 'title' | 'source'>): string {
  const content = `${item.source}|${item.link}|${item.title}`;
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Generate a simple hash from a string
 */
export function hashString(str: string): string {
  return createHash('sha256').update(str).digest('hex').substring(0, 16);
}

