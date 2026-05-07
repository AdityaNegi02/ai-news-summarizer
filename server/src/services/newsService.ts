import Parser from 'rss-parser';

const parser = new Parser();

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export const searchNews = async (topic: string, location: string, timeframe: string): Promise<NewsArticle[]> => {
  // Construct the query: topic + location + timeframe
  // Example: "Elections Chicago when:1d"
  let query = `${topic} ${location}`.trim();
  if (timeframe) {
    query += ` when:${timeframe}`;
  }

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const feed = await parser.parseURL(url);
    
    return feed.items.map(item => ({
      title: item.title || 'No Title',
      link: item.link || '',
      pubDate: item.pubDate || '',
      // Google News titles are usually "Title - Source"
      source: item.title?.split(' - ').pop() || 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching news from RSS:', error);
    throw new Error('Failed to fetch news. Please try again later.');
  }
};
