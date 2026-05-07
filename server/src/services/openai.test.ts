import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeArticle } from './openai.js';
import OpenAI from 'openai';

// Mock OpenAI
vi.mock('openai', () => {
  const OpenAI = vi.fn();
  (OpenAI as any).prototype.chat = {
    completions: {
      create: vi.fn(),
    },
  };
  return { default: OpenAI };
});

describe('openai service', () => {
  let mockCreate: any;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    const openai = new OpenAI();
    mockCreate = openai.chat.completions.create;
  });

  it('should return parsed analysis results', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: 'Test summary',
              politicalBias: { score: 0, label: 'Center', explanation: 'Balanced' },
              emotionalBias: { score: 0.1, label: 'Objective', explanation: 'Factual' },
            }),
          },
        },
      ],
    };

    mockCreate.mockResolvedValue(mockResponse);

    const result = await analyzeArticle('Some news text');

    expect(result.summary).toBe('Test summary');
    expect(result.politicalBias.label).toBe('Center');
    expect(result.emotionalBias.score).toBe(0.1);
  });

  it('should throw error if API key is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(analyzeArticle('text')).rejects.toThrow('OpenAI API Key is missing');
  });
});
