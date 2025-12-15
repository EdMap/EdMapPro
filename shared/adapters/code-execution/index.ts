/**
 * Code Execution Adapter Factory
 * 
 * Composes role configuration + level overlay to create a complete
 * code execution adapter. Supports provider selection for future
 * extensibility (LLM simulation → real execution).
 */

import type { Role, Level } from '../index';
import type {
  CodeExecutionAdapter,
  RoleCodeExecutionConfig,
  LevelCodeExecutionOverlay,
  ExecutionProviderType,
  EditorConfig,
  ScaffoldingConfig,
  ExecutionSettings,
  EditorUIConfig,
  FileConfig,
  TestCase,
  CodeChallenge,
} from './types';

import { developerCodeExecutionConfig } from './roles/developer';
import { pmCodeExecutionConfig } from './roles/pm';
import { internCodeExecutionOverlay } from './levels/intern';
import { juniorCodeExecutionOverlay } from './levels/junior';
import { midCodeExecutionOverlay } from './levels/mid';
import { seniorCodeExecutionOverlay } from './levels/senior';

const roleConfigs: Record<Role, RoleCodeExecutionConfig> = {
  developer: developerCodeExecutionConfig,
  pm: pmCodeExecutionConfig,
  qa: developerCodeExecutionConfig,
  devops: developerCodeExecutionConfig,
  data_science: developerCodeExecutionConfig,
};

const levelOverlays: Record<Level, LevelCodeExecutionOverlay> = {
  intern: internCodeExecutionOverlay,
  junior: juniorCodeExecutionOverlay,
  mid: midCodeExecutionOverlay,
  senior: seniorCodeExecutionOverlay,
};

function mergeEditorConfig(
  roleConfig: RoleCodeExecutionConfig['editor'],
  levelOverrides: Partial<EditorConfig> = {}
): EditorConfig {
  return {
    enabled: roleConfig.enabled,
    language: roleConfig.language,
    theme: roleConfig.theme,
    fontSize: levelOverrides.fontSize ?? roleConfig.fontSize,
    minimap: levelOverrides.minimap ?? roleConfig.minimap,
    lineNumbers: levelOverrides.lineNumbers ?? roleConfig.lineNumbers,
    wordWrap: levelOverrides.wordWrap ?? roleConfig.wordWrap,
    tabSize: roleConfig.tabSize,
    readOnly: roleConfig.baseReadOnly,
  };
}

function mergeExecutionSettings(
  roleConfig: ExecutionSettings,
  levelOverrides: Partial<ExecutionSettings> = {}
): ExecutionSettings {
  return {
    ...roleConfig,
    ...levelOverrides,
  };
}

function mergeUIConfig(
  roleConfig: Partial<EditorUIConfig>,
  levelOverrides: Partial<EditorUIConfig> = {}
): EditorUIConfig {
  const defaults: EditorUIConfig = {
    layoutMode: 'side-by-side',
    defaultEditorMode: 'full',
    showFileTree: true,
    showTestPanel: true,
    showOutputPanel: true,
    showHintPanel: true,
    panelSizes: { editor: 60, tests: 20, output: 20 },
    showToolbar: true,
    toolbarActions: [],
    bottomDock: {
      enabled: true,
      enabledTabs: ['terminal', 'tests', 'chat', 'tips'],
      defaultTab: 'terminal',
      defaultExpanded: true,
      collapsedHeight: 40,
      expandedHeight: 250,
    },
  };
  
  return {
    ...defaults,
    ...roleConfig,
    ...levelOverrides,
    panelSizes: {
      ...defaults.panelSizes,
      ...roleConfig.panelSizes,
      ...levelOverrides.panelSizes,
    },
    bottomDock: {
      ...defaults.bottomDock,
      ...roleConfig.bottomDock,
      ...levelOverrides.bottomDock,
    },
  };
}

export interface GetCodeExecutionAdapterOptions {
  role: Role;
  level: Level;
  codeChallenge?: CodeChallenge;
  providerType?: ExecutionProviderType;
}

export function getCodeExecutionAdapter(
  options: GetCodeExecutionAdapterOptions
): CodeExecutionAdapter {
  const { role, level, codeChallenge, providerType } = options;
  
  const roleConfig = roleConfigs[role] ?? roleConfigs.developer;
  const levelOverlay = levelOverlays[level] ?? levelOverlays.intern;
  
  const selectedProvider = providerType ?? roleConfig.providerPreference[0] ?? 'llm-simulation';
  
  const editor = mergeEditorConfig(roleConfig.editor, levelOverlay.editorOverrides);
  const execution = mergeExecutionSettings(roleConfig.execution, levelOverlay.executionOverrides);
  const ui = mergeUIConfig(roleConfig.ui, levelOverlay.uiOverrides);
  const scaffolding = levelOverlay.scaffolding;
  
  let files: FileConfig = {
    readOnlyFiles: [],
    hiddenFiles: [],
    starterFiles: {},
  };
  
  let testCases: TestCase[] = [];
  let hints: string[] = [];
  let acceptanceCriteria: string[] = [];
  
  if (codeChallenge) {
    files = {
      readOnlyFiles: [],
      hiddenFiles: [],
      starterFiles: applyStarterCodeTransform(
        codeChallenge.starterFiles,
        levelOverlay.starterCodeTransform
      ),
      solutionFiles: codeChallenge.solutionFiles,
    };
    
    testCases = levelOverlay.testCaseFilter
      ? levelOverlay.testCaseFilter(codeChallenge.testCases)
      : codeChallenge.testCases;
    
    hints = codeChallenge.hints;
    acceptanceCriteria = codeChallenge.acceptanceCriteria;
    
    if (codeChallenge.language) {
      editor.language = codeChallenge.language;
    }
  }
  
  return {
    metadata: {
      role,
      level,
      displayName: `${roleConfig.displayName} (${levelOverlay.displayName})`,
      description: roleConfig.description,
      providerType: selectedProvider,
    },
    editor,
    files,
    scaffolding,
    execution,
    ui,
    testCases,
    hints,
    acceptanceCriteria,
  };
}

function applyStarterCodeTransform(
  starterFiles: Record<string, string>,
  transform?: (code: string) => string
): Record<string, string> {
  if (!transform) return starterFiles;
  
  const transformed: Record<string, string> = {};
  for (const [filename, content] of Object.entries(starterFiles)) {
    transformed[filename] = transform(content);
  }
  return transformed;
}

/**
 * Create a fallback code challenge from ticket data when no backlog item exists
 * This allows the code editor to work for dynamically generated tickets
 */
export function createFallbackCodeChallenge(
  ticket: {
    title: string;
    description: string;
    type: string;
    ticketKey: string;
    acceptanceCriteria?: string[];
  },
  level: Level = 'intern'
): CodeChallenge {
  const isBug = ticket.type === 'bug';
  const fileName = isBug ? 'src/fix.ts' : 'src/feature.ts';
  
  const starterCode = isBug
    ? `// ${ticket.title}
// 
// Description: ${ticket.description}
//
// Your task: Fix the bug described above
// Hint: Read the description carefully and identify the issue

export function solve() {
  // TODO: Implement your fix here
  throw new Error('Not implemented');
}
`
    : `// ${ticket.title}
//
// Description: ${ticket.description}
//
// Your task: Implement the feature described above

export function implement() {
  // TODO: Implement the feature here
  throw new Error('Not implemented');
}
`;

  const solutionCode = starterCode.replace(
    "throw new Error('Not implemented');",
    "// Solution implemented\n  return true;"
  );

  const testCases: TestCase[] = [
    {
      id: 'test-1',
      name: `${ticket.title} - basic functionality`,
      description: `Verify the implementation works correctly`,
      assertions: ['Implementation should not throw errors', 'Function should return expected result'],
      hidden: false,
    },
  ];

  if (ticket.acceptanceCriteria) {
    ticket.acceptanceCriteria.forEach((criteria, index) => {
      testCases.push({
        id: `test-ac-${index + 1}`,
        name: criteria,
        description: criteria,
        assertions: [criteria],
        hidden: false,
      });
    });
  }

  return {
    language: 'typescript',
    starterFiles: { [fileName]: starterCode },
    solutionFiles: { [fileName]: solutionCode },
    testCases,
    hints: [
      `Read the ticket description carefully`,
      `Consider edge cases in your implementation`,
      level === 'intern' ? `Don't hesitate to ask for help in the team chat` : undefined,
    ].filter(Boolean) as string[],
    acceptanceCriteria: ticket.acceptanceCriteria || [],
    difficulty: level === 'senior' ? 'advanced' : level === 'intern' ? 'beginner' : 'intermediate',
    estimatedMinutes: 15,
    concepts: [],
  };
}

export function createCodeChallengeFromBacklog(
  backlogCodeWork: {
    files: Array<{
      filename: string;
      language: string;
      buggyCode: string;
      fixedCode: string;
      highlightLines?: number[];
      explanation?: string;
    }>;
    testCommand?: string;
    testOutput?: {
      passing: string;
      failing: string;
    };
  },
  acceptanceCriteria: string[] = []
): CodeChallenge {
  const starterFiles: Record<string, string> = {};
  const solutionFiles: Record<string, string> = {};
  
  for (const file of backlogCodeWork.files) {
    starterFiles[file.filename] = file.buggyCode;
    solutionFiles[file.filename] = file.fixedCode;
  }
  
  const testCases: TestCase[] = [];
  if (backlogCodeWork.testOutput?.passing) {
    const passingLines = backlogCodeWork.testOutput.passing.split('\n');
    passingLines.forEach((line, index) => {
      const match = line.match(/[✓✔]\s*(.+)/);
      if (match) {
        testCases.push({
          id: `test-${index + 1}`,
          name: match[1].trim(),
          description: match[1].trim(),
          assertions: [match[1].trim()],
          hidden: false,
        });
      }
    });
  }
  
  const language = backlogCodeWork.files[0]?.language as 'typescript' | 'javascript' | 'python' | 'cpp' ?? 'typescript';
  
  return {
    language,
    starterFiles,
    solutionFiles,
    testCases,
    hints: backlogCodeWork.files.map(f => f.explanation).filter(Boolean) as string[],
    acceptanceCriteria,
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    concepts: [],
  };
}

export { developerCodeExecutionConfig, pmCodeExecutionConfig };
export { internCodeExecutionOverlay, juniorCodeExecutionOverlay, midCodeExecutionOverlay, seniorCodeExecutionOverlay };
export type * from './types';
