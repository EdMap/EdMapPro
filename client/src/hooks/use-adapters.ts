/**
 * Client-side hooks for Phase 2 Adapters
 * 
 * Provides React Query hooks for fetching adapter configurations
 * for both Interview and Workspace simulators.
 */

import { useQuery } from "@tanstack/react-query";

export type Role = 'developer' | 'pm' | 'qa' | 'devops' | 'data_science';
export type Level = 'intern' | 'junior' | 'mid' | 'senior';
export type Language = 'javascript' | 'python' | 'c_cpp';

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
    strictness: number;
    passingThreshold: number;
    criticalSkills: string[];
  };
}

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

export interface InterviewQuestionConfig {
  questionTypes: string[];
  difficulty: string;
  focusAreas: string[];
  panelRoles: string[];
  levelAdjustments: {
    difficultyLabel: string;
    questionDepth: 'surface' | 'moderate' | 'deep' | 'expert';
    timeAllocation: number;
    followUpLikelihood: number;
    hintAvailability: boolean;
  };
  evaluationCriteria: {
    strictness: number;
    passingThreshold: number;
    criticalSkills: string[];
  };
}

export interface WorkspaceProblemConfig {
  problemTypes: string[];
  teamInteractions: string[];
  focusAreas: string[];
  toolchain: string[];
  frameworks: string[];
  languageExamples: {
    sampleCode: string;
    commonErrors: string[];
    testCommand: string;
    buildCommand: string;
    packageManager: string;
  };
  difficultyCalibration: {
    complexity: string;
    scaffolding: string;
    expectations: string[];
  };
}

export interface AvailableRole {
  role: Role;
  displayName: string;
  description: string;
}

export interface AvailableLevel {
  level: Level;
  title: string;
  expectations: string[];
}

export interface AvailableLanguage {
  language: Language;
  toolchain: string[];
  frameworks: string[];
}

/**
 * Hook to fetch interview configuration for a role/level
 */
export function useInterviewConfig(role: string | null, level: string | null) {
  return useQuery<InterviewConfig>({
    queryKey: ['/api/adapters/interview-config', role, level],
    enabled: !!role && !!level,
  });
}

/**
 * Hook to fetch workspace configuration for a role/level/language
 */
export function useWorkspaceConfig(
  role: string | null,
  level: string | null,
  language: string = 'javascript'
) {
  return useQuery<WorkspaceConfig>({
    queryKey: ['/api/adapters/workspace-config', role, level, language],
    enabled: !!role && !!level,
  });
}

/**
 * Hook to fetch interview question configuration
 */
export function useInterviewQuestionConfig(role: string | null, level: string | null) {
  return useQuery<InterviewQuestionConfig>({
    queryKey: ['/api/adapters/interview-questions', role, level],
    enabled: !!role && !!level,
  });
}

/**
 * Hook to fetch workspace problem configuration
 */
export function useWorkspaceProblemConfig(
  role: string | null,
  level: string | null,
  language: string = 'javascript'
) {
  return useQuery<WorkspaceProblemConfig>({
    queryKey: ['/api/adapters/workspace-problems', role, level, language],
    enabled: !!role && !!level,
  });
}

/**
 * Hook to fetch all available roles
 */
export function useAvailableRoles() {
  return useQuery<AvailableRole[]>({
    queryKey: ['/api/adapters/available-roles'],
  });
}

/**
 * Hook to fetch available levels for a role
 */
export function useAvailableLevels(role: string | null) {
  return useQuery<AvailableLevel[]>({
    queryKey: ['/api/adapters/available-levels', role],
    enabled: !!role,
  });
}

/**
 * Hook to fetch available languages for a role
 */
export function useAvailableLanguages(role: string | null) {
  return useQuery<AvailableLanguage[]>({
    queryKey: ['/api/adapters/available-languages', role],
    enabled: !!role,
  });
}

/**
 * Map display names to normalized role values
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
 * Map display names to normalized level values
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

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: Role): string {
  const displayNames: Record<Role, string> = {
    developer: 'Software Developer',
    pm: 'Product Manager',
    qa: 'QA Engineer',
    devops: 'DevOps Engineer',
    data_science: 'Data Scientist',
  };
  return displayNames[role] || 'Developer';
}

/**
 * Get display name for a level
 */
export function getLevelDisplayName(level: Level): string {
  const displayNames: Record<Level, string> = {
    intern: 'Intern',
    junior: 'Junior',
    mid: 'Mid-level',
    senior: 'Senior',
  };
  return displayNames[level] || 'Intern';
}

/**
 * Get display name for a language
 */
export function getLanguageDisplayName(language: Language): string {
  const displayNames: Record<Language, string> = {
    javascript: 'JavaScript/TypeScript',
    python: 'Python',
    c_cpp: 'C/C++',
  };
  return displayNames[language] || 'JavaScript';
}
