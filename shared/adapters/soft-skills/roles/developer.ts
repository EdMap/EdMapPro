/**
 * Developer Role Soft Skill Adapter
 * 
 * Configures soft skill events for developers with focus on
 * technical communication, code review interactions, and team collaboration.
 */

import type { RoleSoftSkillAdapter } from '../types';

export const developerSoftSkillAdapter: RoleSoftSkillAdapter = {
  role: 'developer',
  displayName: 'Developer',
  description: 'Technical communication, code review diplomacy, and collaborative problem-solving',
  
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
    systemPrompt: `You are evaluating a developer's soft skill response in a workplace scenario.
Focus on:
- Technical communication clarity
- Professionalism in code review interactions
- Collaborative problem-solving approach
- Balance between assertiveness and flexibility`,
    
    evaluationPrompt: `Evaluate this developer's response to a workplace scenario.
Score each dimension from 0-100:
- communication: Was the response clear and professional?
- problemSolving: Did they offer constructive solutions or alternatives?
- assertiveness: Did they advocate for realistic timelines/approaches?
- collaboration: Did they consider team dynamics and business needs?

Return JSON: { scores: {communication, problemSolving, assertiveness, collaboration}, closestSuggestionId, feedback: {summary, strengths, growthAreas, suggestedPhrasing} }`,
    
    followUpPrompt: `Generate a natural follow-up response from the team member based on how the developer responded.
Match the persona's communication style.
Keep the response conversational and realistic.`,
    
    baseFeedbackPrompt: `Provide feedback on the developer's response.
Highlight what they did well and areas for growth.`,
  },
  
  rubricWeights: {
    communication: 0.25,
    problemSolving: 0.30,
    assertiveness: 0.25,
    collaboration: 0.20,
  },
};

export const qaSoftSkillAdapter: RoleSoftSkillAdapter = {
  role: 'qa',
  displayName: 'QA Engineer',
  description: 'Quality advocacy, constructive feedback, and cross-functional collaboration',
  
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
    systemPrompt: `You are evaluating a QA engineer's soft skill response in a workplace scenario.
Focus on:
- Quality advocacy while maintaining relationships
- Constructive feedback delivery
- Cross-functional collaboration
- Risk communication clarity`,
    
    evaluationPrompt: `Evaluate this QA engineer's response to a workplace scenario.
Score each dimension from 0-100:
- communication: Was the response clear and diplomatic?
- problemSolving: Did they identify risks and propose mitigations?
- assertiveness: Did they advocate for quality standards?
- collaboration: Did they work with the team toward a solution?

Return JSON: { scores: {communication, problemSolving, assertiveness, collaboration}, closestSuggestionId, feedback: {summary, strengths, growthAreas, suggestedPhrasing} }`,
    
    followUpPrompt: `Generate a natural follow-up response from the team member based on how the QA engineer responded.
Match the persona's communication style.
Keep the response conversational and realistic.`,
    
    baseFeedbackPrompt: `Provide feedback on the QA engineer's response.
Highlight what they did well and areas for growth.`,
  },
  
  rubricWeights: {
    communication: 0.25,
    problemSolving: 0.25,
    assertiveness: 0.30,
    collaboration: 0.20,
  },
};

export const devopsSoftSkillAdapter: RoleSoftSkillAdapter = {
  ...developerSoftSkillAdapter,
  role: 'devops',
  displayName: 'DevOps Engineer',
  description: 'Incident communication, cross-team coordination, and reliability advocacy',
};

export const dataScienceSoftSkillAdapter: RoleSoftSkillAdapter = {
  ...developerSoftSkillAdapter,
  role: 'data_science',
  displayName: 'Data Scientist',
  description: 'Translating technical findings, stakeholder communication, and collaborative analysis',
};
