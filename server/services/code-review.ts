/**
 * Code Review Service
 * 
 * Provides LLM-powered code reviews using reviewer personas and level-adjusted feedback.
 * Each reviewer analyzes code from their unique perspective (e.g., Senior Dev vs QA).
 */

import Groq from "groq-sdk";
import type { Role, Level } from "@shared/adapters";
import type { 
  ReviewerPersona, 
  LLMReviewLevelConfig,
  PRReviewConfig 
} from "@shared/adapters/execution/types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface CodeReviewRequest {
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  files: Record<string, string>;
  userLevel: Level;
  userRole: Role;
}

export interface ReviewComment {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  content: string;
  severity: 'minor' | 'major' | 'blocking';
  type: 'suggestion' | 'question' | 'request_changes' | 'approval';
  filename?: string;
  lineNumber?: number;
  codeSnippet?: string;
  requiresResponse: boolean;
}

export interface CodeReviewResponse {
  success: boolean;
  reviewerId: string;
  comments: ReviewComment[];
  overallAssessment: string;
  approvalStatus: 'approved' | 'changes_requested' | 'needs_discussion';
}

function buildReviewerPrompt(
  reviewer: ReviewerPersona,
  request: CodeReviewRequest,
  levelConfig: LLMReviewLevelConfig
): string {
  const filesContent = Object.entries(request.files)
    .map(([filename, content]) => `--- ${filename} ---\n${content}`)
    .join('\n\n');

  const focusInstructions = reviewer.promptConfig?.focusInstructions?.join('\n- ') || '';
  const severityGuidelines = reviewer.promptConfig?.severityGuidelines;

  return `## Code Review Task

You are reviewing code for ticket: ${request.ticketTitle}
${request.ticketDescription}

## Code to Review
${filesContent}

## Your Review Focus
${reviewer.promptConfig?.reviewPrompt || 'Review this code for quality and correctness.'}

Focus areas:
- ${focusInstructions}

## Severity Guidelines
- **blocking**: ${severityGuidelines?.blocking || 'Critical issues that must be fixed'}
- **major**: ${severityGuidelines?.major || 'Important issues that should be addressed'}
- **minor**: ${severityGuidelines?.minor || 'Nice-to-have improvements'}

## Response Format
${levelConfig.includeCodeExamples ? 'Include code examples when suggesting changes.' : 'Be concise, no code examples needed.'}
${levelConfig.includeWhyExplanations ? 'Explain WHY each suggestion matters.' : 'Focus on WHAT to change, not why.'}

Explanation depth: ${levelConfig.explanationDepth}
Assume knowledge level: ${levelConfig.assumeKnowledgeLevel}
Tone: ${levelConfig.toneModifier}

IMPORTANT: You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanation text before or after the JSON.

Your response must be exactly this structure (replace values with your actual review):
{"comments":[{"content":"Your specific feedback here","severity":"minor","type":"suggestion","requiresResponse":false}],"overallAssessment":"Brief summary","approvalStatus":"needs_discussion"}

Rules:
- severity must be one of: "minor", "major", "blocking"
- type must be one of: "suggestion", "question", "request_changes"
- approvalStatus must be one of: "approved", "changes_requested", "needs_discussion"
- Use double quotes for all strings
- Do NOT use backticks anywhere in your response
- Do NOT wrap response in markdown code blocks
- Provide ${levelConfig.maxCommentsPerReviewer} comments maximum`;
}

function parseReviewResponse(
  responseText: string, 
  reviewer: ReviewerPersona
): { comments: ReviewComment[]; overallAssessment: string; approvalStatus: 'approved' | 'changes_requested' | 'needs_discussion' } {
  try {
    // Clean up common LLM response issues
    let cleanedText = responseText
      // Remove markdown code blocks
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      // Replace backtick-wrapped code snippets with proper JSON strings
      .replace(/`([^`]*)`/g, (_, code) => `"${code.replace(/"/g, '\\"')}"`)
      // Fix common issues with newlines in strings
      .replace(/:\s*"([^"]*)\n([^"]*)"/, (_, p1, p2) => `: "${p1}\\n${p2}"`);
    
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    // Additional cleanup: ensure the JSON is valid
    let jsonStr = jsonMatch[0];
    
    // Try to fix unescaped newlines within string values
    jsonStr = jsonStr.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
      return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    });
    
    const parsed = JSON.parse(jsonStr);
    
    const comments: ReviewComment[] = (parsed.comments || []).map((c: any, index: number) => ({
      id: `${reviewer.id}-comment-${index + 1}`,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewerRole: reviewer.role,
      content: c.content || '',
      severity: ['minor', 'major', 'blocking'].includes(c.severity) ? c.severity : 'minor',
      type: ['suggestion', 'question', 'request_changes', 'approval'].includes(c.type) ? c.type : 'suggestion',
      filename: c.filename,
      lineNumber: typeof c.lineNumber === 'number' ? c.lineNumber : undefined,
      codeSnippet: c.codeSnippet,
      requiresResponse: c.requiresResponse ?? (c.severity !== 'minor'),
    }));

    return {
      comments,
      overallAssessment: parsed.overallAssessment || 'Review completed.',
      approvalStatus: ['approved', 'changes_requested', 'needs_discussion'].includes(parsed.approvalStatus) 
        ? parsed.approvalStatus 
        : 'needs_discussion',
    };
  } catch (error) {
    console.error('[CodeReview] Failed to parse response:', error);
    return {
      comments: [{
        id: `${reviewer.id}-comment-1`,
        reviewerId: reviewer.id,
        reviewerName: reviewer.name,
        reviewerRole: reviewer.role,
        content: 'Unable to parse review response. Please check the code and try again.',
        severity: 'minor',
        type: 'suggestion',
        requiresResponse: false,
      }],
      overallAssessment: 'Review parsing failed.',
      approvalStatus: 'needs_discussion',
    };
  }
}

export class CodeReviewService {
  private validateRequest(request: CodeReviewRequest): { valid: boolean; error?: string } {
    if (!request.files || Object.keys(request.files).length === 0) {
      return { valid: false, error: 'No code files provided for review' };
    }
    
    const hasContent = Object.values(request.files).some(content => 
      content && content.trim().length > 0
    );
    
    if (!hasContent) {
      return { valid: false, error: 'All code files are empty' };
    }
    
    return { valid: true };
  }

  async reviewCode(
    request: CodeReviewRequest,
    reviewer: ReviewerPersona,
    levelConfig: LLMReviewLevelConfig
  ): Promise<CodeReviewResponse> {
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      console.log(`[CodeReview] Validation failed: ${validation.error}`);
      return {
        success: false,
        reviewerId: reviewer.id,
        comments: [{
          id: `${reviewer.id}-comment-1`,
          reviewerId: reviewer.id,
          reviewerName: reviewer.name,
          reviewerRole: reviewer.role,
          content: validation.error || 'Unable to review code',
          severity: 'minor',
          type: 'suggestion',
          requiresResponse: false,
        }],
        overallAssessment: 'No code available to review.',
        approvalStatus: 'needs_discussion',
      };
    }

    if (!process.env.GROQ_API_KEY) {
      console.log('[CodeReview] No GROQ_API_KEY, using mock response');
      return this.createMockResponse(reviewer);
    }

    try {
      const systemPrompt = reviewer.promptConfig?.systemPrompt || 
        `You are ${reviewer.name}, a ${reviewer.role} reviewing code. ${reviewer.personality}`;

      const userPrompt = buildReviewerPrompt(reviewer, request, levelConfig);

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      });

      const responseText = response.choices[0]?.message?.content || '';
      console.log(`[CodeReview] Raw LLM response from ${reviewer.name}:`, responseText.substring(0, 500));
      const parsed = parseReviewResponse(responseText, reviewer);

      return {
        success: true,
        reviewerId: reviewer.id,
        ...parsed,
      };
    } catch (error) {
      console.error('[CodeReview] LLM error:', error);
      return this.createMockResponse(reviewer);
    }
  }

  async reviewCodeWithAllReviewers(
    request: CodeReviewRequest,
    prConfig: PRReviewConfig
  ): Promise<CodeReviewResponse[]> {
    const levelConfig = prConfig.levelModifiers.llmReviewConfig;
    const reviewPromises = prConfig.reviewers.map(reviewer => 
      this.reviewCode(request, reviewer, levelConfig)
    );

    return Promise.all(reviewPromises);
  }

  private createMockResponse(reviewer: ReviewerPersona): CodeReviewResponse {
    const mockComments: ReviewComment[] = [
      {
        id: `${reviewer.id}-mock-1`,
        reviewerId: reviewer.id,
        reviewerName: reviewer.name,
        reviewerRole: reviewer.role,
        content: reviewer.id === 'marcus' 
          ? 'Consider extracting this logic into a separate function for better readability and reusability.'
          : 'What happens if this value is null? Consider adding a null check to prevent potential runtime errors.',
        severity: 'minor',
        type: 'suggestion',
        requiresResponse: false,
      },
    ];

    return {
      success: true,
      reviewerId: reviewer.id,
      comments: mockComments,
      overallAssessment: 'Mock review completed. Enable GROQ_API_KEY for real AI reviews.',
      approvalStatus: 'needs_discussion',
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.GROQ_API_KEY;
  }
}

export const codeReviewService = new CodeReviewService();
