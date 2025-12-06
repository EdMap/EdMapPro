import { useState, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomDock, type DockTab } from "./bottom-dock";
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
}: CodeEditorPanelProps) {
  const [files, setFiles] = useState<Record<string, string>>(adapter.files.starterFiles);
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
    },
  });
  
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined && activeFile) {
      setFiles(prev => ({ ...prev, [activeFile]: value }));
    }
  }, [activeFile]);
  
  const handleRunTests = useCallback(() => {
    analyzeCodeMutation.mutate();
  }, [analyzeCodeMutation]);
  
  const handleReset = useCallback(() => {
    setFiles(adapter.files.starterFiles);
    setLastResult(null);
  }, [adapter.files.starterFiles]);
  
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
  
  const bottomDockConfig = adapter.ui.bottomDock;
  
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
          
          {adapter.ui.toolbarActions.includes('submit') && lastResult?.overallPass && (
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
          />
        )}
      </div>
    </div>
  );
}
