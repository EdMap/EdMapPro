/**
 * Team Introduction Adapter Types
 * 
 * Defines the structure for role-aware, level-adjusted team member conversations
 * during onboarding. Each team member delivers unique value based on their role,
 * while adapting conversation depth and tone to the user's experience level.
 */

import type { Role, Level } from '../index';

export interface OnboardingTopic {
  id: string;
  topic: string;
  description: string;
  required: boolean;
  exampleQuestions?: string[];
}

export interface ConversationStyle {
  tone: 'mentoring' | 'collaborative' | 'peer' | 'supportive';
  depth: 'detailed' | 'balanced' | 'concise';
  proactivity: 'high' | 'medium' | 'low';
  followUpOnBriefResponses: boolean;
}

export interface ClosingChecklist {
  mustShareTopics: number;
  offerNextSteps: boolean;
  provideContactMethod: boolean;
  summarizeKeyPoints: boolean;
}

export interface TeamMemberPersona {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  communicationStyle: string;
  
  onboardingTopics: {
    forDeveloper: OnboardingTopic[];
    forPM: OnboardingTopic[];
    forQA: OnboardingTopic[];
    forDevOps: OnboardingTopic[];
    default: OnboardingTopic[];
  };
  
  personalTouchPoints: string[];
  
  personalTopicTransitions: string[];
  
  warmClosings: string[];
  
  closingPhrases: string[];
  
  roleSpecificInsights: string;
}

export interface TeamIntroLevelOverlay {
  level: Level;
  displayName: string;
  
  conversationStyle: ConversationStyle;
  
  closingChecklist: ClosingChecklist;
  
  briefResponseStrategy: {
    offerOptions: boolean;
    askTargetedFollowUp: boolean;
    proactivelyShareInfo: boolean;
    optionPrompts: string[];
  };
  
  toneAdjustments: {
    useSimplifiedLanguage: boolean;
    offerEncouragement: boolean;
    assumePriorKnowledge: boolean;
    treatAsPeer: boolean;
  };
}

export interface TeamIntroConfig {
  persona: TeamMemberPersona;
  levelOverlay: TeamIntroLevelOverlay;
  userRole: Role;
  
  getRelevantTopics(): OnboardingTopic[];
  
  buildSystemPrompt(): string;
  
  buildConversationGuidance(isClosing: boolean, topicsCovered: string[]): string;
}

export interface TeamIntroAdapterOptions {
  memberName: string;
  userRole: Role;
  userLevel: Level;
}
