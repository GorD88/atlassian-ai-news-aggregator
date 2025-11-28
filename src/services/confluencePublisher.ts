/**
 * Confluence publisher service
 * Handles creating and updating pages in Confluence
 */

import api from '@forge/api';
import { NewsItem, TopicMapping } from '../types/config';
import { logger } from '../utils/logger';
import { ConfluencePage, CreatePageRequest } from '../types/confluence';


/**
 * Find a parent page by title in a space
 */
async function findParentPage(
  spaceKey: string,
  parentPageTitle?: string
): Promise<string | undefined> {
  if (!parentPageTitle) {
    return undefined;
  }

  try {
    const response = await api
      .asApp()
      .requestConfluence(
        `/wiki/rest/api/content?spaceKey=${spaceKey}&title=${encodeURIComponent(parentPageTitle)}&expand=version`
      );

    const data = await response.json();
    const pages = data.results || [];

    if (pages.length > 0) {
      return pages[0].id;
    }

    logger.warn(`Parent page "${parentPageTitle}" not found in space ${spaceKey}`);
    return undefined;
  } catch (error) {
    logger.error(`Error finding parent page: ${error}`);
    return undefined;
  }
}

/**
 * Generate Confluence storage format HTML from a news item
 */
function generatePageContent(item: NewsItem): string {
  const pubDate = new Date(item.pubDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<h2>Summary</h2>
<p>${item.description || 'No description available.'}</p>

<h2>Details</h2>
<table>
  <tr>
    <th>Source</th>
    <td>${item.source}</td>
  </tr>
  <tr>
    <th>Published</th>
    <td>${pubDate}</td>
  </tr>
  <tr>
    <th>Link</th>
    <td><a href="${item.link}">${item.link}</a></td>
  </tr>
  <tr>
    <th>Topics</th>
    <td>${item.topics.join(', ') || 'N/A'}</td>
  </tr>
</table>

${item.content ? `<h2>Full Content</h2><div>${item.content}</div>` : ''}

<hr/>
<p><em>Automatically aggregated by AI News Aggregator</em></p>
  `.trim();
}

/**
 * Create a Confluence page from a news item
 */
export async function publishNewsItem(
  item: NewsItem,
  mapping: TopicMapping
): Promise<{ pageId: string; pageUrl: string } | null> {
  try {
    logger.info(
      `Publishing item "${item.title}" to space ${mapping.spaceKey}, topic: ${mapping.topic}`
    );

    // Find parent page if specified
    let parentPageId: string | undefined;
    if (mapping.parentPageId) {
      parentPageId = mapping.parentPageId;
    } else if (mapping.parentPageTitle) {
      parentPageId = await findParentPage(mapping.spaceKey, mapping.parentPageTitle);
    }

    const content = generatePageContent(item);

    const createRequest: CreatePageRequest = {
      title: item.title,
      space: {
        key: mapping.spaceKey,
      },
      type: 'page',
      body: {
        storage: {
          value: content,
          representation: 'storage',
        },
      },
      ...(parentPageId && {
        ancestors: [{ id: parentPageId }],
      }),
    };

    const response = await api
      .asApp()
      .requestConfluence(`/wiki/rest/api/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createRequest),
      });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Confluence API error: ${response.status} - ${errorText}`);
    }

    const page: ConfluencePage = await response.json();
    const pageUrl = page._links?.webui
      ? `https://${new URL(page._links.webui).host}${page._links.webui}`
      : '';

    logger.info(`Successfully created page "${item.title}" with ID ${page.id}`);

    return {
      pageId: page.id,
      pageUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error publishing item "${item.title}": ${errorMessage}`, error);
    return null;
  }
}

/**
 * Check if a page with the same title already exists in the space
 */
export async function pageExists(
  spaceKey: string,
  title: string
): Promise<{ exists: boolean; pageId?: string }> {
  try {
    const response = await api
      .asApp()
      .requestConfluence(
        `/wiki/rest/api/content?spaceKey=${spaceKey}&title=${encodeURIComponent(title)}`
      );

    const data = await response.json();
    const pages = data.results || [];

    if (pages.length > 0) {
      return { exists: true, pageId: pages[0].id };
    }

    return { exists: false };
  } catch (error) {
    logger.error(`Error checking if page exists: ${error}`);
    return { exists: false };
  }
}

