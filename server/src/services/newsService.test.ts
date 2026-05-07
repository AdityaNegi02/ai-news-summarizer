import { describe, it, expect, vi } from 'vitest';
import { searchNews } from './newsService.js';
import Parser from 'rss-parser';

vi.mock('rss-parser');

describe('newsService', () => {
  it('should fetch and format news from Google RSS', async () => {
    const mockFeed = {
      items: [
        { title: 'Local News - The Times', link: 'https://times.com/1', pubDate: '2026-05-06' },
        { title: 'Global Event - BBC', link: 'https://bbc.com/2', pubDate: '2026-05-06' }
      ]
    };

    (Parser.prototype.parseURL as any).mockResolvedValue(mockFeed);

    const result = await searchNews('politics', 'chicago', '1d');

    expect(result).toHaveLength(2);
    expect(result[0]?.source).toBe('The Times');
    expect(result[1]?.source).toBe('BBC');
  });
});
