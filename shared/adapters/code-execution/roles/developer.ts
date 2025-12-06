/**
 * Developer Role - Code Execution Configuration
 * 
 * Full code editing and execution experience with all features enabled.
 */

import type { RoleCodeExecutionConfig } from '../types';

export const developerCodeExecutionConfig: RoleCodeExecutionConfig = {
  role: 'developer',
  displayName: 'Developer',
  description: 'Full code editing and execution experience with real-time feedback',
  
  editor: {
    enabled: true,
    language: 'typescript',
    theme: 'vs-dark',
    fontSize: 14,
    minimap: true,
    lineNumbers: true,
    wordWrap: 'off',
    tabSize: 2,
    baseReadOnly: false,
  },
  
  execution: {
    autoRunOnSave: false,
    debounceMs: 500,
    maxExecutionsPerMinute: 10,
    timeoutMs: 30000,
    showStaticAnalysis: true,
    showTestResults: true,
  },
  
  ui: {
    layoutMode: 'side-by-side',
    showFileTree: true,
    showTestPanel: true,
    showOutputPanel: true,
    showHintPanel: true,
    showToolbar: true,
    toolbarActions: ['run', 'format', 'reset', 'hint', 'submit'],
    panelSizes: {
      editor: 60,
      tests: 20,
      output: 20,
    },
  },
  
  providerPreference: ['llm-simulation', 'hybrid', 'real-execution'],
};
