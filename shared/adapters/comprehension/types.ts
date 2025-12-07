/**
 * Comprehension Chat Adapter Types
 * 
 * Defines the structure for role-aware, level-adjusted comprehension check conversations.
 * Sarah (Tech Lead) verifies the intern understood the documentation and guides them
 * to the next onboarding step.
 */

import type { Role, Level } from '../index';

export interface ComprehensionTopic {
  id: string;
  topic: string;
  description: string;
  expectedUnderstanding: string[];
  followUpPrompts: string[];
}

export interface ComprehensionState {
  userShowedUnderstanding: boolean;
  userAskedQuestions: boolean;
  sarahAnsweredQuestions: boolean;
  sarahOfferedNextSteps: boolean;
}

export interface ComprehensionConversationStyle {
  tone: 'encouraging' | 'collaborative' | 'direct';
  depth: 'thorough' | 'balanced' | 'light';
  proactivity: 'high' | 'medium' | 'low';
}

export interface ComprehensionClosingCriteria {
  minUserMessages: number;
  requireUnderstandingDemo: boolean;
  offerNextSteps: boolean;
  maxTurns: number;
}

export interface ComprehensionPersona {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  communicationStyle: string;
  
  comprehensionTopics: {
    forDeveloper: ComprehensionTopic[];
    forPM: ComprehensionTopic[];
    forQA: ComprehensionTopic[];
    forDevOps: ComprehensionTopic[];
    default: ComprehensionTopic[];
  };
  
  encouragingPhrases: string[];
  
  transitionToNextSteps: string[];
  
  warmClosings: string[];
  
  roleSpecificContext: string;
}

export interface ComprehensionCompletionCTA {
  buttonText: string;
  description: string;
  celebrationMessage: string;
}

export interface ComprehensionLevelOverlay {
  level: Level;
  displayName: string;
  
  conversationStyle: ComprehensionConversationStyle;
  
  closingCriteria: ComprehensionClosingCriteria;
  
  understandingExpectations: {
    detailLevel: 'surface' | 'moderate' | 'deep';
    allowPartialUnderstanding: boolean;
    encourageQuestions: boolean;
  };
  
  toneAdjustments: {
    beExtraEncouraging: boolean;
    offerMoreGuidance: boolean;
    assumePriorKnowledge: boolean;
  };
  
  completionCTA: ComprehensionCompletionCTA;
}

export interface ComprehensionConfig {
  persona: ComprehensionPersona;
  levelOverlay: ComprehensionLevelOverlay;
  userRole: Role;
  topics: ComprehensionTopic[];
}
