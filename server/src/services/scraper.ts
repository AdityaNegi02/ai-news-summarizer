import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeArticle = async (url: string): Promise<string> => {
  try {
    console.log(`[SCRAPER] Fetching URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      maxRedirects: 5,
      timeout: 10000
    });

    const finalUrl = response.request.res.responseUrl || url;
    if (finalUrl !== url) {
      console.log(`[SCRAPER] Redirected to: ${finalUrl}`);
    }

    const $ = cheerio.load(response.data);

    // Check if we are stuck on a Google News redirect page
    if (finalUrl.includes('news.google.com/rss/articles') || finalUrl.includes('news.google.com/articles')) {
      console.log(`[SCRAPER] Still on Google News. Searching for final destination...`);
      
      // Google News RSS links often contain the base64 encoded destination or require JS.
      // We'll look for common patterns in the landing page.
      let destination = $('c-wiz a[href^="http"]').first().attr('href') || 
                        $('a[nonce]').attr('href') || 
                        $('a').filter((_, el) => $(el).text().includes('Click here if you are not redirected')).attr('href');

      // Check for meta refresh
      const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
      if (metaRefresh) {
        const match = metaRefresh.match(/url=(.*)/i);
        if (match && match[1]) destination = match[1];
      }

      if (destination) {
        if (destination.startsWith('./')) {
          destination = new URL(destination, 'https://news.google.com').href;
        }
        console.log(`[SCRAPER] Found destination: ${destination}. Retrying...`);
        return scrapeArticle(destination);
      } else {
        // Advanced: Google News often encodes the URL in a script tag or base64 in the URL itself
        // Try to find any absolute URL in scripts that isn't google.com or gstatic.com
        const scriptContent = $('script').map((_, el) => $(el).html()).get().join(' ');
        const urlMatch = scriptContent.match(/https?:\/\/(?!(?:[^\/]+\.)?(?:google\.com|gstatic\.com))[^\s"']+/);
        if (urlMatch) {
          destination = urlMatch[0];
          console.log(`[SCRAPER] Found potential destination in script: ${destination}. Retrying...`);
          return scrapeArticle(destination);
        }
        
        console.warn(`[SCRAPER] Could not find redirect link on Google News page.`);
      }
    }

    // Remove junk
    $('script, style, nav, footer, header, aside, .ads, .comments').remove();

    let articleText = '';
    const selectors = [
      'article', 'main', '.article-body', '.story-body', '.content', 
      '.post-content', '.entry-content', '.article__body', '.article-text'
    ];
    
    // Try to find the main container first
    for (const selector of selectors) {
      const container = $(selector);
      if (container.length > 0) {
        container.find('p').each((_, el) => {
          const pText = $(el).text().trim();
          if (pText.length > 30) articleText += pText + '\n';
        });
        if (articleText.length > 400) break;
      }
    }

    // Fallback: All paragraphs
    if (articleText.length < 200) {
      articleText = '';
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50) articleText += text + '\n';
      });
    }

    return articleText.trim();
  } catch (error: any) {
    console.error('[SCRAPER] Error:', error.message);
    throw new Error(`Failed to scrape: ${error.message}`);
  }
};
