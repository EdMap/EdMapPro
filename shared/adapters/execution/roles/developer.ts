/**
 * Developer Role Execution Adapter
 * 
 * For developers (including QA, DevOps, Data Science), execution focuses on
 * full git workflow, code implementation, and PR review response.
 */

import type { RoleExecutionAdapter, GitCommand } from '../types';

const developerGitCommands: GitCommand[] = [
  {
    id: 'branch',
    order: 1,
    instruction: 'Create a feature branch for this ticket',
    hint: 'Use git checkout -b with a descriptive branch name',
    validPatterns: [
      /^git\s+checkout\s+-b\s+\S+$/i,
      /^git\s+switch\s+-c\s+\S+$/i,
    ],
    successOutput: (ticketId: string) => `Switched to a new branch 'feature/${ticketId.toLowerCase()}-fix'`,
    failureHint: 'Try: git checkout -b feature/TICK-001-description',
    competency: 'git-branching',
  },
  {
    id: 'add',
    order: 2,
    instruction: 'Stage your changes for commit',
    hint: 'Use git add to stage files',
    validPatterns: [
      /^git\s+add\s+\.$/i,
      /^git\s+add\s+-A$/i,
      /^git\s+add\s+--all$/i,
      /^git\s+add\s+\S+/i,
    ],
    successOutput: '',
    failureHint: 'Try: git add . (to stage all changes)',
    competency: 'git-staging',
    requiresPreviousStep: 'branch',
  },
  {
    id: 'commit',
    order: 3,
    instruction: 'Commit your changes with a descriptive message',
    hint: 'Use conventional commit format: type(scope): description',
    validPatterns: [
      /^git\s+commit\s+-m\s+["']?.+["']?$/i,
    ],
    successOutput: (ticketId: string) => `[feature/${ticketId.toLowerCase()}-fix abc1234] Your commit message
 2 files changed, 45 insertions(+), 12 deletions(-)`,
    failureHint: 'Try: git commit -m "fix(timezone): convert timestamps to local timezone"',
    competency: 'git-commits',
    requiresPreviousStep: 'add',
  },
  {
    id: 'push',
    order: 4,
    instruction: 'Push your branch to the remote repository',
    hint: 'Push to origin with your branch name',
    validPatterns: [
      /^git\s+push\s+(-u\s+)?origin\s+\S+$/i,
      /^git\s+push\s+--set-upstream\s+origin\s+\S+$/i,
      /^git\s+push$/i,
    ],
    successOutput: (ticketId: string) => `Enumerating objects: 8, done.
Counting objects: 100% (8/8), done.
Delta compression using up to 8 threads
Compressing objects: 100% (4/4), done.
Writing objects: 100% (5/5), 1.23 KiB | 1.23 MiB/s, done.
Total 5 (delta 2), reused 0 (delta 0)
remote: Resolving deltas: 100% (2/2), completed with 2 local objects.
To github.com:novapay/merchant-dashboard.git
 * [new branch]      feature/${ticketId.toLowerCase()}-fix -> feature/${ticketId.toLowerCase()}-fix
Branch 'feature/${ticketId.toLowerCase()}-fix' set up to track remote branch 'feature/${ticketId.toLowerCase()}-fix' from 'origin'.`,
    failureHint: 'Try: git push -u origin feature/TICK-001-fix',
    competency: 'git-remote',
    requiresPreviousStep: 'commit',
  },
  {
    id: 'pr',
    order: 5,
    instruction: 'Create a pull request for code review',
    hint: 'Use GitHub CLI or the button to open a PR',
    validPatterns: [
      /^gh\s+pr\s+create/i,
      /^git\s+request-pull/i,
    ],
    successOutput: `Creating pull request for feature/tick-001-fix into main

? Title Fix timezone display in transaction history
? Body <Received>

https://github.com/novapay/merchant-dashboard/pull/142

Pull request created successfully!`,
    failureHint: 'Try: gh pr create --title "Fix timezone bug" --body "Description..."',
    competency: 'pull-requests',
    requiresPreviousStep: 'push',
  },
];

export const developerExecutionAdapter: RoleExecutionAdapter = {
  role: 'developer',
  displayName: 'Software Developer',
  description: 'Full implementation workflow with git commands, code changes, and PR reviews',
  competencies: [
    'git-branching',
    'git-staging', 
    'git-commits',
    'git-remote',
    'pull-requests',
    'code-review-response',
    'ticket-delivery',
  ],
  
  gitWorkflow: {
    commands: developerGitCommands,
    branchNamingPattern: 'feature|fix|bugfix|hotfix/TICKET-ID-short-description',
    commitMessageGuidelines: [
      'Use conventional commits: type(scope): description',
      'Types: feat, fix, docs, style, refactor, test, chore',
      'Keep subject line under 50 characters',
      'Use imperative mood: "Add feature" not "Added feature"',
    ],
    prTemplateHint: 'Include: What changed, Why, How to test, Screenshots if UI',
  },
  
  standupConfig: {
    isUserFacilitator: false,
    questions: [
      {
        id: 'yesterday',
        question: 'What did you work on yesterday?',
        placeholder: 'I worked on...',
        required: true,
        minLength: 20,
        exampleResponse: 'I started investigating the timezone bug in TICK-001 and identified the root cause in the date formatting utility.',
      },
      {
        id: 'today',
        question: 'What will you work on today?',
        placeholder: 'Today I plan to...',
        required: true,
        minLength: 20,
        exampleResponse: 'I will implement the fix for TICK-001 and write unit tests to cover the timezone edge cases.',
      },
      {
        id: 'blockers',
        question: 'Do you have any blockers?',
        placeholder: 'No blockers / I am blocked by...',
        required: true,
        minLength: 5,
        exampleResponse: 'No blockers. I might need a quick review from Marcus once the PR is ready.',
      },
    ],
    aiResponseDelay: 1500,
    feedbackEnabled: true,
    baseFeedbackPrompt: `You are a supportive PM providing brief feedback on a developer's standup update. 
Keep responses under 2 sentences. Focus on: clarity, specificity, and highlighting good communication.
If the update is vague, gently ask for more detail. If it's good, acknowledge briefly.`,
  },
  
  ticketWorkConfig: {
    showAcceptanceCriteria: true,
    showCodeSnippets: true,
    allowParallelTickets: false,
    maxInProgress: 1,
    requireGitWorkflow: true,
    autoMoveOnBranchCreate: true,
  },
  
  codeWorkConfig: {
    enabled: true,
    baseMode: 'guided-diff',
    requireCompletionBeforeStage: true,
    showDiffView: true,
    showRunTests: true,
    steps: [
      {
        id: 'understand',
        label: 'Understand the bug',
        description: 'Read the code and identify the issue',
        required: true,
      },
      {
        id: 'implement',
        label: 'Apply the fix',
        description: 'Make the necessary code changes',
        required: true,
      },
      {
        id: 'test',
        label: 'Test your changes',
        description: 'Verify the fix works correctly',
        required: true,
      },
    ],
    mentorHints: [
      'Take your time to understand the existing code before making changes.',
      'Think about edge cases that might be affected by your fix.',
      'Remember to test your changes before committing.',
    ],
    completionMessage: 'Great job! Your code changes are ready to be staged.',
  },
  
  aiInteractions: {
    personas: [
      {
        id: 'priya',
        name: 'Priya',
        role: 'Product Manager',
        personality: 'Organized, clear communicator, focuses on user value',
        avatarSeed: 'priya-pm',
        color: '#8B5CF6',
      },
      {
        id: 'marcus',
        name: 'Marcus',
        role: 'Senior Developer',
        personality: 'Technical mentor, patient, shares best practices',
        avatarSeed: 'marcus-dev',
        color: '#3B82F6',
      },
      {
        id: 'alex',
        name: 'Alex',
        role: 'QA Engineer',
        personality: 'Detail-oriented, focuses on edge cases and testing',
        avatarSeed: 'alex-qa',
        color: '#10B981',
      },
      {
        id: 'sarah',
        name: 'Sarah',
        role: 'Tech Lead',
        personality: 'Strategic thinker, handles escalations and architecture',
        avatarSeed: 'sarah-lead',
        color: '#F59E0B',
      },
    ],
    standupFacilitator: 'priya',
    prReviewers: ['marcus', 'alex'],
    helpResponders: ['marcus', 'sarah'],
    interruptionFrequency: 'low',
  },
  
  prReviewConfig: {
    enabled: true,
    minCommentsPerPR: 1,
    maxCommentsPerPR: 3,
    requireAllResolved: true,
    autoApproveThreshold: 0,
    maxRevisionCycles: 3,
    baseReviewers: [
      {
        id: 'marcus',
        name: 'Marcus',
        role: 'Senior Developer',
        personality: 'Thorough but supportive. Focuses on code quality and best practices.',
        avatarSeed: 'marcus-dev',
        color: '#3B82F6',
        expertise: ['architecture', 'code-patterns', 'performance'],
        reviewStyle: 'thorough',
        focusAreas: ['code structure', 'naming', 'maintainability'],
      },
      {
        id: 'alex',
        name: 'Alex',
        role: 'QA Engineer',
        personality: 'Detail-oriented. Catches edge cases and testing gaps.',
        avatarSeed: 'alex-qa',
        color: '#10B981',
        expertise: ['testing', 'edge-cases', 'error-handling'],
        reviewStyle: 'balanced',
        focusAreas: ['test coverage', 'error handling', 'validation'],
      },
    ],
    baseUIConfig: {
      layoutMode: 'split-diff',
      showDiffViewer: true,
      showFileTree: true,
      showTimeline: true,
      inlineComments: true,
      expandThreadsByDefault: true,
    },
    basePrompts: {
      baseSystemPrompt: `You are a code reviewer on a professional software team. Provide constructive feedback that helps developers improve while maintaining a collaborative tone.`,
      initialReviewPrompt: `Review this pull request. Consider: code quality, potential bugs, test coverage, and adherence to team standards. Provide specific, actionable feedback.`,
      followUpPrompt: `The developer has addressed your previous feedback. Review the changes and determine if the issues are resolved or if further improvements are needed.`,
      approvalCriteria: [
        'Code follows team style guidelines',
        'No obvious bugs or security issues',
        'Tests cover main functionality',
        'Commit message is clear',
      ],
      commonIssuesHint: [
        'Missing error handling',
        'Hardcoded values',
        'Missing tests for edge cases',
        'Unclear variable names',
      ],
    },
  },
  
  uiControls: {
    showGitTerminal: true,
    showTeamChat: true,
    showAcceptanceCriteria: true,
    showWorkflowProgress: true,
    showMentorHints: true,
    splitPanelLayout: 'terminal-right',
    layout: {
      mode: 'two-column',
      sidebarPosition: 'right',
      sidebarWidth: 'medium',
      codeWorkPosition: 'above-terminal',
      terminalHeight: 'medium',
      chatPosition: 'sidebar',
      collapsiblePanels: true,
      animateTransitions: true,
      mobileBreakpoint: 'lg',
    },
  },
  
  difficulty: {
    gitCommandStrictness: 'moderate',
    prReviewIntensity: 'moderate',
  },
  
  evaluation: {
    rubricWeights: {
      gitMastery: 0.25,
      deliveryReliability: 0.25,
      communicationQuality: 0.15,
      collaborationSkill: 0.15,
      codeReviewResponse: 0.20,
    },
    passingThreshold: 70,
    requiredTicketsComplete: 2,
    requiredPRsReviewed: 2,
  },
  
  learningObjectives: [
    {
      phase: 'standup',
      objectives: [
        'Communicate progress clearly and concisely',
        'Identify and escalate blockers early',
        'Set realistic daily goals',
      ],
      tips: [
        'Be specific about what you accomplished, not just "worked on X"',
        'Mention ticket IDs so the team can track progress',
        'If blocked, explain what you need to get unblocked',
      ],
    },
    {
      phase: 'work',
      objectives: [
        'Follow git workflow best practices',
        'Write clear commit messages',
        'Create focused, reviewable pull requests',
      ],
      tips: [
        'Create a branch before making any changes',
        'Commit frequently with descriptive messages',
        'Keep PRs small and focused on one change',
      ],
    },
    {
      phase: 'review',
      objectives: [
        'Respond to code review feedback professionally',
        'Iterate based on suggestions',
        'Learn from senior developer feedback',
      ],
      tips: [
        'Thank reviewers for their feedback',
        'Ask clarifying questions if something is unclear',
        'Apply feedback and push updates promptly',
      ],
    },
  ],
};

export const qaExecutionAdapter: RoleExecutionAdapter = {
  ...developerExecutionAdapter,
  role: 'qa',
  displayName: 'QA Engineer',
  description: 'Testing-focused workflow with emphasis on test coverage and quality',
  competencies: [
    ...developerExecutionAdapter.competencies,
    'test-planning',
    'bug-reporting',
  ],
};

export const devopsExecutionAdapter: RoleExecutionAdapter = {
  ...developerExecutionAdapter,
  role: 'devops',
  displayName: 'DevOps Engineer',
  description: 'Infrastructure and deployment workflow with CI/CD focus',
  competencies: [
    ...developerExecutionAdapter.competencies,
    'ci-cd-pipelines',
    'infrastructure-as-code',
  ],
};

export const dataScienceExecutionAdapter: RoleExecutionAdapter = {
  ...developerExecutionAdapter,
  role: 'data_science',
  displayName: 'Data Scientist',
  description: 'Data analysis workflow with notebook and experiment tracking',
  competencies: [
    ...developerExecutionAdapter.competencies,
    'experiment-tracking',
    'data-documentation',
  ],
};
