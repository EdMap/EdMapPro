/**
 * Unified Adapter Service for Phase 2
 * 
 * Provides dynamic configuration for both Interview and Workspace simulators
 * based on user's role, level, and language preferences.
 */

export type Role = 'developer' | 'pm' | 'qa' | 'devops' | 'data_science';
export type Level = 'intern' | 'junior' | 'mid' | 'senior';
export type Language = 'javascript' | 'python' | 'c_cpp';
export type Simulator = 'interview' | 'workspace';

// Interview-specific types
export interface InterviewConfig {
  role: Role;
  level: Level;
  focusAreas: string[];
  panelRoles: string[];
  questionTypes: string[];
  difficultyCalibration: {
    complexity: string;
    scaffolding: string;
    expectations: string[];
  };
  evaluationCriteria: {
    strictness: number; // 0-1, higher = stricter
    passingThreshold: number;
    criticalSkills: string[];
  };
}

// Workspace-specific types
export interface WorkspaceConfig {
  role: Role;
  level: Level;
  language: Language;
  focusAreas: string[];
  teamInteractions: string[];
  problemTypes: string[];
  toolchain: string[];
  frameworks: string[];
  difficultyCalibration: {
    complexity: string;
    scaffolding: string;
    expectations: string[];
  };
}

// Combined adapter config from API
export interface RoleAdapterData {
  role: string;
  displayName: string;
  description: string;
  levels: Record<string, {
    title: string;
    expectations: string[];
    scaffolding: string;
    complexity: string;
  }>;
  languageOverrides?: Record<string, {
    toolchain: string[];
    frameworks: string[];
  }>;
  simulatorSettings: {
    interview: {
      focusAreas: string[];
      panelRoles: string[];
    };
    workspace: {
      focusAreas: string[];
      teamInteractions: string[];
    };
  };
}

/**
 * Get interview configuration based on role and level
 */
export function getInterviewConfig(
  adapterData: RoleAdapterData,
  level: Level
): InterviewConfig {
  const levelConfig = adapterData.levels[level] || adapterData.levels.intern;
  const interviewSettings = adapterData.simulatorSettings.interview;
  
  // Map complexity to strictness
  const strictnessMap: Record<string, number> = {
    'simple': 0.3,
    'moderate': 0.5,
    'complex': 0.7,
    'advanced': 0.9,
  };
  
  // Map scaffolding to passing threshold
  const thresholdMap: Record<string, number> = {
    'high': 50,
    'medium': 60,
    'low': 70,
    'none': 80,
  };
  
  // Determine question types based on focus areas
  const questionTypes = interviewSettings.focusAreas.map(area => {
    const typeMap: Record<string, string> = {
      'technical': 'Technical Interview',
      'system-design': 'System Design',
      'coding-challenges': 'Coding Challenge',
      'product-sense': 'Product Sense',
      'analytical': 'Analytical',
      'execution': 'Execution',
      'leadership': 'Leadership',
      'testing-methodology': 'Testing Methodology',
      'automation': 'Automation',
      'quality-processes': 'Quality Processes',
      'infrastructure': 'Infrastructure',
      'reliability': 'Reliability',
      'troubleshooting': 'Troubleshooting',
      'statistics': 'Statistics',
      'machine-learning': 'Machine Learning',
      'product-analytics': 'Product Analytics',
      'experimentation': 'Experimentation',
    };
    return typeMap[area] || 'Behavioral Interview';
  });

  return {
    role: adapterData.role as Role,
    level,
    focusAreas: interviewSettings.focusAreas,
    panelRoles: interviewSettings.panelRoles,
    questionTypes,
    difficultyCalibration: {
      complexity: levelConfig.complexity,
      scaffolding: levelConfig.scaffolding,
      expectations: levelConfig.expectations,
    },
    evaluationCriteria: {
      strictness: strictnessMap[levelConfig.complexity] || 0.5,
      passingThreshold: thresholdMap[levelConfig.scaffolding] || 60,
      criticalSkills: interviewSettings.focusAreas.slice(0, 2),
    },
  };
}

/**
 * Get workspace configuration based on role, level, and language
 */
export function getWorkspaceConfig(
  adapterData: RoleAdapterData,
  level: Level,
  language: Language = 'javascript'
): WorkspaceConfig {
  const levelConfig = adapterData.levels[level] || adapterData.levels.intern;
  const workspaceSettings = adapterData.simulatorSettings.workspace;
  const languageConfig = adapterData.languageOverrides?.[language];
  
  // Determine problem types based on focus areas
  const problemTypes = workspaceSettings.focusAreas.map(area => {
    const typeMap: Record<string, string> = {
      'coding': 'code_fix',
      'debugging': 'debug_exercise',
      'git': 'git_workflow',
      'code-review': 'code_review',
      'testing': 'test_writing',
      'requirements': 'requirements_analysis',
      'prioritization': 'backlog_prioritization',
      'stakeholder-management': 'stakeholder_meeting',
      'metrics': 'metrics_analysis',
      'test-planning': 'test_plan',
      'bug-reporting': 'bug_report',
      'automation': 'automation_setup',
      'regression': 'regression_testing',
      'infrastructure': 'infra_setup',
      'ci-cd': 'pipeline_config',
      'monitoring': 'monitoring_setup',
      'security': 'security_audit',
      'data-analysis': 'data_analysis',
      'modeling': 'model_building',
      'experimentation': 'experiment_design',
      'visualization': 'visualization_task',
    };
    return typeMap[area] || 'general_task';
  });

  return {
    role: adapterData.role as Role,
    level,
    language,
    focusAreas: workspaceSettings.focusAreas,
    teamInteractions: workspaceSettings.teamInteractions,
    problemTypes,
    toolchain: languageConfig?.toolchain || ['npm', 'node', 'vite', 'jest'],
    frameworks: languageConfig?.frameworks || ['React', 'Express', 'Next.js'],
    difficultyCalibration: {
      complexity: levelConfig.complexity,
      scaffolding: levelConfig.scaffolding,
      expectations: levelConfig.expectations,
    },
  };
}

/**
 * Get level-specific adjustments for interview questions
 */
export function getLevelAdjustments(level: Level): {
  difficultyLabel: string;
  questionDepth: 'surface' | 'moderate' | 'deep' | 'expert';
  timeAllocation: number; // minutes per question
  followUpLikelihood: number; // 0-1
  hintAvailability: boolean;
} {
  const adjustments: Record<Level, ReturnType<typeof getLevelAdjustments>> = {
    intern: {
      difficultyLabel: 'junior',
      questionDepth: 'surface',
      timeAllocation: 3,
      followUpLikelihood: 0.3,
      hintAvailability: true,
    },
    junior: {
      difficultyLabel: 'junior',
      questionDepth: 'moderate',
      timeAllocation: 4,
      followUpLikelihood: 0.5,
      hintAvailability: true,
    },
    mid: {
      difficultyLabel: 'mid',
      questionDepth: 'deep',
      timeAllocation: 5,
      followUpLikelihood: 0.7,
      hintAvailability: false,
    },
    senior: {
      difficultyLabel: 'senior',
      questionDepth: 'expert',
      timeAllocation: 6,
      followUpLikelihood: 0.9,
      hintAvailability: false,
    },
  };
  
  return adjustments[level];
}

/**
 * Get language-specific code examples and error patterns
 */
export function getLanguageExamples(language: Language): {
  sampleCode: string;
  commonErrors: string[];
  testCommand: string;
  buildCommand: string;
  packageManager: string;
} {
  const examples: Record<Language, ReturnType<typeof getLanguageExamples>> = {
    javascript: {
      sampleCode: `function formatDate(date) {
  return new Date(date).toLocaleDateString();
}`,
      commonErrors: [
        'TypeError: Cannot read property of undefined',
        'ReferenceError: variable is not defined',
        'SyntaxError: Unexpected token',
      ],
      testCommand: 'npm test',
      buildCommand: 'npm run build',
      packageManager: 'npm',
    },
    python: {
      sampleCode: `def format_date(date):
    from datetime import datetime
    return datetime.strptime(date, '%Y-%m-%d').strftime('%B %d, %Y')`,
      commonErrors: [
        'TypeError: unsupported operand type',
        'NameError: name is not defined',
        'IndentationError: unexpected indent',
      ],
      testCommand: 'pytest',
      buildCommand: 'python setup.py build',
      packageManager: 'pip',
    },
    c_cpp: {
      sampleCode: `#include <stdio.h>
void format_date(const char* date) {
    printf("Date: %s\\n", date);
}`,
      commonErrors: [
        'Segmentation fault (core dumped)',
        'undefined reference to function',
        'implicit declaration of function',
      ],
      testCommand: './run_tests',
      buildCommand: 'make build',
      packageManager: 'cmake',
    },
  };
  
  return examples[language];
}

/**
 * Map display role name to internal role key
 */
export function normalizeRole(roleName: string): Role {
  const roleMap: Record<string, Role> = {
    'developer': 'developer',
    'software developer': 'developer',
    'software engineer': 'developer',
    'engineer': 'developer',
    'pm': 'pm',
    'product manager': 'pm',
    'product': 'pm',
    'qa': 'qa',
    'qa engineer': 'qa',
    'quality assurance': 'qa',
    'tester': 'qa',
    'devops': 'devops',
    'devops engineer': 'devops',
    'sre': 'devops',
    'site reliability': 'devops',
    'data science': 'data_science',
    'data scientist': 'data_science',
    'data_science': 'data_science',
    'ml engineer': 'data_science',
  };
  
  const normalized = roleName.toLowerCase().trim();
  return roleMap[normalized] || 'developer';
}

/**
 * Map display level name to internal level key
 */
export function normalizeLevel(levelName: string): Level {
  const levelMap: Record<string, Level> = {
    'intern': 'intern',
    'internship': 'intern',
    'entry': 'intern',
    'junior': 'junior',
    'associate': 'junior',
    'mid': 'mid',
    'mid-level': 'mid',
    'intermediate': 'mid',
    'senior': 'senior',
    'lead': 'senior',
    'staff': 'senior',
    'principal': 'senior',
  };
  
  const normalized = levelName.toLowerCase().trim();
  return levelMap[normalized] || 'intern';
}

export { getSprintExecutionAdapter } from './execution';
export type * from './execution/types';

export { getStandupAdapter } from './standup';
export type * from './standup/types';
