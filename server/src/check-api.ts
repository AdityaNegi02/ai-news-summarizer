import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const key = process.env.GEMINI_API_KEY;

if (!key) {
  console.error('❌ Error: GEMINI_API_KEY is not set in your .env file.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(key);

async function checkModels() {
  console.log('🔍 Checking Gemini API connection (using gemini-2.5-flash)...');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hi');
    const response = await result.response;
    console.log('✅ Connection Successful!');
    console.log('Response from Gemini:', response.text());
    console.log('\nYour API key is working and has access to gemini-2.5-flash.');
  } catch (error: any) {
    console.error('\n❌ Connection Failed!');
    console.error('Error Message:', error.message);
    
    if (error.status === 403 || error.message.includes('API_KEY_INVALID')) {
      console.error('\n💡 Hint: Your API Key appears to be invalid or restricted.');
    } else if (error.status === 404) {
      console.error('\n💡 Hint: The model name "gemini-2.5-flash" was not found. Your account might only have access to specific models.');
    } else if (error.status === 429) {
      console.error('\n💡 Hint: Quota exceeded! You are sending too many requests or have hit your daily limit.');
    } else {
      console.error('\n💡 Hint: Check your internet connection or if the Gemini service is down in your region.');
    }
  }
}

checkModels();
