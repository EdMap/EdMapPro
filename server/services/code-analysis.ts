/**
 * Code Analysis Service
 * 
 * Provides code execution simulation using LLM.
 * Designed with provider abstraction for future real execution support.
 */

import Groq from "groq-sdk";
import type { Role, Level } from "@shared/adapters";
import {
  buildAnalysisPrompt,
  parseAnalysisResponse,
  transformToExecutionResponse,
  createMockExecutionResponse,
  LLM_PROVIDER_CONFIG,
} from "@shared/adapters/code-execution/providers/llm-provider";
import type {
  ExecutionRequest,
  ExecutionResponse,
  TestCase,
  EditorLanguage,
} from "@shared/adapters/code-execution/types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface AnalyzeCodeInput {
  ticketId: string;
  files: Record<string, string>;
  testCases: TestCase[];
  language: EditorLanguage;
  userLevel: Level;
  userRole: Role;
}

export class CodeAnalysisService {
  private providerId = LLM_PROVIDER_CONFIG.id;
  
  async analyzeCode(input: AnalyzeCodeInput): Promise<ExecutionResponse> {
    const startTime = Date.now();
    
    const request: ExecutionRequest = {
      ticketId: input.ticketId,
      files: input.files,
      testCases: input.testCases,
      language: input.language,
      userLevel: input.userLevel,
      userRole: input.userRole,
    };
    
    if (!process.env.GROQ_API_KEY) {
      console.log('[CodeAnalysis] No GROQ_API_KEY, using mock response');
      return createMockExecutionResponse(request, startTime);
    }
    
    try {
      const prompt = buildAnalysisPrompt(request);
      
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a code execution simulator for edmap, an educational B2B onboarding platform. 
Your job is to analyze code and predict test results WITHOUT actually executing the code.
Always respond with valid JSON only, no markdown formatting.
Be accurate in your predictions but educational in your feedback.
Match your feedback tone to the user's experience level.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });
      
      const responseText = response.choices[0]?.message?.content || '';
      const analysis = parseAnalysisResponse(responseText);
      
      return transformToExecutionResponse(request, analysis, startTime);
    } catch (error) {
      console.error('[CodeAnalysis] LLM error:', error);
      return createMockExecutionResponse(request, startTime);
    }
  }
  
  async isAvailable(): Promise<boolean> {
    return !!process.env.GROQ_API_KEY;
  }
  
  getProviderInfo() {
    return {
      id: this.providerId,
      name: LLM_PROVIDER_CONFIG.name,
      description: LLM_PROVIDER_CONFIG.description,
      estimatedLatencyMs: LLM_PROVIDER_CONFIG.estimatedLatencyMs,
      available: !!process.env.GROQ_API_KEY,
    };
  }
}

export const codeAnalysisService = new CodeAnalysisService();
