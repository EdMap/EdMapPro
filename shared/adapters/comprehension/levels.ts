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
  },
  
  completionCTA: {
    buttonText: 'Start Planning',
    description: "You're ready to join your first sprint planning session!",
    celebrationMessage: 'Great chat! You have a solid understanding of the project.'
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
  },
  
  completionCTA: {
    buttonText: 'Start Planning',
    description: "You're ready for sprint planning!",
    celebrationMessage: 'Nice work! You understand the project well.'
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
  },
  
  completionCTA: {
    buttonText: 'Start Planning',
    description: 'Ready to jump into planning.',
    celebrationMessage: 'Good sync! Ready for planning.'
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
  },
  
  completionCTA: {
    buttonText: 'Start Planning',
    description: 'Move on to planning.',
    celebrationMessage: 'All set. Let\'s plan.'
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
