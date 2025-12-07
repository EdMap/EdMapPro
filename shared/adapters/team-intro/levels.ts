/**
 * Team Introduction Level Overlays
 * 
 * Adjusts conversation style, depth, and behavior based on user's experience level.
 * Interns get more guidance, seniors get peer-level conversations.
 */

import type { TeamIntroLevelOverlay } from './types';

export const internLevelOverlay: TeamIntroLevelOverlay = {
  level: 'intern',
  displayName: 'Intern',
  
  conversationStyle: {
    tone: 'mentoring',
    depth: 'detailed',
    proactivity: 'high',
    followUpOnBriefResponses: true
  },
  
  closingChecklist: {
    mustShareTopics: 2,
    offerNextSteps: true,
    provideContactMethod: true,
    summarizeKeyPoints: true
  },
  
  briefResponseStrategy: {
    offerOptions: true,
    askTargetedFollowUp: true,
    proactivelyShareInfo: true,
    optionPrompts: [
      'Would you like me to explain our code review process?',
      'I can tell you about how we handle [X] if you\'re interested.',
      'Want me to share some tips that helped me when I started?',
      'Should I walk you through what a typical day looks like?'
    ]
  },
  
  toneAdjustments: {
    useSimplifiedLanguage: true,
    offerEncouragement: true,
    assumePriorKnowledge: false,
    treatAsPeer: false
  }
};

export const juniorLevelOverlay: TeamIntroLevelOverlay = {
  level: 'junior',
  displayName: 'Junior',
  
  conversationStyle: {
    tone: 'supportive',
    depth: 'balanced',
    proactivity: 'medium',
    followUpOnBriefResponses: true
  },
  
  closingChecklist: {
    mustShareTopics: 2,
    offerNextSteps: true,
    provideContactMethod: true,
    summarizeKeyPoints: false
  },
  
  briefResponseStrategy: {
    offerOptions: true,
    askTargetedFollowUp: true,
    proactivelyShareInfo: true,
    optionPrompts: [
      'Anything specific about our workflow you\'d like to know?',
      'Happy to share more about how we handle [X].',
      'Any questions about the team or how we work?'
    ]
  },
  
  toneAdjustments: {
    useSimplifiedLanguage: false,
    offerEncouragement: true,
    assumePriorKnowledge: true,
    treatAsPeer: false
  }
};

export const midLevelOverlay: TeamIntroLevelOverlay = {
  level: 'mid',
  displayName: 'Mid-Level',
  
  conversationStyle: {
    tone: 'collaborative',
    depth: 'balanced',
    proactivity: 'medium',
    followUpOnBriefResponses: false
  },
  
  closingChecklist: {
    mustShareTopics: 1,
    offerNextSteps: true,
    provideContactMethod: true,
    summarizeKeyPoints: false
  },
  
  briefResponseStrategy: {
    offerOptions: false,
    askTargetedFollowUp: true,
    proactivelyShareInfo: false,
    optionPrompts: [
      'What aspects of the workflow are you most interested in?',
      'Any specific areas you want to dive deeper on?'
    ]
  },
  
  toneAdjustments: {
    useSimplifiedLanguage: false,
    offerEncouragement: false,
    assumePriorKnowledge: true,
    treatAsPeer: true
  }
};

export const seniorLevelOverlay: TeamIntroLevelOverlay = {
  level: 'senior',
  displayName: 'Senior',
  
  conversationStyle: {
    tone: 'peer',
    depth: 'concise',
    proactivity: 'low',
    followUpOnBriefResponses: false
  },
  
  closingChecklist: {
    mustShareTopics: 1,
    offerNextSteps: false,
    provideContactMethod: true,
    summarizeKeyPoints: false
  },
  
  briefResponseStrategy: {
    offerOptions: false,
    askTargetedFollowUp: false,
    proactivelyShareInfo: false,
    optionPrompts: []
  },
  
  toneAdjustments: {
    useSimplifiedLanguage: false,
    offerEncouragement: false,
    assumePriorKnowledge: true,
    treatAsPeer: true
  }
};

export function getLevelOverlay(level: string): TeamIntroLevelOverlay {
  switch (level) {
    case 'intern':
      return internLevelOverlay;
    case 'junior':
      return juniorLevelOverlay;
    case 'mid':
      return midLevelOverlay;
    case 'senior':
      return seniorLevelOverlay;
    default:
      return juniorLevelOverlay;
  }
}
