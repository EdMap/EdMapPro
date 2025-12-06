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
    showHintPanel: false,
    toolbarActions: ['run', 'format', 'reset', 'submit'],
    panelSizes: {
      editor: 75,
      tests: 12,
      output: 13,
    },
    layout: {
      sidebarPosition: 'right',
      sidebarDefaultWidth: 260,
      sidebarMinWidth: 200,
      sidebarMaxWidth: 360,
      sidebarCollapsible: true,
      sidebarDefaultCollapsed: false,
      fileNavigator: 'vertical',
      toolbarStyle: 'compact',
      primaryActions: ['run', 'submit'],
      secondaryActions: ['reset', 'format'],
      showStatusBar: true,
      responsiveBreakpoints: {
        collapseSidebar: 960,
        compactToolbar: 768,
        zenMode: 640,
      },
      zenModeConfig: {
        hideMinimap: false,
        increaseFontSize: 1,
        hideLineNumbers: false,
      },
    },
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
