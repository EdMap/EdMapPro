import { useState, useCallback, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import {
  Play,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  TestTube,
  Loader2,
  Code2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeExecutionAdapter, ExecutionResponse, TestCase } from "@shared/adapters/code-execution/types";

interface CodeEditorPanelProps {
  adapter: CodeExecutionAdapter;
  ticketId: string;
  onSubmit?: (files: Record<string, string>, result: ExecutionResponse) => void;
}

export function CodeEditorPanel({ adapter, ticketId, onSubmit }: CodeEditorPanelProps) {
  const [files, setFiles] = useState<Record<string, string>>(adapter.files.starterFiles);
  const [activeFile, setActiveFile] = useState<string>(Object.keys(adapter.files.starterFiles)[0] || '');
  const [lastResult, setLastResult] = useState<ExecutionResponse | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
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
  
  return (
    <div className="flex flex-col h-full bg-background" data-testid="code-editor-panel">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4" />
          <span className="font-medium text-sm">Code Editor</span>
          <Badge variant="outline" className="text-xs">
            {adapter.editor.language.toUpperCase()}
          </Badge>
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
              data-testid="button-hint"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Hint
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
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          {fileNames.length > 1 && (
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
        
        {(adapter.ui.showTestPanel || adapter.ui.showOutputPanel) && (
          <div className="w-80 border-l flex flex-col">
            <Tabs defaultValue="tests" className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b">
                {adapter.ui.showTestPanel && (
                  <TabsTrigger value="tests" className="text-xs">
                    <TestTube className="w-3 h-3 mr-1" />
                    Tests
                    {lastResult && (
                      <Badge 
                        variant={lastResult.overallPass ? "default" : "destructive"} 
                        className="ml-2 text-xs"
                      >
                        {passedTests}/{totalTests}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
                {adapter.ui.showOutputPanel && (
                  <TabsTrigger value="output" className="text-xs">
                    Output
                  </TabsTrigger>
                )}
              </TabsList>
              
              {adapter.ui.showTestPanel && (
                <TabsContent value="tests" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-3">
                      <TestCasesList
                        testCases={adapter.testCases}
                        results={lastResult?.testResults}
                        scaffolding={adapter.scaffolding}
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>
              )}
              
              {adapter.ui.showOutputPanel && (
                <TabsContent value="output" className="flex-1 m-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-3">
                      <OutputPanel result={lastResult} scaffolding={adapter.scaffolding} />
                    </div>
                  </ScrollArea>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </div>
      
      {adapter.ui.showHintPanel && showHint && adapter.hints.length > 0 && (
        <div className="border-t p-3 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Hint</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {adapter.hints[Math.min(hintsUsed - 1, adapter.hints.length - 1)]}
              </p>
            </div>
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
      <div className="text-center py-6 text-muted-foreground">
        <TestTube className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No test cases defined</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {testCases.map(testCase => {
        const result = results?.find(r => r.testId === testCase.id);
        const showDetails = scaffolding.testVisibility === 'all' || 
          (scaffolding.testVisibility === 'names' && !testCase.hidden);
        
        return (
          <Card key={testCase.id} className={cn(
            "border",
            result?.passed === true && "border-green-500 bg-green-50 dark:bg-green-950/20",
            result?.passed === false && "border-red-500 bg-red-50 dark:bg-red-950/20",
          )}>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                {result ? (
                  result.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  )
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 mt-0.5" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{testCase.name}</p>
                  
                  {showDetails && testCase.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {testCase.description}
                    </p>
                  )}
                  
                  {result && !result.passed && scaffolding.feedbackDetail !== 'minimal' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      {result.explanation}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
      <div className="text-center py-6 text-muted-foreground">
        <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Run tests to see output</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className={cn(
        "p-3 rounded-lg",
        result.overallPass 
          ? "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100"
          : "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100"
      )}>
        <div className="flex items-center gap-2">
          {result.overallPass ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="font-medium">
            {result.overallPass ? 'All tests passed!' : 'Some tests failed'}
          </span>
        </div>
      </div>
      
      {result.feedback && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-1">Summary</p>
            <p className="text-sm text-muted-foreground">{result.feedback.summary}</p>
          </div>
          
          {result.feedback.improvements.length > 0 && scaffolding.feedbackDetail !== 'minimal' && (
            <div>
              <p className="text-sm font-medium mb-1">Improvements</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                {result.feedback.improvements.map((imp, i) => (
                  <li key={i}>{imp}</li>
                ))}
              </ul>
            </div>
          )}
          
          {result.feedback.mentorComment && scaffolding.showMentorTips && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Mentor Tip
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {result.feedback.mentorComment}
              </p>
            </div>
          )}
        </div>
      )}
      
      {scaffolding.showExecutionTrace && result.executionTrace && (
        <div>
          <p className="text-sm font-medium mb-1">Execution Trace</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {result.executionTrace}
          </pre>
        </div>
      )}
      
      {result.staticAnalysis.errors.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-1 text-red-600">Static Analysis Errors</p>
          <div className="space-y-1">
            {result.staticAnalysis.errors.map((error, i) => (
              <div key={i} className="text-xs bg-red-50 dark:bg-red-950/30 p-2 rounded">
                <span className="font-mono">{error.file}:{error.line}</span>
                <span className="mx-2">-</span>
                {error.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
