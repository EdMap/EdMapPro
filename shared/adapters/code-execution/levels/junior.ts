/**
 * Junior Level - Code Execution Overlay
 * 
 * Moderate scaffolding: Function stubs, test names visible,
 * hints on error, suggested fixes on request.
 */

import type { LevelCodeExecutionOverlay, TestCase } from '../types';

export const juniorCodeExecutionOverlay: LevelCodeExecutionOverlay = {
  level: 'junior',
  displayName: 'Junior',
  
  scaffolding: {
    starterCodeAmount: 'partial',
    testVisibility: 'names',
    showInlineHints: true,
    hintLevel: 'on-error',
    autoSuggestFixes: false,
    allowRunWithErrors: true,
    feedbackDetail: 'standard',
    showExecutionTrace: true,
    showMentorTips: true,
  },
  
  editorOverrides: {
    fontSize: 14,
    minimap: false,
  },
  
  executionOverrides: {
    autoRunOnSave: false,
    debounceMs: 500,
    maxExecutionsPerMinute: 15,
  },
  
  uiOverrides: {
    layoutMode: 'side-by-side',
    showHintPanel: true,
    toolbarActions: ['run', 'format', 'hint', 'submit'],
  },
  
  starterCodeTransform: (code: string) => {
    return code;
  },
  
  testCaseFilter: (testCases: TestCase[]) => {
    return testCases.map(tc => ({
      ...tc,
      description: tc.hidden ? '' : tc.description,
      assertions: tc.hidden ? [] : tc.assertions,
    }));
  },
};
