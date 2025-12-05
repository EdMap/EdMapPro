import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Terminal, 
  CheckCircle2, 
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Lightbulb,
  ArrowLeft,
  HelpCircle,
  FolderGit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getOnboardingAdapter,
  validateCommand,
  getStepHints,
  type OnboardingAdapter,
  type EnvironmentSetupStep,
  type CommandHistoryEntry
} from "@shared/adapters/onboarding";
import type { Role, Level } from "@shared/adapters";

interface EnvironmentSetupProps {
  workspaceId: number;
  role: Role;
  level: Level;
  onComplete: () => void;
  onBack: () => void;
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
  timestamp: Date;
}

export function EnvironmentSetup({
  workspaceId,
  role,
  level,
  onComplete,
  onBack
}: EnvironmentSetupProps) {
  const adapter = getOnboardingAdapter(role, level);
  const { environmentSetup, uiControls, difficulty } = adapter;
  const steps = environmentSetup.steps;
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [stepAttempts, setStepAttempts] = useState<Record<string, number>>({});
  const [showHints, setShowHints] = useState(uiControls.hintVisibility === 'always');
  const [currentDirectory, setCurrentDirectory] = useState('~');
  const [transitionState, setTransitionState] = useState<'active' | 'booting' | 'summary'>('active');
  const [bootingProgress, setBootingProgress] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  const currentStep = steps[currentStepIndex];
  const allStepsComplete = completedSteps.length >= steps.length;
  const isComplete = transitionState === 'summary';
  
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentStepIndex]);
  
  const addTerminalLine = useCallback((type: TerminalLine['type'], content: string) => {
    setTerminalLines(prev => [...prev, { type, content, timestamp: new Date() }]);
  }, []);
  
  useEffect(() => {
    if (transitionState === 'booting') {
      const timeoutIds: NodeJS.Timeout[] = [];
      
      const bootMessages = [
        { delay: 300, message: '> Compiling application...' },
        { delay: 800, message: '> Building assets...' },
        { delay: 1400, message: '> Starting server on port 3000...' },
        { delay: 2000, message: '✓ Server running at http://localhost:3000' },
        { delay: 2600, message: '\n🎉 Environment setup complete!' }
      ];
      
      bootMessages.forEach(({ delay, message }) => {
        const timeoutId = setTimeout(() => {
          addTerminalLine('output', message);
          setBootingProgress(Math.min(100, (delay / 2600) * 100));
        }, delay);
        timeoutIds.push(timeoutId);
      });
      
      const progressTimeoutId = setTimeout(() => {
        setBootingProgress(100);
        const summaryTimeoutId = setTimeout(() => {
          setTransitionState('summary');
        }, 800);
        timeoutIds.push(summaryTimeoutId);
      }, 3000);
      timeoutIds.push(progressTimeoutId);
      
      return () => {
        timeoutIds.forEach(id => clearTimeout(id));
      };
    }
  }, [transitionState, addTerminalLine]);
  
  const handleCommand = useCallback((command: string) => {
    if (!command.trim() || !currentStep) return;
    
    addTerminalLine('input', `${currentDirectory} $ ${command}`);
    
    const result = validateCommand(command.trim(), currentStep, difficulty);
    
    if (result.isValid) {
      if (result.output) {
        addTerminalLine('success', result.output);
      }
      
      if (currentStep.id === 'cd') {
        setCurrentDirectory('~/merchant-dashboard');
      }
      
      setCompletedSteps(prev => [...prev, currentStep.id]);
      
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
        addTerminalLine('output', `\n✓ Step ${currentStepIndex + 1} complete! Moving to next step...\n`);
      } else {
        addTerminalLine('output', '\n🚀 Starting development server...\n');
        setTransitionState('booting');
      }
    } else {
      addTerminalLine('error', result.output);
      
      setStepAttempts(prev => ({
        ...prev,
        [currentStep.id]: (prev[currentStep.id] || 0) + 1
      }));
      
      if (uiControls.hintVisibility === 'on-error' && result.hint) {
        setShowHints(true);
      }
      
      if (result.hint && difficulty.errorRecoveryGuidance) {
        addTerminalLine('output', `💡 Hint: ${result.hint}`);
      }
    }
    
    setInputValue('');
  }, [currentStep, currentStepIndex, steps.length, currentDirectory, difficulty, uiControls.hintVisibility, addTerminalLine]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputValue);
    }
  };
  
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };
  
  const progressPercentage = (completedSteps.length / steps.length) * 100;
  
  const currentHints = currentStep 
    ? getStepHints(currentStep, environmentSetup.terminalHints, difficulty)
    : [];
  
  if (transitionState === 'booting') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Environment Setup</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Starting your development server...
            </p>
          </div>
        </div>
        
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
                <Terminal className="h-6 w-6 text-indigo-600 dark:text-indigo-300 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Booting Development Server
                </h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Please wait while we start everything up...
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-indigo-600">
                  {Math.round(bootingProgress)}%
                </div>
              </div>
            </div>
            <Progress value={bootingProgress} className="h-2" />
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 dark:bg-gray-950 border-gray-800">
          <CardContent className="p-4">
            <ScrollArea className="h-64 font-mono text-sm">
              {terminalLines.map((line, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "whitespace-pre-wrap",
                    line.type === 'input' && "text-green-400",
                    line.type === 'output' && "text-gray-300",
                    line.type === 'success' && "text-emerald-400",
                    line.type === 'error' && "text-red-400"
                  )}
                >
                  {line.content}
                </div>
              ))}
              <div className="flex items-center text-indigo-400 mt-1">
                <span className="animate-pulse">▌</span>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isComplete) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
            <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
              {environmentSetup.completionMessage.title}
            </h3>
            <p className="text-green-700 dark:text-green-300 mb-6">
              {environmentSetup.completionMessage.description}
            </p>
            
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-3 text-sm">What you accomplished:</h4>
              <ul className="space-y-2">
                {steps.map((step, i) => (
                  <li key={step.id} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{step.instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700" data-testid="button-continue-after-setup">
              Continue to Meet Your Team
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Environment Setup</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Set up your local development environment
          </p>
        </div>
        <Button variant="outline" onClick={onBack} data-testid="button-back-from-setup">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
              <FolderGit2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                {environmentSetup.project.org}/{environmentSetup.project.name}
              </h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                {environmentSetup.project.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-indigo-600">
                {completedSteps.length}/{steps.length}
              </div>
              <div className="text-xs text-indigo-500">Steps</div>
            </div>
          </div>
          {uiControls.showProgressIndicator && (
            <Progress value={progressPercentage} className="mt-4 h-2" />
          )}
        </CardContent>
      </Card>
      
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {currentStep && (
            <Card className="border-2 border-indigo-200 dark:border-indigo-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="mb-2">
                    Step {currentStepIndex + 1} of {steps.length}
                  </Badge>
                  {stepAttempts[currentStep.id] > 0 && (
                    <Badge variant="outline" className="text-orange-600">
                      {stepAttempts[currentStep.id]} attempt{stepAttempts[currentStep.id] > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{currentStep.instruction}</CardTitle>
                {difficulty.showExampleCommands && currentStep.hint && (
                  <CardDescription>{currentStep.hint}</CardDescription>
                )}
              </CardHeader>
            </Card>
          )}
          
          <Card 
            className="bg-gray-900 border-gray-700 cursor-text"
            onClick={handleTerminalClick}
          >
            <CardHeader className="pb-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="text-gray-400 text-sm font-mono ml-2">
                  Terminal — {environmentSetup.project.name}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea 
                className={cn(
                  "font-mono text-sm p-4",
                  uiControls.terminalHeight === 'compact' && "h-[200px]",
                  uiControls.terminalHeight === 'standard' && "h-[300px]",
                  uiControls.terminalHeight === 'expanded' && "h-[400px]"
                )}
              >
                {terminalLines.length === 0 && (
                  <div className="text-gray-500">
                    Welcome to the terminal. Type your commands below.
                  </div>
                )}
                {terminalLines.map((line, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "whitespace-pre-wrap",
                      line.type === 'input' && "text-green-400",
                      line.type === 'output' && "text-gray-300",
                      line.type === 'error' && "text-red-400",
                      line.type === 'success' && "text-cyan-400"
                    )}
                  >
                    {line.content}
                  </div>
                ))}
                <div className="flex items-center text-green-400 mt-1">
                  <span>{currentDirectory} $ </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono ml-1"
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    data-testid="input-terminal-command"
                  />
                  <span className="animate-pulse">▌</span>
                </div>
                <div ref={terminalEndRef} />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div 
                    key={step.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-sm",
                      isCompleted && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
                      isCurrent && !isCompleted && "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200",
                      !isCompleted && !isCurrent && "text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : isCurrent ? (
                      <Terminal className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-gray-300" />
                    )}
                    <span className="flex-1">{step.instruction}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          
          {uiControls.showHintsPanel && currentHints.length > 0 && (
            <Collapsible open={showHints} onOpenChange={setShowHints}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Command Hints
                      </span>
                      {showHints ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    {currentHints.map((hint, i) => (
                      <div key={i} className="text-sm">
                        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">
                          {hint.command}
                        </code>
                        {hint.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">
                            {hint.description}
                          </p>
                        )}
                        {hint.example && (
                          <p className="text-gray-500 dark:text-gray-500 mt-1 text-xs font-mono">
                            Example: {hint.example}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
          
          {!uiControls.showHintsPanel && (
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                      Need help?
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Try the command yourself first. If you get stuck, 
                      the terminal will provide guidance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
