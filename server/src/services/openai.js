import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
export const analyzeArticle = async (text) => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API Key is missing.');
    }
    const prompt = `
    Analyze the following news article text. Provide:
    1. A neutral, concise summary (max 3-4 sentences).
    2. A political bias assessment on a scale from -1 (Far Left) to 1 (Far Right), with a label and a brief explanation.
    3. An emotional bias assessment on a scale from 0 (Completely Neutral/Objective) to 1 (Highly Emotional/Sensationalist), with a label and a brief explanation.

    Return the result strictly as a JSON object with this structure:
    {
      "summary": "...",
      "politicalBias": { "score": 0.2, "label": "Center-Right", "explanation": "..." },
      "emotionalBias": { "score": 0.5, "label": "Moderate", "explanation": "..." }
    }

    Article Text:
    ${text.substring(0, 12000)} // Limiting text to stay within context limits
  `;
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });
        const content = response.choices[0].message.content;
        if (!content)
            throw new Error('No content returned from OpenAI');
        return JSON.parse(content);
    }
    catch (error) {
        console.error('OpenAI analysis error:', error);
        throw new Error('Failed to analyze the article with AI.');
    }
};
//# sourceMappingURL=openai.js.map