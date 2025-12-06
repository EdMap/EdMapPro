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
    panelSizes: {
      editor: 70,
      tests: 15,
      output: 15,
    },
    layout: {
      sidebarPosition: 'right',
      sidebarDefaultWidth: 280,
      sidebarMinWidth: 220,
      sidebarMaxWidth: 400,
      sidebarCollapsible: true,
      sidebarDefaultCollapsed: false,
      fileNavigator: 'vertical',
      toolbarStyle: 'full',
      primaryActions: ['run', 'submit'],
      secondaryActions: ['hint', 'format'],
      showStatusBar: true,
      responsiveBreakpoints: {
        collapseSidebar: 1024,
        compactToolbar: 768,
        zenMode: 640,
      },
      zenModeConfig: {
        hideMinimap: true,
        increaseFontSize: 2,
        hideLineNumbers: false,
      },
    },
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
