import type { z } from "zod";
import type {
  StandupScriptSchema,
  DevSetupStepsSchema,
  GitWorkflowStepsSchema,
  CodebaseStructureSchema,
  CodeExerciseSchema,
  BranchCreationSchema,
  InterviewConfigSchema,
  QuestionBanksSchema,
  TeamPersonasSchema,
  EvaluationRubricsSchema
} from "./loaders";

export type CatalogueItemType = 
  | "standup_script"
  | "dev_setup_steps" 
  | "git_workflow_steps"
  | "codebase_structure"
  | "code_exercise"
  | "branch_creation"
  | "interview_configuration"
  | "question_bank"
  | "team_personas"
  | "evaluation_rubrics"
  | "daily_activities"
  | "team_members"
  | "onboarding_documentation"
  | "ticket";

export type SimulatorType = "workspace" | "interview";
export type RoleType = "developer" | "pm" | "qa" | "devops" | "data_science";
export type LevelType = "intern" | "junior" | "mid" | "senior";
export type LanguageType = "javascript" | "python" | "c_cpp";

export interface CatalogueQuery {
  simulator?: SimulatorType;
  type?: CatalogueItemType;
  role?: RoleType;
  level?: LevelType;
  language?: LanguageType;
  day?: number;
}

export interface CatalogueItemMeta {
  id: string;
  type: CatalogueItemType;
  simulator: SimulatorType;
  version: string;
  role?: RoleType;
  level?: LevelType;
  language?: LanguageType;
  day?: number;
}

export interface CatalogueItem<T = unknown> {
  meta: CatalogueItemMeta;
  content: T;
}

type StandupScript = z.infer<typeof StandupScriptSchema>;
type DevSetupSteps = z.infer<typeof DevSetupStepsSchema>;
type GitWorkflowSteps = z.infer<typeof GitWorkflowStepsSchema>;
type CodebaseStructure = z.infer<typeof CodebaseStructureSchema>;
type CodeExercise = z.infer<typeof CodeExerciseSchema>;
type BranchCreation = z.infer<typeof BranchCreationSchema>;
type InterviewConfig = z.infer<typeof InterviewConfigSchema>;
type QuestionBank = z.infer<typeof QuestionBanksSchema>;
type TeamPersonas = z.infer<typeof TeamPersonasSchema>;
type EvaluationRubrics = z.infer<typeof EvaluationRubricsSchema>;

function matchesQuery(meta: CatalogueItemMeta, query: CatalogueQuery): boolean {
  if (query.simulator && meta.simulator !== query.simulator) return false;
  if (query.type && meta.type !== query.type) return false;
  if (query.role && meta.role !== query.role) return false;
  if (query.level && meta.level !== query.level) return false;
  if (query.language && meta.language !== query.language) return false;
  if (query.day !== undefined && meta.day !== query.day) return false;
  return true;
}

class CatalogueService {
  private items: Map<string, CatalogueItem> = new Map();
  private initialized = false;

  private async loadAllItems(): Promise<void> {
    if (this.initialized) return;

    const standupData = await import("./workspace/standup-script.json");
    const devSetupData = await import("./workspace/dev-setup-steps.json");
    const gitWorkflowData = await import("./workspace/git-workflow-steps.json");
    const codebaseData = await import("./workspace/codebase-structure.json");
    const codeExerciseData = await import("./workspace/code-exercise-timezone.json");
    const branchData = await import("./workspace/branch-creation.json");
    const interviewConfigData = await import("./interview/interview-config.json");

    this.registerItem("workspace-standup-day2", {
      meta: {
        id: "workspace-standup-day2",
        type: "standup_script",
        simulator: "workspace",
        version: standupData.version,
        role: standupData.metadata?.role as RoleType,
        language: standupData.metadata?.language as LanguageType,
        day: standupData.metadata?.day
      },
      content: standupData.content
    });

    this.registerItem("workspace-dev-setup-day2", {
      meta: {
        id: "workspace-dev-setup-day2",
        type: "dev_setup_steps",
        simulator: "workspace",
        version: devSetupData.version,
        role: devSetupData.metadata?.role as RoleType,
        language: devSetupData.metadata?.language as LanguageType,
        day: devSetupData.metadata?.day
      },
      content: devSetupData.content
    });

    this.registerItem("workspace-git-workflow-day2", {
      meta: {
        id: "workspace-git-workflow-day2",
        type: "git_workflow_steps",
        simulator: "workspace",
        version: gitWorkflowData.version,
        role: gitWorkflowData.metadata?.role as RoleType,
        language: gitWorkflowData.metadata?.language as LanguageType,
        day: gitWorkflowData.metadata?.day
      },
      content: gitWorkflowData.content
    });

    this.registerItem("workspace-codebase-structure", {
      meta: {
        id: "workspace-codebase-structure",
        type: "codebase_structure",
        simulator: "workspace",
        version: codebaseData.version,
        role: codebaseData.metadata?.role as RoleType,
        language: codebaseData.metadata?.language as LanguageType,
        day: codebaseData.metadata?.day
      },
      content: codebaseData.content
    });

    this.registerItem("workspace-code-exercise-timezone", {
      meta: {
        id: "workspace-code-exercise-timezone",
        type: "code_exercise",
        simulator: "workspace",
        version: codeExerciseData.version,
        role: codeExerciseData.metadata?.role as RoleType,
        language: codeExerciseData.metadata?.language as LanguageType,
        day: codeExerciseData.metadata?.day
      },
      content: codeExerciseData.content
    });

    this.registerItem("workspace-branch-creation", {
      meta: {
        id: "workspace-branch-creation",
        type: "branch_creation",
        simulator: "workspace",
        version: branchData.version,
        role: branchData.metadata?.role as RoleType,
        language: branchData.metadata?.language as LanguageType,
        day: branchData.metadata?.day
      },
      content: branchData.content
    });

    this.registerItem("interview-configuration", {
      meta: {
        id: "interview-configuration",
        type: "interview_configuration",
        simulator: "interview",
        version: interviewConfigData.version
      },
      content: interviewConfigData.content
    });

    this.initialized = true;
  }

  private registerItem(id: string, item: CatalogueItem): void {
    this.items.set(id, item);
  }

  async getItems(query: CatalogueQuery = {}): Promise<CatalogueItem[]> {
    await this.loadAllItems();
    const results: CatalogueItem[] = [];
    
    const allItems = Array.from(this.items.values());
    for (const item of allItems) {
      if (matchesQuery(item.meta, query)) {
        results.push(item);
      }
    }
    
    return results;
  }

  async getItem<T>(id: string): Promise<CatalogueItem<T> | null> {
    await this.loadAllItems();
    return (this.items.get(id) as CatalogueItem<T>) || null;
  }

  async getStandupScript(query: { day?: number; role?: RoleType; language?: LanguageType } = {}): Promise<StandupScript["content"] | null> {
    const items = await this.getItems({
      simulator: "workspace",
      type: "standup_script",
      ...query
    });
    return items[0]?.content as StandupScript["content"] || null;
  }

  async getDevSetupSteps(query: { day?: number; role?: RoleType; language?: LanguageType } = {}): Promise<DevSetupSteps["content"] | null> {
    const items = await this.getItems({
      simulator: "workspace",
      type: "dev_setup_steps",
      ...query
    });
    return items[0]?.content as DevSetupSteps["content"] || null;
  }

  async getGitWorkflowSteps(query: { day?: number; role?: RoleType; language?: LanguageType } = {}): Promise<GitWorkflowSteps["content"] | null> {
    const items = await this.getItems({
      simulator: "workspace",
      type: "git_workflow_steps",
      ...query
    });
    return items[0]?.content as GitWorkflowSteps["content"] || null;
  }

  async getCodebaseStructure(query: { day?: number; role?: RoleType; language?: LanguageType } = {}): Promise<CodebaseStructure["content"] | null> {
    const items = await this.getItems({
      simulator: "workspace",
      type: "codebase_structure",
      ...query
    });
    return items[0]?.content as CodebaseStructure["content"] || null;
  }

  async getCodeExercise(query: { day?: number; role?: RoleType; language?: LanguageType } = {}): Promise<CodeExercise["content"] | null> {
    const items = await this.getItems({
      simulator: "workspace",
      type: "code_exercise",
      ...query
    });
    return items[0]?.content as CodeExercise["content"] || null;
  }

  async getBranchCreation(query: { day?: number; role?: RoleType; language?: LanguageType } = {}): Promise<BranchCreation["content"] | null> {
    const items = await this.getItems({
      simulator: "workspace",
      type: "branch_creation",
      ...query
    });
    return items[0]?.content as BranchCreation["content"] || null;
  }

  async getInterviewConfig(): Promise<InterviewConfig["content"] | null> {
    const items = await this.getItems({
      simulator: "interview",
      type: "interview_configuration"
    });
    return items[0]?.content as InterviewConfig["content"] || null;
  }
}

export const catalogue = new CatalogueService();

export async function getCatalogueItems(query: CatalogueQuery = {}): Promise<CatalogueItem[]> {
  return catalogue.getItems(query);
}

export async function getCatalogueItem<T>(id: string): Promise<CatalogueItem<T> | null> {
  return catalogue.getItem<T>(id);
}
