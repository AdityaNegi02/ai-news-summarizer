import axios from 'axios';
import * as cheerio from 'cheerio';
export const scrapeArticle = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        // Remove scripts, styles, and nav elements that might contain junk text
        $('script, style, nav, footer, header, aside').remove();
        let articleText = '';
        // Common article selectors
        const selectors = ['article p', 'main p', '.article-body p', '.story-body p', '.content p'];
        for (const selector of selectors) {
            const paragraphs = $(selector);
            if (paragraphs.length > 0) {
                paragraphs.each((_, el) => {
                    articleText += $(el).text() + '\n';
                });
                break;
            }
        }
        // Fallback if no specific selector matched
        if (!articleText) {
            $('p').each((_, el) => {
                const text = $(el).text().trim();
                if (text.length > 50) { // Filter out short fragments
                    articleText += text + '\n';
                }
            });
        }
        return articleText.trim();
    }
    catch (error) {
        console.error('Scraping error:', error);
        throw new Error('Failed to scrape the article. Please check the URL.');
    }
};
//# sourceMappingURL=scraper.js.map