/**
 * Mid Level - Code Execution Overlay
 * 
 * Light scaffolding: File structure only, hidden tests,
 * hints on request, no auto-fixes.
 */

import type { LevelCodeExecutionOverlay, TestCase } from '../types';

export const midCodeExecutionOverlay: LevelCodeExecutionOverlay = {
  level: 'mid',
  displayName: 'Mid-Level',
  
  scaffolding: {
    starterCodeAmount: 'stubs',
    testVisibility: 'hidden',
    showInlineHints: false,
    hintLevel: 'on-request',
    autoSuggestFixes: false,
    allowRunWithErrors: false,
    feedbackDetail: 'standard',
    showExecutionTrace: false,
    showMentorTips: false,
  },
  
  editorOverrides: {
    fontSize: 14,
    minimap: true,
  },
  
  executionOverrides: {
    autoRunOnSave: false,
    debounceMs: 300,
    maxExecutionsPerMinute: 10,
  },
  
  uiOverrides: {
    layoutMode: 'side-by-side',
    defaultEditorMode: 'full',
    showHintPanel: false,
    toolbarActions: [],
  },
  
  starterCodeTransform: (code: string) => {
    const lines = code.split('\n');
    return lines.map(line => {
      if (line.includes('// Fix:') || line.includes('// TODO:')) {
        return line.replace(/\/\/\s*(Fix|TODO):.*/, '// Implement this');
      }
      return line;
    }).join('\n');
  },
  
  testCaseFilter: (testCases: TestCase[]) => {
    return testCases.map(tc => ({
      ...tc,
      hidden: true,
      description: '',
      assertions: [],
    }));
  },
};
