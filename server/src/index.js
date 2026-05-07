import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scrapeArticle } from './services/scraper';
import { analyzeArticle } from './services/openai';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
app.post('/api/analyze/url', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    try {
        const text = await scrapeArticle(url);
        if (!text) {
            return res.status(400).json({ error: 'Could not extract text from the provided URL' });
        }
        const analysis = await analyzeArticle(text);
        res.json({ ...analysis, originalLength: text.length });
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map