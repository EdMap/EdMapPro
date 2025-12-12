import { useState, useCallback, useMemo, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  Play,
  RotateCcw,
  Lightbulb,
  FileCode,
  Loader2,
  Code2,
  Send,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomDock, type DockTab, type ReviewThread } from "./bottom-dock";
import type { CodeExecutionAdapter, ExecutionResponse } from "@shared/adapters/code-execution/types";

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  content: string;
  timestamp?: Date;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderRole?: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

interface CodeEditorPanelProps {
  adapter: CodeExecutionAdapter;
  ticketId: string;
  onSubmit?: (files: Record<string, string>, result: ExecutionResponse) => void;
  terminalLines?: TerminalLine[];
  onTerminalCommand?: (command: string) => void;
  chatMessages?: ChatMessage[];
  onSendChat?: (message: string) => void;
  unreadChatCount?: number;
  onFilesChange?: (files: Record<string, string>) => void;
  onTestResult?: (result: ExecutionResponse) => void;
  externalRunTests?: boolean;
  onExternalRunTestsComplete?: () => void;
  hideSubmitButton?: boolean;
  reviewThreads?: ReviewThread[];
  onGoToLine?: (filename: string, lineNumber: number) => void;
}

export function CodeEditorPanel({ 
  adapter, 
  ticketId, 
  onSubmit,
  terminalLines = [],
  onTerminalCommand,
  chatMessages = [],
  onSendChat,
  unreadChatCount = 0,
  onFilesChange,
  onTestResult,
  externalRunTests = false,
  onExternalRunTestsComplete,
  hideSubmitButton = false,
  reviewThreads = [],
  onGoToLine,
}: CodeEditorPanelProps) {
  const storageKey = `edmap-code-${ticketId}`;
  
  const [files, setFiles] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return { ...adapter.files.starterFiles, ...parsed };
        }
      }
    } catch (e) {
      console.error('Failed to load saved code:', e);
    }
    return adapter.files.starterFiles;
  });
  const [activeFile, setActiveFile] = useState<string>(Object.keys(adapter.files.starterFiles)[0] || '');
  const [lastResult, setLastResult] = useState<ExecutionResponse | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [visibleHints, setVisibleHints] = useState<string[]>([]);
  
  const fileNames = useMemo(() => Object.keys(files), [files]);
  
  const analyzeCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/analyze-code', {
        ticketId,
        files,
        testCases: adapter.testCases,
        language: adapter.editor.language,
        userLevel: adapter.metadata.level,
        userRole: adapter.metadata.role,
      });
      return response.json() as Promise<ExecutionResponse>;
    },
    onSuccess: (result) => {
      setLastResult(result);
      onTestResult?.(result);
    },
  });

  useEffect(() => {
    if (externalRunTests && !analyzeCodeMutation.isPending) {
      analyzeCodeMutation.mutate(undefined, {
        onSettled: () => {
          onExternalRunTestsComplete?.();
        }
      });
    }
  }, [externalRunTests]);
  
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined && activeFile) {
      setFiles(prev => {
        const newFiles = { ...prev, [activeFile]: value };
        onFilesChange?.(newFiles);
        try {
          localStorage.setItem(storageKey, JSON.stringify(newFiles));
        } catch (e) {
          console.error('Failed to save code:', e);
        }
        return newFiles;
      });
    }
  }, [activeFile, onFilesChange, storageKey]);
  
  const handleRunTests = useCallback(() => {
    analyzeCodeMutation.mutate();
  }, [analyzeCodeMutation]);
  
  const handleReset = useCallback(() => {
    const starterFiles = adapter.files.starterFiles;
    setFiles(starterFiles);
    setLastResult(null);
    onFilesChange?.(starterFiles);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error('Failed to clear saved code:', e);
    }
  }, [adapter.files.starterFiles, storageKey, onFilesChange]);
  
  const handleRequestHint = useCallback(() => {
    if (adapter.scaffolding.hintLevel === 'never') return;
    if (hintsUsed < adapter.hints.length) {
      setVisibleHints(prev => [...prev, adapter.hints[hintsUsed]]);
      setHintsUsed(prev => prev + 1);
    }
  }, [adapter.scaffolding.hintLevel, adapter.hints, hintsUsed]);
  
  const handleSubmit = useCallback(() => {
    if (lastResult && onSubmit) {
      onSubmit(files, lastResult);
    }
  }, [files, lastResult, onSubmit]);
  
  const getLanguageForMonaco = (language: string): string => {
    const langMap: Record<string, string> = {
      typescript: 'typescript',
      javascript: 'javascript',
      python: 'python',
      cpp: 'cpp',
    };
    return langMap[language] || 'typescript';
  };
  
  const passedTests = lastResult?.testResults.filter(t => t.passed).length || 0;
  const totalTests = lastResult?.testResults.length || adapter.testCases.length;
  
  // Dynamically add 'review' tab when there are review threads
  const bottomDockConfig = useMemo(() => {
    const baseConfig = adapter.ui.bottomDock;
    if (reviewThreads.length > 0 && !baseConfig.enabledTabs.includes('review' as DockTab)) {
      return {
        ...baseConfig,
        enabledTabs: [...baseConfig.enabledTabs, 'review' as DockTab],
      };
    }
    return baseConfig;
  }, [adapter.ui.bottomDock, reviewThreads.length]);
  
  return (
    <div className="flex flex-col h-full bg-background" data-testid="code-editor-panel">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4" />
          <span className="font-medium text-sm">Code Editor</span>
          <Badge variant="outline" className="text-xs">
            {adapter.editor.language.toUpperCase()}
          </Badge>
          {lastResult && (
            <Badge 
              variant={lastResult.overallPass ? "default" : "destructive"} 
              className="text-xs"
            >
              {passedTests}/{totalTests} tests
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {adapter.ui.toolbarActions.includes('run') && (
            <Button
              size="sm"
              onClick={handleRunTests}
              disabled={analyzeCodeMutation.isPending}
              data-testid="button-run-tests"
            >
              {analyzeCodeMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              Run Tests
            </Button>
          )}
          
          {adapter.ui.toolbarActions.includes('hint') && adapter.scaffolding.hintLevel !== 'never' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRequestHint}
              disabled={hintsUsed >= adapter.hints.length}
              data-testid="button-hint"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Hint ({adapter.hints.length - hintsUsed})
            </Button>
          )}
          
          {adapter.ui.toolbarActions.includes('reset') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
          
          {adapter.ui.toolbarActions.includes('submit') && lastResult?.overallPass && !hideSubmitButton && (
            <Button
              size="sm"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              data-testid="button-submit"
            >
              <Send className="w-4 h-4 mr-1" />
              Submit
            </Button>
          )}
          
          {hideSubmitButton && lastResult?.overallPass && (
            <Badge variant="default" className="bg-green-600 text-white px-3 py-1">
              <Check className="w-3 h-3 mr-1" />
              Tests passing — ready for git workflow
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          {fileNames.length > 1 && (
            <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/20 overflow-x-auto shrink-0">
              {fileNames.map(fileName => (
                <Button
                  key={fileName}
                  size="sm"
                  variant={activeFile === fileName ? "secondary" : "ghost"}
                  className="text-xs h-7"
                  onClick={() => setActiveFile(fileName)}
                  data-testid={`tab-file-${fileName}`}
                >
                  <FileCode className="w-3 h-3 mr-1" />
                  {fileName.split('/').pop()}
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={getLanguageForMonaco(adapter.editor.language)}
              theme={adapter.editor.theme}
              value={files[activeFile] || ''}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: adapter.editor.minimap },
                fontSize: adapter.editor.fontSize,
                lineNumbers: adapter.editor.lineNumbers ? 'on' : 'off',
                wordWrap: adapter.editor.wordWrap,
                tabSize: adapter.editor.tabSize,
                readOnly: adapter.editor.readOnly,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
        
        {bottomDockConfig.enabled && (
          <BottomDock
            config={bottomDockConfig}
            terminalLines={terminalLines}
            onTerminalCommand={onTerminalCommand}
            testCases={adapter.testCases}
            testResults={lastResult?.testResults}
            scaffolding={adapter.scaffolding}
            chatMessages={chatMessages}
            onSendChat={onSendChat}
            unreadChatCount={unreadChatCount}
            tips={visibleHints}
            mentorFeedback={lastResult?.feedback?.mentorComment}
            isRunningTests={analyzeCodeMutation.isPending}
            reviewThreads={reviewThreads}
            onGoToLine={onGoToLine}
          />
        )}
      </div>
    </div>
  );
}
