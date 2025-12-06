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
    showHintPanel: false,
    showFileTree: true,
    toolbarActions: ['run', 'format', 'submit'],
    panelSizes: {
      editor: 80,
      tests: 10,
      output: 10,
    },
    layout: {
      sidebarPosition: 'right',
      sidebarDefaultWidth: 240,
      sidebarMinWidth: 180,
      sidebarMaxWidth: 320,
      sidebarCollapsible: true,
      sidebarDefaultCollapsed: true,
      fileNavigator: 'vertical',
      toolbarStyle: 'icon-only',
      primaryActions: ['run', 'submit'],
      secondaryActions: ['format'],
      showStatusBar: false,
      responsiveBreakpoints: {
        collapseSidebar: 900,
        compactToolbar: 768,
        zenMode: 640,
      },
      zenModeConfig: {
        hideMinimap: false,
        increaseFontSize: 0,
        hideLineNumbers: false,
      },
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
