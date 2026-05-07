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
}

// Reverting to default (v1beta) but using the stable model name
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash'
});

export const analyzeArticle = async (text: string): Promise<AnalysisResult> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in .env file.');
  }

  const prompt = `
    Analyze the following news article text. 
    Return strictly a JSON object with this exact structure:
    {
      "summary": "3-4 neutral sentences",
      "politicalBias": { "score": number between -1 and 1, "label": "string", "explanation": "string" },
      "emotionalBias": { "score": number between 0 and 1, "label": "string", "explanation": "string" }
    }

    Article Text:
    ${text.substring(0, 30000)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = response.text();
    
    if (!content) throw new Error('No content returned from Gemini');

    // Robust JSON extraction: look for the first { and last }
    // This handles cases where the AI might include markdown ```json ... ```
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    return JSON.parse(content) as AnalysisResult;
  } catch (error: any) {
    console.error('Gemini analysis error:', error);
    throw new Error(`AI Analysis failed: ${error.message}`);
  }
};
