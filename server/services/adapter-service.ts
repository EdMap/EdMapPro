/**
 * Server-side Adapter Service for Phase 2
 * 
 * Fetches role adapter data from storage and provides
 * configured settings for both Interview and Workspace simulators.
 */

import { storage } from "../storage";
import type { RoleAdapter, SimulationCatalogue } from "@shared/schema";
import {
  type Role,
  type Level,
  type Language,
  type InterviewConfig,
  type WorkspaceConfig,
  type RoleAdapterData,
  getInterviewConfig,
  getWorkspaceConfig,
  getLevelAdjustments,
  getLanguageExamples,
  normalizeRole,
  normalizeLevel,
} from "@shared/adapters";

export interface AdapterServiceConfig {
  role: Role;
  level: Level;
  language?: Language;
}

class AdapterService {
  private adapterCache: Map<string, RoleAdapter> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private lastCacheClear = Date.now();

  /**
   * Get role adapter data, with caching
   */
  async getRoleAdapter(role: Role): Promise<RoleAdapterData | null> {
    // Clear cache if expired
    if (Date.now() - this.lastCacheClear > this.cacheTimeout) {
      this.adapterCache.clear();
      this.lastCacheClear = Date.now();
    }

    // Check cache first
    if (this.adapterCache.has(role)) {
      const cached = this.adapterCache.get(role)!;
      return this.transformAdapter(cached);
    }

    // Fetch from storage
    const adapter = await storage.getRoleAdapter(role);
    if (!adapter) {
      console.warn(`Role adapter not found for role: ${role}`);
      return null;
    }

    // Cache and return
    this.adapterCache.set(role, adapter);
    return this.transformAdapter(adapter);
  }

  /**
   * Transform database adapter to service format
   */
  private transformAdapter(adapter: RoleAdapter): RoleAdapterData {
    return {
      role: adapter.role,
      displayName: adapter.displayName,
      description: adapter.description,
      levels: adapter.levels as RoleAdapterData['levels'],
      languageOverrides: adapter.languageOverrides as RoleAdapterData['languageOverrides'],
      simulatorSettings: adapter.simulatorSettings as RoleAdapterData['simulatorSettings'],
    };
  }

  /**
   * Get full interview configuration for a user
   */
  async getInterviewConfiguration(config: AdapterServiceConfig): Promise<InterviewConfig | null> {
    const adapterData = await this.getRoleAdapter(config.role);
    if (!adapterData) {
      return null;
    }
    return getInterviewConfig(adapterData, config.level);
  }

  /**
   * Get full workspace configuration for a user
   */
  async getWorkspaceConfiguration(config: AdapterServiceConfig): Promise<WorkspaceConfig | null> {
    const adapterData = await this.getRoleAdapter(config.role);
    if (!adapterData) {
      return null;
    }
    return getWorkspaceConfig(adapterData, config.level, config.language || 'javascript');
  }

  /**
   * Get catalogue items filtered for a specific configuration
   */
  async getCatalogueForConfig(
    simulator: 'interview' | 'workspace',
    config: AdapterServiceConfig
  ): Promise<SimulationCatalogue[]> {
    return storage.getCatalogueItems({
      simulator,
      role: config.role,
      level: config.level,
      language: config.language,
    });
  }

  /**
   * Get interview question configuration
   * Adjusts question parameters based on role and level
   */
  async getInterviewQuestionConfig(config: AdapterServiceConfig): Promise<{
    questionTypes: string[];
    difficulty: string;
    focusAreas: string[];
    panelRoles: string[];
    levelAdjustments: ReturnType<typeof getLevelAdjustments>;
    evaluationCriteria: InterviewConfig['evaluationCriteria'];
  } | null> {
    const interviewConfig = await this.getInterviewConfiguration(config);
    if (!interviewConfig) {
      return null;
    }

    const levelAdjustments = getLevelAdjustments(config.level);

    return {
      questionTypes: interviewConfig.questionTypes,
      difficulty: levelAdjustments.difficultyLabel,
      focusAreas: interviewConfig.focusAreas,
      panelRoles: interviewConfig.panelRoles,
      levelAdjustments,
      evaluationCriteria: interviewConfig.evaluationCriteria,
    };
  }

  /**
   * Get workspace problem configuration
   * Adjusts problem parameters based on role, level, and language
   */
  async getWorkspaceProblemConfig(config: AdapterServiceConfig): Promise<{
    problemTypes: string[];
    teamInteractions: string[];
    focusAreas: string[];
    toolchain: string[];
    frameworks: string[];
    languageExamples: ReturnType<typeof getLanguageExamples>;
    difficultyCalibration: WorkspaceConfig['difficultyCalibration'];
  } | null> {
    const workspaceConfig = await this.getWorkspaceConfiguration(config);
    if (!workspaceConfig) {
      return null;
    }

    const languageExamples = getLanguageExamples(config.language || 'javascript');

    return {
      problemTypes: workspaceConfig.problemTypes,
      teamInteractions: workspaceConfig.teamInteractions,
      focusAreas: workspaceConfig.focusAreas,
      toolchain: workspaceConfig.toolchain,
      frameworks: workspaceConfig.frameworks,
      languageExamples,
      difficultyCalibration: workspaceConfig.difficultyCalibration,
    };
  }

  /**
   * Get all available roles with their display names
   */
  async getAvailableRoles(): Promise<{ role: Role; displayName: string; description: string }[]> {
    const adapters = await storage.getRoleAdapters();
    return adapters.map(a => ({
      role: a.role as Role,
      displayName: a.displayName,
      description: a.description,
    }));
  }

  /**
   * Get all available levels for a role
   */
  async getAvailableLevels(role: Role): Promise<{ level: Level; title: string; expectations: string[] }[]> {
    const adapter = await this.getRoleAdapter(role);
    if (!adapter) {
      return [];
    }

    return Object.entries(adapter.levels).map(([level, config]) => ({
      level: level as Level,
      title: config.title,
      expectations: config.expectations,
    }));
  }

  /**
   * Get available languages for developer role
   */
  async getAvailableLanguages(role: Role): Promise<{ language: Language; toolchain: string[]; frameworks: string[] }[]> {
    const adapter = await this.getRoleAdapter(role);
    if (!adapter || !adapter.languageOverrides) {
      return [{ language: 'javascript', toolchain: ['npm', 'node'], frameworks: ['React', 'Express'] }];
    }

    return Object.entries(adapter.languageOverrides).map(([lang, config]) => ({
      language: lang as Language,
      toolchain: config.toolchain,
      frameworks: config.frameworks,
    }));
  }

  /**
   * Check if a role-level-language combination is valid
   */
  async isValidConfiguration(config: AdapterServiceConfig): Promise<boolean> {
    const adapter = await this.getRoleAdapter(config.role);
    if (!adapter) {
      return false;
    }

    // Check level exists
    if (!adapter.levels[config.level]) {
      return false;
    }

    // Check language exists (if provided and role supports it)
    if (config.language && adapter.languageOverrides) {
      if (!adapter.languageOverrides[config.language]) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const adapterService = new AdapterService();

// Re-export helper functions
export { normalizeRole, normalizeLevel, getLevelAdjustments, getLanguageExamples };
