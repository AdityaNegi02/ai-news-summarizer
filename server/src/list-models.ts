import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const key = process.env.GEMINI_API_KEY;

if (!key) {
  console.error('❌ Error: GEMINI_API_KEY is not set in your .env file.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(key);

async function listModels() {
  console.log('🔍 Listing available models for your API key...');
  try {
    // Attempting to list models using a fetch call to the endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();

    if (data.error) {
      console.error('❌ API Error:', data.error.message);
      return;
    }

    console.log('✅ Connection Successful! Here are the models you can use:\n');
    if (data.models && data.models.length > 0) {
      data.models.forEach((m: any) => {
        console.log(`- ${m.name.replace('models/', '')} (${m.supportedGenerationMethods.join(', ')})`);
      });
    } else {
      console.log('No models found. This is unusual.');
    }
  } catch (error: any) {
    console.error('\n❌ Connection Failed!');
    console.error('Error:', error.message);
  }
}

listModels();
