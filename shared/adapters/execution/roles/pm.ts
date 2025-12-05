/**
 * Product Manager Role Execution Adapter
 * 
 * For PMs, execution focuses on standup facilitation, tracking team progress,
 * writing acceptance criteria, and stakeholder communication.
 */

import type { RoleExecutionAdapter, GitCommand } from '../types';

const pmGitCommands: GitCommand[] = [];

export const pmExecutionAdapter: RoleExecutionAdapter = {
  role: 'pm',
  displayName: 'Product Manager',
  description: 'Team coordination, progress tracking, and stakeholder management',
  competencies: [
    'standup-facilitation',
    'progress-tracking',
    'acceptance-testing',
    'stakeholder-communication',
    'scope-management',
    'team-support',
  ],
  
  gitWorkflow: {
    commands: pmGitCommands,
    branchNamingPattern: '',
    commitMessageGuidelines: [],
    prTemplateHint: '',
  },
  
  standupConfig: {
    isUserFacilitator: true,
    questions: [
      {
        id: 'team_progress',
        question: 'Summarize the team\'s progress',
        placeholder: 'The team has...',
        required: true,
        minLength: 30,
        exampleResponse: 'The team has completed 3 tickets this sprint. TICK-001 is in review, and TICK-002 is in progress with Marcus.',
      },
      {
        id: 'risks',
        question: 'Are there any risks to the sprint goal?',
        placeholder: 'Current risks include... / No significant risks',
        required: true,
        minLength: 10,
        exampleResponse: 'TICK-003 may slip due to unexpected complexity. Considering moving it to next sprint if not resolved by day 8.',
      },
      {
        id: 'stakeholder_updates',
        question: 'Any stakeholder updates to share?',
        placeholder: 'Stakeholder feedback... / No updates',
        required: false,
        exampleResponse: 'Client confirmed the timezone fix is high priority. They are happy with our progress so far.',
      },
    ],
    aiResponseDelay: 1000,
    feedbackEnabled: true,
    baseFeedbackPrompt: `You are a senior PM mentor providing brief feedback on a PM's standup facilitation.
Keep responses under 2 sentences. Focus on: team awareness, risk identification, and stakeholder alignment.
If the summary lacks detail, ask for specifics. Acknowledge good facilitation briefly.`,
  },
  
  ticketWorkConfig: {
    showAcceptanceCriteria: true,
    showCodeSnippets: false,
    allowParallelTickets: true,
    maxInProgress: 5,
    requireGitWorkflow: false,
    autoMoveOnBranchCreate: false,
  },
  
  aiInteractions: {
    personas: [
      {
        id: 'marcus',
        name: 'Marcus',
        role: 'Senior Developer',
        personality: 'Technical expert, provides updates and raises blockers',
        avatarSeed: 'marcus-dev',
        color: '#3B82F6',
      },
      {
        id: 'alex',
        name: 'Alex',
        role: 'QA Engineer',
        personality: 'Quality-focused, reports bugs and test results',
        avatarSeed: 'alex-qa',
        color: '#10B981',
      },
      {
        id: 'sarah',
        name: 'Sarah',
        role: 'Tech Lead',
        personality: 'Strategic partner, discusses technical tradeoffs',
        avatarSeed: 'sarah-lead',
        color: '#F59E0B',
      },
      {
        id: 'stakeholder',
        name: 'Jordan',
        role: 'Stakeholder',
        personality: 'Business-focused, asks about timelines and features',
        avatarSeed: 'jordan-stakeholder',
        color: '#EC4899',
      },
    ],
    standupFacilitator: 'user',
    prReviewers: [],
    helpResponders: ['sarah', 'marcus'],
    interruptionFrequency: 'medium',
  },
  
  prReviewConfig: {
    enabled: false,
    minCommentsPerPR: 0,
    maxCommentsPerPR: 0,
    requireAllResolved: false,
    autoApproveThreshold: 100,
  },
  
  uiControls: {
    showGitTerminal: false,
    showTeamChat: true,
    showAcceptanceCriteria: true,
    showWorkflowProgress: true,
    showMentorHints: true,
    splitPanelLayout: 'terminal-right',
  },
  
  difficulty: {
    gitCommandStrictness: 'lenient',
    prReviewIntensity: 'gentle',
  },
  
  evaluation: {
    rubricWeights: {
      gitMastery: 0.00,
      deliveryReliability: 0.25,
      communicationQuality: 0.30,
      collaborationSkill: 0.25,
      codeReviewResponse: 0.20,
    },
    passingThreshold: 70,
    requiredTicketsComplete: 3,
    requiredPRsReviewed: 0,
  },
  
  learningObjectives: [
    {
      phase: 'standup',
      objectives: [
        'Facilitate effective daily standups',
        'Track team progress and velocity',
        'Identify and address blockers proactively',
      ],
      tips: [
        'Keep standups timeboxed to 15 minutes',
        'Follow up on blockers immediately after standup',
        'Track sprint burndown to identify risks early',
      ],
    },
    {
      phase: 'work',
      objectives: [
        'Review acceptance criteria for completeness',
        'Support team with clarifications',
        'Manage scope changes appropriately',
      ],
      tips: [
        'Be available for quick questions from developers',
        'Document any scope changes and their rationale',
        'Test completed features against acceptance criteria',
      ],
    },
    {
      phase: 'review',
      objectives: [
        'Validate delivered features meet requirements',
        'Provide feedback on completed work',
        'Prepare demo materials for stakeholders',
      ],
      tips: [
        'Test edge cases mentioned in acceptance criteria',
        'Give specific, actionable feedback',
        'Celebrate team wins and progress',
      ],
    },
  ],
};
