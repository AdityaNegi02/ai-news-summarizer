import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AnalysisResult {
  summary: string;
  politicalBias: {
    score: number;
    label: string;
    explanation: string;
  };
  emotionalBias: {
    score: number;
    label: string;
    explanation: string;
  };
  extractedText?: string;
}

// FORCE UPDATE: Using gemini-2.5-flash as verified by list-models
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash'
});

export const analyzeArticle = async (text: string): Promise<AnalysisResult> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in .env file.');
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
    ${text.substring(0, 30000)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = response.text();
    
    if (!content) throw new Error('No content returned from Gemini');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    const analysis = JSON.parse(content) as AnalysisResult;
    return { ...analysis, extractedText: text };
  } catch (error: any) {
    console.error('Gemini analysis error:', error);
    throw new Error(`AI Analysis failed: ${error.message}`);
  }
};

export const chatWithArticle = async (articleText: string, question: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[]) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in .env file.');
  }

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: `You are a helpful assistant. Here is a news article you will help me discuss:\n\n${articleText.substring(0, 30000)}` }],
      },
      {
        role: 'model',
        parts: [{ text: "I have read the article. What would you like to know about it?" }],
      },
      ...history,
    ],
  });

  const result = await chat.sendMessage(question);
  const response = await result.response;
  return response.text();
};
