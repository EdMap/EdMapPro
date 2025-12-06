/**
 * Senior Level - Code Execution Overlay
 * 
 * No scaffolding: Empty project, write your own tests,
 * no hints, minimal feedback, professional experience.
 */

import type { LevelCodeExecutionOverlay, TestCase } from '../types';

export const seniorCodeExecutionOverlay: LevelCodeExecutionOverlay = {
  level: 'senior',
  displayName: 'Senior',
  
  scaffolding: {
    starterCodeAmount: 'empty',
    testVisibility: 'hidden',
    showInlineHints: false,
    hintLevel: 'never',
    autoSuggestFixes: false,
    allowRunWithErrors: false,
    feedbackDetail: 'minimal',
    showExecutionTrace: false,
    showMentorTips: false,
  },
  
  editorOverrides: {
    fontSize: 13,
    minimap: true,
    wordWrap: 'off',
  },
  
  executionOverrides: {
    autoRunOnSave: false,
    debounceMs: 200,
    maxExecutionsPerMinute: 5,
  },
  
  uiOverrides: {
    layoutMode: 'focus-editor',
    defaultEditorMode: 'full',
    showHintPanel: false,
    showFileTree: true,
    toolbarActions: ['format', 'reset'],
    panelSizes: {
      editor: 70,
      tests: 15,
      output: 15,
    },
  },
  
  starterCodeTransform: (_code: string) => {
    return `// Implement the solution based on the ticket requirements\n`;
  },
  
  testCaseFilter: (testCases: TestCase[]) => {
    return testCases.filter(tc => !tc.hidden).map(tc => ({
      ...tc,
      hidden: true,
      description: tc.name,
      assertions: [],
      expectedOutput: undefined,
    }));
  },
};
