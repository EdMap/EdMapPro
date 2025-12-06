import { useState, useCallback, useMemo, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import {
  Play,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  FileCode,
  TestTube,
  Loader2,
  Code2,
  Send,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  PanelRightClose,
  PanelRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeExecutionAdapter, ExecutionResponse, TestCase, EditorLayoutConfig } from "@shared/adapters/code-execution/types";

const defaultLayout: EditorLayoutConfig = {
  sidebarPosition: 'right',
  sidebarDefaultWidth: 300,
  sidebarMinWidth: 200,
  sidebarMaxWidth: 450,
  sidebarCollapsible: true,
  sidebarDefaultCollapsed: false,
  fileNavigator: 'tabs',
  toolbarStyle: 'full',
  primaryActions: ['run', 'submit'],
  secondaryActions: ['reset', 'hint', 'format'],
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
};

interface CodeEditorPanelProps {
  adapter: CodeExecutionAdapter;
  ticketId: string;
  onSubmit?: (files: Record<string, string>, result: ExecutionResponse) => void;
}

export function CodeEditorPanel({ adapter, ticketId, onSubmit }: CodeEditorPanelProps) {
  const layout = adapter.ui.layout ?? defaultLayout;
  
  const [files, setFiles] = useState<Record<string, string>>(adapter.files.starterFiles);
  const [activeFile, setActiveFile] = useState<string>(Object.keys(adapter.files.starterFiles)[0] || '');
  const [lastResult, setLastResult] = useState<ExecutionResponse | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(layout.sidebarDefaultCollapsed);
  const [testsExpanded, setTestsExpanded] = useState(true);
  const [outputExpanded, setOutputExpanded] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  const fileNames = useMemo(() => Object.keys(files), [files]);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isCompactMode = windowWidth < layout.responsiveBreakpoints.compactToolbar;
  const isZenMode = windowWidth < layout.responsiveBreakpoints.zenMode;
  const shouldAutoCollapseSidebar = windowWidth < layout.responsiveBreakpoints.collapseSidebar;
  
  useEffect(() => {
    if (shouldAutoCollapseSidebar && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [shouldAutoCollapseSidebar]);
  
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
    setShowHint(true);
    setHintsUsed(prev => prev + 1);
  }, [adapter.scaffolding.hintLevel]);
  
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
  
  const editorFontSize = isZenMode
    ? adapter.editor.fontSize + layout.zenModeConfig.increaseFontSize
    : adapter.editor.fontSize;
  
  const showMinimap = isZenMode && layout.zenModeConfig.hideMinimap
    ? false
    : adapter.editor.minimap;
  
  const toolbarStyle = layout.toolbarStyle;
  const primaryActions = layout.primaryActions;
  const secondaryActions = layout.secondaryActions;
  
  const hasSecondaryActions = secondaryActions.some(action => {
    if (action === 'hint') return adapter.scaffolding.hintLevel !== 'never';
    if (action === 'reset') return true;
    if (action === 'format') return true;
    return false;
  });
  
  return (
    <div className="flex flex-col h-full bg-background" data-testid="code-editor-panel">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm hidden sm:inline">Code Editor</span>
          <Badge variant="outline" className="text-xs">
            {adapter.editor.language.toUpperCase()}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1.5">
          {primaryActions.includes('run') && (
            <Button
              size="sm"
              onClick={handleRunTests}
              disabled={analyzeCodeMutation.isPending}
              className="h-8"
              data-testid="button-run-tests"
            >
              {analyzeCodeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {toolbarStyle !== 'icon-only' && <span className="ml-1.5">Run</span>}
            </Button>
          )}
          
          {primaryActions.includes('submit') && lastResult?.overallPass && (
            <Button
              size="sm"
              className="h-8 bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              data-testid="button-submit"
            >
              <Send className="w-4 h-4" />
              {toolbarStyle !== 'icon-only' && <span className="ml-1.5">Submit</span>}
            </Button>
          )}
          
          {hasSecondaryActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {secondaryActions.includes('hint') && adapter.scaffolding.hintLevel !== 'never' && (
                  <DropdownMenuItem onClick={handleRequestHint}>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Show Hint
                  </DropdownMenuItem>
                )}
                {secondaryActions.includes('reset') && (
                  <DropdownMenuItem onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Code
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {layout.sidebarCollapsible && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              data-testid="button-toggle-sidebar"
            >
              {sidebarCollapsed ? (
                <PanelRight className="w-4 h-4" />
              ) : (
                <PanelRightClose className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel
            defaultSize={sidebarCollapsed ? 100 : 70}
            minSize={50}
          >
            <div className="flex h-full">
              {layout.fileNavigator === 'vertical' && fileNames.length > 1 && (
                <div className="w-10 border-r bg-muted/20 flex flex-col items-center py-2 gap-1">
                  {fileNames.map(fileName => (
                    <Button
                      key={fileName}
                      size="sm"
                      variant={activeFile === fileName ? "secondary" : "ghost"}
                      className="w-8 h-8 p-0"
                      onClick={() => setActiveFile(fileName)}
                      title={fileName}
                      data-testid={`tab-file-${fileName}`}
                    >
                      <FileCode className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              )}
              
              <div className="flex-1 flex flex-col">
                {layout.fileNavigator === 'tabs' && fileNames.length > 1 && (
                  <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/20 overflow-x-auto">
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
                
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={getLanguageForMonaco(adapter.editor.language)}
                    theme={adapter.editor.theme}
                    value={files[activeFile] || ''}
                    onChange={handleEditorChange}
                    options={{
                      minimap: { enabled: showMinimap },
                      fontSize: editorFontSize,
                      lineNumbers: adapter.editor.lineNumbers ? 'on' : 'off',
                      wordWrap: adapter.editor.wordWrap,
                      tabSize: adapter.editor.tabSize,
                      readOnly: adapter.editor.readOnly,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 12 },
                    }}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>
          
          {!sidebarCollapsed && (adapter.ui.showTestPanel || adapter.ui.showOutputPanel) && (
            <>
              <ResizableHandle withHandle className="w-1.5 bg-border/50 hover:bg-primary/20 transition-colors" />
              <ResizablePanel
                defaultSize={30}
                minSize={20}
                maxSize={50}
              >
                <div className="h-full flex flex-col bg-muted/10">
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-2">
                      {adapter.ui.showTestPanel && (
                        <Collapsible open={testsExpanded} onOpenChange={setTestsExpanded}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between h-8 px-2"
                            >
                              <div className="flex items-center gap-2">
                                {testsExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <TestTube className="w-4 h-4" />
                                <span className="text-sm font-medium">Tests</span>
                              </div>
                              {lastResult && (
                                <Badge 
                                  variant={lastResult.overallPass ? "default" : "destructive"} 
                                  className="text-xs h-5"
                                >
                                  {passedTests}/{totalTests}
                                </Badge>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pt-2 space-y-1.5">
                              <TestCasesList
                                testCases={adapter.testCases}
                                results={lastResult?.testResults}
                                scaffolding={adapter.scaffolding}
                              />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      
                      {adapter.ui.showOutputPanel && (
                        <Collapsible open={outputExpanded} onOpenChange={setOutputExpanded}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between h-8 px-2"
                            >
                              <div className="flex items-center gap-2">
                                {outputExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium">Feedback</span>
                              </div>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pt-2">
                              <OutputPanel result={lastResult} scaffolding={adapter.scaffolding} />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
      
      {adapter.ui.showHintPanel && showHint && adapter.hints.length > 0 && (
        <div className="border-t p-3 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Hint</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {adapter.hints[Math.min(hintsUsed - 1, adapter.hints.length - 1)]}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={() => setShowHint(false)}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      {layout.showStatusBar && lastResult && (
        <div className="border-t px-3 py-1.5 bg-muted/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              Last run: {new Date(lastResult.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-muted-foreground">
              {lastResult.latencyMs}ms
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-1.5",
            lastResult.overallPass ? "text-green-600" : "text-red-600"
          )}>
            {lastResult.overallPass ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            <span>{passedTests}/{totalTests} tests passed</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface TestCasesListProps {
  testCases: TestCase[];
  results?: ExecutionResponse['testResults'];
  scaffolding: CodeExecutionAdapter['scaffolding'];
}

function TestCasesList({ testCases, results, scaffolding }: TestCasesListProps) {
  if (testCases.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <TestTube className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
        <p className="text-xs">No test cases</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {testCases.map(testCase => {
        const result = results?.find(r => r.testId === testCase.id);
        const showDetails = scaffolding.testVisibility === 'all' || 
          (scaffolding.testVisibility === 'names' && !testCase.hidden);
        
        return (
          <div
            key={testCase.id}
            className={cn(
              "rounded-md border p-2 text-sm",
              result?.passed === true && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
              result?.passed === false && "border-red-500/50 bg-red-50/50 dark:bg-red-950/20",
              !result && "border-border bg-background"
            )}
          >
            <div className="flex items-start gap-2">
              {result ? (
                result.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                )
              ) : (
                <div className="w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{testCase.name}</p>
                
                {showDetails && testCase.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {testCase.description}
                  </p>
                )}
                
                {result && !result.passed && scaffolding.feedbackDetail !== 'minimal' && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {result.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface OutputPanelProps {
  result: ExecutionResponse | null;
  scaffolding: CodeExecutionAdapter['scaffolding'];
}

function OutputPanel({ result, scaffolding }: OutputPanelProps) {
  if (!result) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Play className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
        <p className="text-xs">Run tests to see feedback</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className={cn(
        "p-2.5 rounded-md text-sm",
        result.overallPass 
          ? "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100"
          : "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100"
      )}>
        <div className="flex items-center gap-2">
          {result.overallPass ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="font-medium text-xs">
            {result.overallPass ? 'All tests passed!' : 'Some tests failed'}
          </span>
        </div>
      </div>
      
      {result.feedback && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{result.feedback.summary}</p>
          
          {result.feedback.improvements.length > 0 && scaffolding.feedbackDetail !== 'minimal' && (
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
              {result.feedback.improvements.slice(0, 3).map((imp, i) => (
                <li key={i} className="truncate">{imp}</li>
              ))}
            </ul>
          )}
          
          {result.feedback.mentorComment && scaffolding.showMentorTips && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-0.5">
                Mentor Tip
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                {result.feedback.mentorComment}
              </p>
            </div>
          )}
        </div>
      )}
      
      {result.staticAnalysis.errors.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1 text-red-600">Errors</p>
          <div className="space-y-1">
            {result.staticAnalysis.errors.slice(0, 3).map((error, i) => (
              <div key={i} className="text-xs bg-red-50 dark:bg-red-950/30 p-1.5 rounded">
                <span className="font-mono text-red-700 dark:text-red-300">
                  L{error.line}:
                </span>{' '}
                <span className="text-red-600 dark:text-red-400">{error.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
