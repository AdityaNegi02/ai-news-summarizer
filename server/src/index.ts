import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scrapeArticle } from './services/scraper.js';
import { analyzeArticle, chatWithArticle } from './services/gemini.js';
import { searchNews } from './services/newsService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/news/search', async (req, res) => {
  const { topic, location, timeframe } = req.query;
  try {
    const articles = await searchNews(
      (topic as string) || '',
      (location as string) || '',
      (timeframe as string) || ''
    );
    res.json(articles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze/url', async (req, res) => {
  const { url } = req.body;
  console.log(`[POST] /api/analyze/url - Processing: ${url}`);
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`[SCRAPER] Starting extraction...`);
    const text = await scrapeArticle(url);
    
    if (!text || text.length < 100) {
      console.warn(`[SCRAPER] Extraction failed or text too short (Length: ${text?.length || 0})`);
      return res.status(400).json({ error: 'Could not extract enough text from the provided URL. The site might be protected or have a complex structure.' });
    }

    console.log(`[SCRAPER] Success! Extracted ${text.length} characters.`);
    console.log(`[GEMINI] Starting AI analysis...`);
    
    const analysis = await analyzeArticle(text);
    
    console.log(`[GEMINI] Analysis complete.`);
    res.json({ ...analysis, originalLength: text.length });
  } catch (error: any) {
    console.error(`[ERROR] Analysis failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze/text', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const analysis = await analyzeArticle(text);
    res.json({ ...analysis, originalLength: text.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { articleText, question, history } = req.body;
  if (!articleText || !question) {
    return res.status(400).json({ error: 'Article text and question are required' });
  }

  try {
    const answer = await chatWithArticle(articleText, question, history || []);
    res.json({ answer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
