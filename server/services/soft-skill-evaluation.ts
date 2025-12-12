/**
 * Soft Skill Event Evaluation Service
 * 
 * Evaluates user responses to soft skill events using either
 * direct rubric mapping (for unedited suggestions) or LLM scoring
 * (for edited/custom responses).
 */

import Groq from "groq-sdk";
import type { Role, Level } from "@shared/adapters";
import {
  getSoftSkillEventAdapter,
  type SoftSkillEventActivityData,
  type SoftSkillEventUserResponse,
  type SoftSkillEventEvaluation,
  type EvaluationMethod,
} from "@shared/adapters/soft-skills";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface EvaluateResponseInput {
  activityData: SoftSkillEventActivityData;
  userResponse: SoftSkillEventUserResponse;
  role: Role;
  level: Level;
}

export interface FollowUpInput {
  activityData: SoftSkillEventActivityData;
  userResponse: SoftSkillEventUserResponse;
  evaluation: SoftSkillEventEvaluation;
  role: Role;
  level: Level;
}

function getDefaultScoresForSuggestion(
  suggestionId: string,
  activityData: SoftSkillEventActivityData,
  adapter: ReturnType<typeof getSoftSkillEventAdapter>
): SoftSkillEventEvaluation['scores'] {
  const option = activityData.responseOptions.find(o => o.id === suggestionId);
  
  if (option?.isRecommended) {
    return {
      communication: 85,
      problemSolving: 85,
      assertiveness: 80,
      collaboration: 85,
    };
  }
  
  if (suggestionId === 'agree-immediately') {
    return {
      communication: 70,
      problemSolving: 40,
      assertiveness: 30,
      collaboration: 75,
    };
  }
  
  if (suggestionId === 'push-back') {
    return {
      communication: 50,
      problemSolving: 60,
      assertiveness: 90,
      collaboration: 40,
    };
  }
  
  return {
    communication: 70,
    problemSolving: 70,
    assertiveness: 70,
    collaboration: 70,
  };
}

function calculateWeightedScore(
  scores: SoftSkillEventEvaluation['scores'],
  rubricWeights: Record<string, number>
): number {
  return Math.round(
    scores.communication * (rubricWeights.communication || 0.25) +
    scores.problemSolving * (rubricWeights.problemSolving || 0.30) +
    scores.assertiveness * (rubricWeights.assertiveness || 0.25) +
    scores.collaboration * (rubricWeights.collaboration || 0.20)
  );
}

function getFeedbackForSuggestion(
  suggestionId: string,
  activityData: SoftSkillEventActivityData,
  feedbackTone: string
): SoftSkillEventEvaluation['feedback'] {
  const option = activityData.responseOptions.find(o => o.id === suggestionId);
  
  if (option?.isRecommended) {
    return {
      summary: 'Great response! You demonstrated strong professional communication skills.',
      strengths: [
        'Professional and measured response',
        'Shows willingness to engage constructively',
        'Maintains positive working relationship',
      ],
      growthAreas: [],
    };
  }
  
  if (suggestionId === 'agree-immediately') {
    return {
      summary: feedbackTone === 'encouraging' 
        ? 'Your willingness to help is admirable, but it can help to assess feasibility before committing.'
        : 'Consider assessing feasibility before committing to new deadlines.',
      strengths: ['Positive attitude', 'Willingness to help'],
      growthAreas: ['Assess impact before committing', 'Consider scope negotiation'],
      suggestedPhrasing: 'Let me check my current tasks and get back to you in an hour with what\'s possible.',
    };
  }
  
  if (suggestionId === 'push-back') {
    return {
      summary: feedbackTone === 'encouraging'
        ? 'Standing firm on realistic timelines is important, but consider offering alternatives.'
        : 'Direct pushback can damage relationships. Try offering alternatives.',
      strengths: ['Clear about constraints', 'Sets boundaries'],
      growthAreas: ['Offer alternatives', 'Soften delivery while maintaining position'],
      suggestedPhrasing: 'I can\'t have the full feature ready by then, but I could have the core functionality done if we defer edge cases.',
    };
  }
  
  return {
    summary: 'Good response overall.',
    strengths: ['Clear communication'],
    growthAreas: [],
  };
}

function calculateCompetencyDeltas(
  scores: SoftSkillEventEvaluation['scores'],
  rubricWeights: Record<string, number>
): Record<string, number> {
  const deltas: Record<string, number> = {};
  
  const baseMultiplier = 0.5;
  
  if (scores.communication >= 70) {
    deltas['professional-communication'] = Math.round((scores.communication - 50) * baseMultiplier * (rubricWeights.communication || 0.25));
  }
  if (scores.problemSolving >= 70) {
    deltas['problem-solving'] = Math.round((scores.problemSolving - 50) * baseMultiplier * (rubricWeights.problemSolving || 0.30));
  }
  if (scores.assertiveness >= 70) {
    deltas['time-management'] = Math.round((scores.assertiveness - 50) * baseMultiplier * (rubricWeights.assertiveness || 0.25));
  }
  if (scores.collaboration >= 70) {
    deltas['collaboration'] = Math.round((scores.collaboration - 50) * baseMultiplier * (rubricWeights.collaboration || 0.20));
  }
  
  return deltas;
}

async function evaluateWithLLM(
  input: EvaluateResponseInput
): Promise<SoftSkillEventEvaluation> {
  const adapter = getSoftSkillEventAdapter(input.role, input.level);
  const startTime = Date.now();
  
  const systemPrompt = adapter.promptConfig.systemPrompt;
  const evaluationPrompt = adapter.promptConfig.evaluationPrompt;
  
  const userPrompt = `
SCENARIO:
${input.activityData.scenario.setup}

MESSAGE FROM ${input.activityData.scenario.sender} (${input.activityData.scenario.senderRole}):
"${input.activityData.scenario.message}"

USER'S RESPONSE:
"${input.userResponse.text}"

AVAILABLE RESPONSE OPTIONS (for reference):
${input.activityData.responseOptions.map(o => `- ${o.id}: "${o.description}" ${o.isRecommended ? '(recommended)' : ''}`).join('\n')}

EVALUATION CRITERIA:
${input.activityData.evaluationCriteria.map(c => `- ${c.dimension} (${c.weight}%): ${c.question}`).join('\n')}

${evaluationPrompt}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });
    
    const responseText = response.choices[0]?.message?.content || '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    const scores: SoftSkillEventEvaluation['scores'] = {
      communication: Math.min(100, Math.max(0, parsed.scores?.communication || 70)),
      problemSolving: Math.min(100, Math.max(0, parsed.scores?.problemSolving || 70)),
      assertiveness: Math.min(100, Math.max(0, parsed.scores?.assertiveness || 70)),
      collaboration: Math.min(100, Math.max(0, parsed.scores?.collaboration || 70)),
    };
    
    const weightedScore = calculateWeightedScore(scores, adapter.rubricWeights);
    
    return {
      method: 'llm_scoring' as EvaluationMethod,
      scores,
      weightedScore,
      closestSuggestionId: parsed.closestSuggestionId || null,
      feedback: {
        summary: parsed.feedback?.summary || 'Response evaluated.',
        strengths: parsed.feedback?.strengths || [],
        growthAreas: parsed.feedback?.growthAreas || [],
        suggestedPhrasing: parsed.feedback?.suggestedPhrasing,
      },
      competencyDeltas: calculateCompetencyDeltas(scores, adapter.rubricWeights),
      evaluatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[SoftSkillEvaluation] LLM error:', error);
    
    const fallbackScores = {
      communication: 70,
      problemSolving: 70,
      assertiveness: 70,
      collaboration: 70,
    };
    
    return {
      method: 'llm_scoring' as EvaluationMethod,
      scores: fallbackScores,
      weightedScore: calculateWeightedScore(fallbackScores, adapter.rubricWeights),
      closestSuggestionId: null,
      feedback: {
        summary: 'Thank you for your response. Good effort in handling this situation.',
        strengths: ['Engaged with the scenario'],
        growthAreas: [],
      },
      competencyDeltas: {},
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export class SoftSkillEvaluationService {
  async evaluateResponse(input: EvaluateResponseInput): Promise<SoftSkillEventEvaluation> {
    const adapter = getSoftSkillEventAdapter(input.role, input.level);
    
    if (input.userResponse.suggestionId && !input.userResponse.wasEdited) {
      const scores = getDefaultScoresForSuggestion(
        input.userResponse.suggestionId,
        input.activityData,
        adapter
      );
      
      const weightedScore = calculateWeightedScore(scores, adapter.rubricWeights);
      const feedback = getFeedbackForSuggestion(
        input.userResponse.suggestionId,
        input.activityData,
        adapter.feedbackConfig.tone
      );
      
      return {
        method: 'rubric_mapping' as EvaluationMethod,
        scores,
        weightedScore,
        closestSuggestionId: input.userResponse.suggestionId,
        feedback,
        competencyDeltas: calculateCompetencyDeltas(scores, adapter.rubricWeights),
        evaluatedAt: new Date().toISOString(),
      };
    }
    
    if (!process.env.GROQ_API_KEY) {
      console.log('[SoftSkillEvaluation] No GROQ_API_KEY, using fallback scores');
      const fallbackScores = {
        communication: 75,
        problemSolving: 75,
        assertiveness: 75,
        collaboration: 75,
      };
      
      return {
        method: 'rubric_mapping' as EvaluationMethod,
        scores: fallbackScores,
        weightedScore: calculateWeightedScore(fallbackScores, adapter.rubricWeights),
        closestSuggestionId: null,
        feedback: {
          summary: 'Good response! You handled the situation thoughtfully.',
          strengths: ['Engaged with the scenario', 'Clear communication'],
          growthAreas: [],
        },
        competencyDeltas: calculateCompetencyDeltas(fallbackScores, adapter.rubricWeights),
        evaluatedAt: new Date().toISOString(),
      };
    }
    
    return evaluateWithLLM(input);
  }
  
  async generateFollowUp(input: FollowUpInput): Promise<string> {
    const adapter = getSoftSkillEventAdapter(input.role, input.level);
    
    const closestSuggestionId = input.evaluation.closestSuggestionId || input.userResponse.suggestionId;
    const followUpTemplate = input.activityData.followUpTemplates.find(t => {
      if (closestSuggestionId === 'agree-immediately' && t.condition === 'user_agreed_immediately') return true;
      if (closestSuggestionId === 'ask-clarifying' && t.condition === 'user_asked_questions') return true;
      if (closestSuggestionId === 'negotiate-scope' && t.condition === 'user_negotiated') return true;
      if (closestSuggestionId === 'push-back' && t.condition === 'user_pushed_back') return true;
      if (closestSuggestionId === 'buy-time' && t.condition === 'user_asked_questions') return true;
      return false;
    });
    
    if (followUpTemplate) {
      return followUpTemplate.message;
    }
    
    if (!process.env.GROQ_API_KEY) {
      return "Thanks for your response. I'll factor that in as we figure out next steps.";
    }
    
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are ${input.activityData.scenario.sender}, a ${input.activityData.scenario.senderRole} at a tech company. Generate a brief, natural follow-up response to the user's message. Keep it under 2 sentences.`,
          },
          {
            role: "user",
            content: `Original message: "${input.activityData.scenario.message}"\n\nUser's response: "${input.userResponse.text}"\n\nGenerate a natural follow-up:`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });
      
      return response.choices[0]?.message?.content || "Thanks, I'll take that into account.";
    } catch (error) {
      console.error('[SoftSkillEvaluation] Follow-up generation error:', error);
      return "Thanks for your response. I'll factor that in as we figure out next steps.";
    }
  }
  
  async isAvailable(): Promise<boolean> {
    return !!process.env.GROQ_API_KEY;
  }
}

export const softSkillEvaluationService = new SoftSkillEvaluationService();
