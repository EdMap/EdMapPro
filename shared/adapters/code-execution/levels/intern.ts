/**
 * Intern Level - Code Execution Overlay
 * 
 * Maximum scaffolding: 80% complete starter code, all tests visible,
 * always-on hints, auto-suggested fixes, verbose feedback.
 */

import type { LevelCodeExecutionOverlay, TestCase } from '../types';

export const internCodeExecutionOverlay: LevelCodeExecutionOverlay = {
  level: 'intern',
  displayName: 'Intern',
  
  scaffolding: {
    starterCodeAmount: 'full',
    testVisibility: 'all',
    showInlineHints: true,
    hintLevel: 'always',
    autoSuggestFixes: true,
    allowRunWithErrors: true,
    feedbackDetail: 'verbose',
    showExecutionTrace: true,
    showMentorTips: true,
  },
  
  editorOverrides: {
    fontSize: 15,
    minimap: false,
    wordWrap: 'on',
  },
  
  executionOverrides: {
    autoRunOnSave: true,
    debounceMs: 1000,
    maxExecutionsPerMinute: 20,
  },
  
  uiOverrides: {
    layoutMode: 'stacked',
    defaultEditorMode: 'full',
    showHintPanel: true,
    toolbarActions: ['run', 'hint', 'submit'],
    panelSizes: {
      editor: 50,
      tests: 25,
      output: 25,
    },
  },
  
  starterCodeTransform: (code: string) => {
    return code;
  },
  
  testCaseFilter: (testCases: TestCase[]) => {
    return testCases;
  },
};
