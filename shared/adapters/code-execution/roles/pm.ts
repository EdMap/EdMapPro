/**
 * PM Role - Code Execution Configuration
 * 
 * Read-only code review experience focused on understanding rather than writing.
 * PMs review code changes and provide feedback from a product perspective.
 */

import type { RoleCodeExecutionConfig } from '../types';

export const pmCodeExecutionConfig: RoleCodeExecutionConfig = {
  role: 'pm',
  displayName: 'Product Manager',
  description: 'Code review experience focused on understanding changes and impact',
  
  editor: {
    enabled: true,
    language: 'typescript',
    theme: 'vs-dark',
    fontSize: 14,
    minimap: false,
    lineNumbers: true,
    wordWrap: 'on',
    tabSize: 2,
    baseReadOnly: true,
  },
  
  execution: {
    autoRunOnSave: false,
    debounceMs: 1000,
    maxExecutionsPerMinute: 5,
    timeoutMs: 30000,
    showStaticAnalysis: false,
    showTestResults: true,
  },
  
  ui: {
    layoutMode: 'stacked',
    layout: {
      sidebarPosition: 'right',
      sidebarDefaultWidth: 280,
      sidebarMinWidth: 200,
      sidebarMaxWidth: 400,
      sidebarCollapsible: true,
      sidebarDefaultCollapsed: false,
      fileNavigator: 'tabs',
      toolbarStyle: 'compact',
      primaryActions: ['run'],
      secondaryActions: [],
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
    showFileTree: false,
    showTestPanel: true,
    showOutputPanel: true,
    showHintPanel: false,
    showToolbar: true,
    toolbarActions: ['run'],
    panelSizes: {
      editor: 60,
      tests: 20,
      output: 20,
    },
  },
  
  providerPreference: ['llm-simulation'],
};
