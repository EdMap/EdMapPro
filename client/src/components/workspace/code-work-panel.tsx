import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Circle,
  Code,
  FileCode,
  CheckCheck,
  ArrowRight,
  Lightbulb,
  Terminal,
  AlertTriangle,
  Diff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeWorkConfig, CodeSnippet, CodeWorkStep } from "@shared/adapters/execution/types";
import type { CodeWorkTemplate } from "@shared/adapters/planning/backlog-catalogue";

interface CodeWorkPanelProps {
  codeWorkConfig: CodeWorkConfig;
  codeWorkTemplate?: CodeWorkTemplate;
  ticketTitle: string;
  ticketType: string;
  onComplete: () => void;
  isComplete: boolean;
  isSaving?: boolean;
}

interface StepStatus {
  id: string;
  completed: boolean;
}

export function CodeWorkPanel({
  codeWorkConfig,
  codeWorkTemplate,
  ticketTitle,
  ticketType,
  onComplete,
  isComplete,
  isSaving = false,
}: CodeWorkPanelProps) {
  const [activeTab, setActiveTab] = useState<'buggy' | 'fixed' | 'diff'>('buggy');
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    codeWorkConfig.steps.filter(s => s.id !== 'test').map(step => ({ id: step.id, completed: false }))
  );
  const [showHints, setShowHints] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  const files = codeWorkTemplate?.files || [];
  const currentFile = files[activeFileIndex];
  
  const filteredSteps = codeWorkConfig.steps.filter(s => s.id !== 'test');
  const completedSteps = stepStatuses.filter(s => s.completed).length;
  const totalSteps = stepStatuses.length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const allStepsComplete = stepStatuses.every(s => s.completed) || filteredSteps.length === 0;
  const canComplete = allStepsComplete;

  const markStepComplete = useCallback((stepId: string) => {
    setStepStatuses(prev => 
      prev.map(s => s.id === stepId ? { ...s, completed: true } : s)
    );
  }, []);

  useEffect(() => {
    if (activeTab === 'fixed' && !stepStatuses.find(s => s.id === 'implement')?.completed) {
      markStepComplete('implement');
    }
  }, [activeTab, stepStatuses, markStepComplete]);

  if (!codeWorkConfig.enabled || codeWorkConfig.mode === 'skip' || !codeWorkTemplate || files.length === 0) {
    return null;
  }

  const renderCodeBlock = (code: string, language: string, highlightLines?: number[]) => {
    const lines = code.split('\n');
    
    return (
      <pre className="text-sm font-mono bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                "px-2 -mx-2",
                highlightLines?.includes(idx + 1) && "bg-yellow-500/20 border-l-2 border-yellow-400"
              )}
            >
              <span className="text-gray-500 select-none w-8 inline-block text-right mr-4">
                {idx + 1}
              </span>
              {line || ' '}
            </div>
          ))}
        </code>
      </pre>
    );
  };

  const renderDiffView = () => {
    if (!currentFile) return null;
    
    const buggyLines = currentFile.buggyCode.split('\n');
    const fixedLines = currentFile.fixedCode.split('\n');
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Before (Buggy)
            </h4>
            <pre className="text-xs font-mono bg-red-950/30 text-gray-100 p-3 rounded-lg overflow-x-auto border border-red-900/50">
              <code>
                {buggyLines.map((line, idx) => (
                  <div key={idx} className="text-red-300">
                    <span className="text-gray-500 select-none w-6 inline-block text-right mr-2">
                      {idx + 1}
                    </span>
                    {line || ' '}
                  </div>
                ))}
              </code>
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              After (Fixed)
            </h4>
            <pre className="text-xs font-mono bg-green-950/30 text-gray-100 p-3 rounded-lg overflow-x-auto border border-green-900/50">
              <code>
                {fixedLines.map((line, idx) => (
                  <div key={idx} className="text-green-300">
                    <span className="text-gray-500 select-none w-6 inline-block text-right mr-2">
                      {idx + 1}
                    </span>
                    {line || ' '}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code className="w-5 h-5 text-amber-600" />
            Code Work
          </CardTitle>
          {isComplete ? (
            <Badge className="bg-green-500 text-white">
              <CheckCheck className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500 text-amber-700">
              {completedSteps}/{totalSteps} steps
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Review the code, understand the bug, and apply the fix
        </p>
        <Progress value={progressPercent} className="h-2 mt-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredSteps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filteredSteps.map((step, idx) => {
              const status = stepStatuses.find(s => s.id === step.id);
              const isStepComplete = status?.completed || false;
              
              return (
                <Button
                  key={step.id}
                  variant={isStepComplete ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-1.5",
                    isStepComplete && "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={() => {
                    if (step.id === 'understand') {
                      setActiveTab('buggy');
                      markStepComplete('understand');
                    } else if (step.id === 'implement') {
                      setActiveTab('fixed');
                    }
                  }}
                  data-testid={`step-${step.id}`}
                >
                  {isStepComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5" />
                  )}
                  <span className="text-xs">{idx + 1}. {step.label}</span>
                </Button>
              );
            })}
          </div>
        )}

        {files.length > 1 && (
          <div className="flex gap-2 border-b pb-2">
            {files.map((file, idx) => (
              <Button
                key={idx}
                variant={activeFileIndex === idx ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setActiveFileIndex(idx)}
              >
                <FileCode className="w-3.5 h-3.5" />
                {file.filename.split('/').pop()}
              </Button>
            ))}
          </div>
        )}

        {currentFile && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm font-mono text-muted-foreground">
                {currentFile.filename}
              </div>
              {codeWorkConfig.showDiffView && (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buggy' | 'fixed' | 'diff')}>
                  <TabsList className="grid grid-cols-3 h-8">
                    <TabsTrigger value="buggy" className="text-xs gap-1 data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                      <AlertTriangle className="w-3 h-3" />
                      Buggy
                    </TabsTrigger>
                    <TabsTrigger value="fixed" className="text-xs gap-1 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                      <CheckCircle2 className="w-3 h-3" />
                      Fixed
                    </TabsTrigger>
                    <TabsTrigger value="diff" className="text-xs gap-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                      <Diff className="w-3 h-3" />
                      Diff
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            <ScrollArea className="h-64 rounded-lg border bg-gray-900">
              {activeTab === 'buggy' && renderCodeBlock(currentFile.buggyCode, currentFile.language, currentFile.highlightLines)}
              {activeTab === 'fixed' && renderCodeBlock(currentFile.fixedCode, currentFile.language)}
              {activeTab === 'diff' && renderDiffView()}
            </ScrollArea>

            {currentFile.explanation && activeTab !== 'buggy' && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {currentFile.explanation}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {codeWorkConfig.showRunTests && (
          <div className="bg-muted/50 border rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Terminal className="w-4 h-4" />
              <span>After completing code work, run <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">npm test</code> in the terminal below to verify your fix.</span>
            </div>
          </div>
        )}

        {codeWorkConfig.mentorHints.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHints(!showHints)}
              className="gap-1.5 text-muted-foreground"
              data-testid="show-hints-btn"
            >
              <Lightbulb className="w-4 h-4" />
              {showHints ? 'Hide' : 'Show'} Mentor Hints
            </Button>
            
            {showHints && (
              <div className="mt-2 space-y-1.5">
                {codeWorkConfig.mentorHints.map((hint, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    <span className="text-amber-500 font-medium">{idx + 1}.</span>
                    {hint}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isComplete && canComplete && (
          <div className="pt-2 border-t">
            <Button
              onClick={onComplete}
              disabled={isSaving}
              className="w-full gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              data-testid="complete-code-work-btn"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCheck className="w-4 h-4" />
                  Mark Code Work Complete
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
            {codeWorkConfig.completionMessage && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {codeWorkConfig.completionMessage}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
