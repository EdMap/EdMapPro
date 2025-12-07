/**
 * Comprehension Chat Level Overlays
 * 
 * Adjusts comprehension check behavior based on user's experience level.
 * Interns get more encouragement and lighter expectations,
 * while seniors get more direct, peer-level conversations.
 */

import type { Level } from '../index';
import type { ComprehensionLevelOverlay } from './types';

const internOverlay: ComprehensionLevelOverlay = {
  level: 'intern',
  displayName: 'Intern',
  
  conversationStyle: {
    tone: 'encouraging',
    depth: 'light',
    proactivity: 'high'
  },
  
  closingCriteria: {
    minUserMessages: 2,
    requireUnderstandingDemo: false,
    offerNextSteps: true,
    maxTurns: 8
  },
  
  understandingExpectations: {
    detailLevel: 'surface',
    allowPartialUnderstanding: true,
    encourageQuestions: true
  },
  
  toneAdjustments: {
    beExtraEncouraging: true,
    offerMoreGuidance: true,
    assumePriorKnowledge: false
  }
};

const juniorOverlay: ComprehensionLevelOverlay = {
  level: 'junior',
  displayName: 'Junior Developer',
  
  conversationStyle: {
    tone: 'encouraging',
    depth: 'balanced',
    proactivity: 'medium'
  },
  
  closingCriteria: {
    minUserMessages: 2,
    requireUnderstandingDemo: true,
    offerNextSteps: true,
    maxTurns: 8
  },
  
  understandingExpectations: {
    detailLevel: 'moderate',
    allowPartialUnderstanding: true,
    encourageQuestions: true
  },
  
  toneAdjustments: {
    beExtraEncouraging: true,
    offerMoreGuidance: false,
    assumePriorKnowledge: false
  }
};

const midOverlay: ComprehensionLevelOverlay = {
  level: 'mid',
  displayName: 'Mid-Level Developer',
  
  conversationStyle: {
    tone: 'collaborative',
    depth: 'balanced',
    proactivity: 'medium'
  },
  
  closingCriteria: {
    minUserMessages: 2,
    requireUnderstandingDemo: true,
    offerNextSteps: true,
    maxTurns: 6
  },
  
  understandingExpectations: {
    detailLevel: 'moderate',
    allowPartialUnderstanding: false,
    encourageQuestions: true
  },
  
  toneAdjustments: {
    beExtraEncouraging: false,
    offerMoreGuidance: false,
    assumePriorKnowledge: true
  }
};

const seniorOverlay: ComprehensionLevelOverlay = {
  level: 'senior',
  displayName: 'Senior Developer',
  
  conversationStyle: {
    tone: 'direct',
    depth: 'thorough',
    proactivity: 'low'
  },
  
  closingCriteria: {
    minUserMessages: 1,
    requireUnderstandingDemo: false,
    offerNextSteps: true,
    maxTurns: 5
  },
  
  understandingExpectations: {
    detailLevel: 'deep',
    allowPartialUnderstanding: false,
    encourageQuestions: false
  },
  
  toneAdjustments: {
    beExtraEncouraging: false,
    offerMoreGuidance: false,
    assumePriorKnowledge: true
  }
};

const LEVEL_OVERLAYS: Record<string, ComprehensionLevelOverlay> = {
  'intern': internOverlay,
  'junior': juniorOverlay,
  'mid': midOverlay,
  'senior': seniorOverlay
};

export function getComprehensionLevelOverlay(level: string): ComprehensionLevelOverlay {
  const normalizedLevel = level.toLowerCase();
  return LEVEL_OVERLAYS[normalizedLevel] || internOverlay;
}
