import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Terminal,
  TestTube,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionResponse, TestCase, CodeExecutionAdapter } from "@shared/adapters/code-execution/types";

export type DockTab = 'terminal' | 'tests' | 'chat' | 'tips';

export interface BottomDockConfig {
  enabledTabs: DockTab[];
  defaultTab: DockTab;
  defaultExpanded: boolean;
  collapsedHeight: number;
  expandedHeight: number;
}

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

interface BottomDockProps {
  config: BottomDockConfig;
  terminalLines: TerminalLine[];
  onTerminalCommand?: (command: string) => void;
  testCases: TestCase[];
  testResults?: ExecutionResponse['testResults'];
  scaffolding?: CodeExecutionAdapter['scaffolding'];
  chatMessages: ChatMessage[];
  onSendChat?: (message: string) => void;
  unreadChatCount?: number;
  tips: string[];
  mentorFeedback?: string;
  isRunningTests?: boolean;
}

export function BottomDock({
  config,
  terminalLines,
  onTerminalCommand,
  testCases,
  testResults,
  scaffolding,
  chatMessages,
  onSendChat,
  unreadChatCount = 0,
  tips,
  mentorFeedback,
  isRunningTests,
}: BottomDockProps) {
  const [activeTab, setActiveTab] = useState<DockTab>(config.defaultTab);
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded);
  const [terminalInput, setTerminalInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'terminal' && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleTerminalSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (terminalInput.trim() && onTerminalCommand) {
      onTerminalCommand(terminalInput.trim());
      setTerminalInput('');
    }
  }, [terminalInput, onTerminalCommand]);

  const handleChatSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && onSendChat) {
      onSendChat(chatInput.trim());
      setChatInput('');
    }
  }, [chatInput, onSendChat]);

  const handleTabChange = useCallback((tab: DockTab) => {
    setActiveTab(tab);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  }, [isExpanded]);

  const passedTests = testResults?.filter(t => t.passed).length || 0;
  const totalTests = testResults?.length || testCases.length;
  const allTestsPassed = testResults && testResults.every(t => t.passed);

  const tabIcons: Record<DockTab, typeof Terminal> = {
    terminal: Terminal,
    tests: TestTube,
    chat: MessageSquare,
    tips: Lightbulb,
  };

  const tabLabels: Record<DockTab, string> = {
    terminal: 'Terminal',
    tests: 'Tests',
    chat: 'Chat',
    tips: 'Tips',
  };

  return (
    <div 
      className={cn(
        "border-t bg-background flex flex-col transition-all duration-200",
        isExpanded ? `h-[${config.expandedHeight}px]` : `h-[${config.collapsedHeight}px]`
      )}
      style={{ height: isExpanded ? config.expandedHeight : config.collapsedHeight }}
      data-testid="bottom-dock"
    >
      <div className="flex items-center justify-between px-2 py-1 bg-muted/30 border-b">
        <div className="flex items-center gap-1">
          {config.enabledTabs.map(tab => {
            const Icon = tabIcons[tab];
            const isActive = activeTab === tab;
            const showBadge = tab === 'tests' && testResults;
            const showUnread = tab === 'chat' && unreadChatCount > 0;
            
            return (
              <Button
                key={tab}
                size="sm"
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "h-7 text-xs gap-1.5 relative",
                  isActive && "bg-background shadow-sm"
                )}
                onClick={() => handleTabChange(tab)}
                data-testid={`tab-${tab}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tabLabels[tab]}
                
                {showBadge && (
                  <Badge 
                    variant={allTestsPassed ? "default" : "destructive"} 
                    className="ml-1 h-4 text-[10px] px-1"
                  >
                    {passedTests}/{totalTests}
                  </Badge>
                )}
                
                {showUnread && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="button-toggle-dock"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          {activeTab === 'terminal' && (
            <TerminalPanel
              lines={terminalLines}
              onSubmit={handleTerminalSubmit}
              inputValue={terminalInput}
              onInputChange={setTerminalInput}
              endRef={terminalEndRef}
            />
          )}
          
          {activeTab === 'tests' && (
            <TestsPanel
              testCases={testCases}
              results={testResults}
              scaffolding={scaffolding}
              isRunning={isRunningTests}
            />
          )}
          
          {activeTab === 'chat' && (
            <ChatPanel
              messages={chatMessages}
              onSubmit={handleChatSubmit}
              inputValue={chatInput}
              onInputChange={setChatInput}
              endRef={chatEndRef}
            />
          )}
          
          {activeTab === 'tips' && (
            <TipsPanel
              tips={tips}
              mentorFeedback={mentorFeedback}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface TerminalPanelProps {
  lines: TerminalLine[];
  onSubmit: (e: React.FormEvent) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  endRef: React.RefObject<HTMLDivElement>;
}

function TerminalPanel({ lines, onSubmit, inputValue, onInputChange, endRef }: TerminalPanelProps) {
  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100 font-mono text-sm">
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-1">
          {lines.map((line, i) => (
            <div key={i} className={cn(
              "whitespace-pre-wrap break-all",
              line.type === 'input' && "text-cyan-400",
              line.type === 'output' && "text-zinc-300",
              line.type === 'error' && "text-red-400",
              line.type === 'success' && "text-green-400",
              line.type === 'info' && "text-yellow-400",
            )}>
              {line.type === 'input' && <span className="text-green-400">$ </span>}
              {line.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      
      <form onSubmit={onSubmit} className="flex items-center gap-2 p-2 border-t border-zinc-700">
        <span className="text-green-400">$</span>
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type a command..."
          className="flex-1 bg-transparent border-none text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 h-8"
          data-testid="input-terminal"
        />
      </form>
    </div>
  );
}

interface TestsPanelProps {
  testCases: TestCase[];
  results?: ExecutionResponse['testResults'];
  scaffolding?: CodeExecutionAdapter['scaffolding'];
  isRunning?: boolean;
}

function TestsPanel({ testCases, results, scaffolding, isRunning }: TestsPanelProps) {
  if (isRunning) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Running tests...</p>
        </div>
      </div>
    );
  }

  if (testCases.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <TestTube className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No test cases defined</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        {testCases.map(testCase => {
          const result = results?.find(r => r.testId === testCase.id);
          const showDetails = scaffolding?.testVisibility === 'all' || 
            (scaffolding?.testVisibility === 'names' && !testCase.hidden);
          
          return (
            <div 
              key={testCase.id} 
              className={cn(
                "p-3 rounded-lg border",
                result?.passed === true && "border-green-500/50 bg-green-50 dark:bg-green-950/20",
                result?.passed === false && "border-red-500/50 bg-red-50 dark:bg-red-950/20",
                result === undefined && "border-muted bg-muted/30"
              )}
            >
              <div className="flex items-start gap-2">
                {result ? (
                  result.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  )
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 mt-0.5 shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{testCase.name}</p>
                  
                  {showDetails && testCase.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {testCase.description}
                    </p>
                  )}
                  
                  {result && !result.passed && scaffolding?.feedbackDetail !== 'minimal' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      {result.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSubmit: (e: React.FormEvent) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  endRef: React.RefObject<HTMLDivElement>;
}

function ChatPanel({ messages, onSubmit, inputValue, onInputChange, endRef }: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Ask your team for help!</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.isUser && "flex-row-reverse"
                )}
              >
                <div className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.isUser 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}>
                  {!message.isUser && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{message.sender}</span>
                      {message.senderRole && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          {message.senderRole}
                        </Badge>
                      )}
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      
      <form onSubmit={onSubmit} className="flex items-center gap-2 p-3 border-t">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          data-testid="input-chat"
        />
        <Button type="submit" size="sm" data-testid="button-send-chat">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

interface TipsPanelProps {
  tips: string[];
  mentorFeedback?: string;
}

function TipsPanel({ tips, mentorFeedback }: TipsPanelProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {mentorFeedback && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Mentor Feedback</p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{mentorFeedback}</p>
              </div>
            </div>
          </div>
        )}
        
        {tips.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Hints & Tips</p>
            {tips.map((tip, i) => (
              <div key={i} className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 font-medium text-sm">{i + 1}.</span>
                  <p className="text-sm text-amber-900 dark:text-amber-100">{tip}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tips available yet</p>
            <p className="text-xs mt-1">Run your code to get feedback</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
