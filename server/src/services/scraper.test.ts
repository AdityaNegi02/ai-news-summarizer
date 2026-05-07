import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { scrapeArticle } from './scraper.js';

vi.mock('axios');

describe('scraper service', () => {
  it('should extract text from a valid article structure', async () => {
    const mockHtml = `
      <html>
        <body>
          <article>
            <p>This is the first paragraph of the news article.</p>
            <p>This is the second paragraph.</p>
          </article>
        </body>
      </html>
    `;
    
    (axios.get as any).mockResolvedValue({ data: mockHtml });

    const result = await scrapeArticle('https://example.com/news');
    
    expect(result).toContain('This is the first paragraph');
    expect(result).toContain('This is the second paragraph');
  });

  it('should fallback to general p tags if no article tag is found', async () => {
    const mockHtml = `
      <html>
        <body>
          <p>Some random content that is long enough to be caught by the fallback logic because it has more than fifty characters.</p>
        </body>
      </html>
    `;
    
    (axios.get as any).mockResolvedValue({ data: mockHtml });

    const result = await scrapeArticle('https://example.com/fallback');
    
    expect(result).toContain('Some random content');
  });

  it('should throw an error on failed fetch', async () => {
    (axios.get as any).mockRejectedValue(new Error('Network error'));

    await expect(scrapeArticle('https://invalid-url.com')).rejects.toThrow('Failed to scrape the article');
  });
});
