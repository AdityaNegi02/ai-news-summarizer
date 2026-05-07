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
export declare const analyzeArticle: (text: string) => Promise<AnalysisResult>;
//# sourceMappingURL=openai.d.ts.map