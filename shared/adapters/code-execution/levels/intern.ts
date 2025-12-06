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
    layoutMode: 'side-by-side',
    showHintPanel: true,
    toolbarActions: ['run', 'hint', 'submit'],
    panelSizes: {
      editor: 65,
      tests: 20,
      output: 15,
    },
    layout: {
      sidebarPosition: 'right',
      sidebarDefaultWidth: 300,
      sidebarMinWidth: 240,
      sidebarMaxWidth: 400,
      sidebarCollapsible: true,
      sidebarDefaultCollapsed: false,
      fileNavigator: 'tabs',
      toolbarStyle: 'full',
      primaryActions: ['run', 'submit'],
      secondaryActions: ['hint'],
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
    return testCases;
  },
};
