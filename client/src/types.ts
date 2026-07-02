export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export interface BiasScore {
  score: number;
  label: string;
  explanation: string;
}

export interface AnalysisResult {
  summary: string;
  politicalBias: BiasScore;
  emotionalBias: BiasScore;
  originalLength: number;
  extractedText?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  ts?: number;
}

export interface AnalysisState {
  data?: AnalysisResult;
  loading: boolean;
  error?: string;
  chatHistory: ChatMessage[];
  chatInput: string;
  chatLoading: boolean;
}

export interface SessionEntry {
  key: string;
  title: string;
  sourceLabel: string;
  politicalLabel: string;
  politicalScore: number;
  emotionalLabel: string;
  emotionalScore: number;
  timestamp: number;
}