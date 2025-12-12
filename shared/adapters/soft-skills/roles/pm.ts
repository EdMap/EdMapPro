/**
 * Product Manager Role Soft Skill Adapter
 * 
 * Configures soft skill events for PMs with focus on
 * stakeholder management, prioritization communication, and cross-functional leadership.
 */

import type { RoleSoftSkillAdapter } from '../types';

export const pmSoftSkillAdapter: RoleSoftSkillAdapter = {
  role: 'pm',
  displayName: 'Product Manager',
  description: 'Stakeholder management, prioritization communication, and cross-functional leadership',
  
  baseSuggestionConfig: {
    showRecommendedLabel: true,
    maxSuggestionsShown: 4,
    allowExpand: true,
    insertBehavior: 'replace',
  },
  
  baseEvaluationConfig: {
    llmThreshold: 0.7,
    editTolerance: 0.3,
    requiresLLMForEdited: true,
    rubricPassingScore: 60,
  },
  
  baseFeedbackConfig: {
    showStrengths: true,
    showGrowthAreas: true,
    showSuggestedPhrasing: true,
    showScore: false,
    maxFeedbackLength: 'moderate',
  },
  
  baseFollowUpConfig: {
    enabled: true,
    autoRespond: true,
    respondDelay: 1500,
    personaMatching: true,
  },
  
  baseUIConfig: {
    modalSize: 'standard',
    showScenarioContext: true,
    showCompetencyTags: true,
    showTimerHint: false,
    animateTransitions: true,
    inputPlaceholder: 'Type your response...',
  },
  
  basePromptConfig: {
    systemPrompt: `You are evaluating a product manager's soft skill response in a workplace scenario.
Focus on:
- Stakeholder communication effectiveness
- Prioritization rationale clarity
- Cross-functional collaboration
- Business impact awareness`,
    
    evaluationPrompt: `Evaluate this product manager's response to a workplace scenario.
Score each dimension from 0-100:
- communication: Was the response clear and stakeholder-appropriate?
- problemSolving: Did they balance competing priorities effectively?
- assertiveness: Did they make clear decisions while remaining open?
- collaboration: Did they consider all stakeholder perspectives?

Return JSON: { scores: {communication, problemSolving, assertiveness, collaboration}, closestSuggestionId, feedback: {summary, strengths, growthAreas, suggestedPhrasing} }`,
    
    followUpPrompt: `Generate a natural follow-up response from the team member based on how the PM responded.
Match the persona's communication style.
Keep the response conversational and realistic.`,
    
    baseFeedbackPrompt: `Provide feedback on the product manager's response.
Highlight what they did well and areas for growth.`,
  },
  
  rubricWeights: {
    communication: 0.30,
    problemSolving: 0.25,
    assertiveness: 0.20,
    collaboration: 0.25,
  },
};
