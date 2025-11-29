import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  Target,
  Users,
  FileText,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Calendar,
  BookOpen,
  Coffee,
  ArrowLeft,
  Sparkles,
  Store,
  CreditCard,
  Globe,
  Bug,
  GitBranch,
  Code,
  Lightbulb,
  ArrowRight,
  Monitor,
  Rocket,
  Folder,
  FolderOpen,
  File,
  Terminal,
  Play,
  Check,
  X,
  Sun,
  Clipboard,
  GitCommit,
  GitPullRequest,
  PenLine
} from "lucide-react";

interface DayProgress {
  docsRead?: boolean;
  introProgress?: Record<string, boolean>;
  comprehensionComplete?: boolean;
  docSectionsRead?: Record<string, boolean>;
  standupComplete?: boolean;
  codebaseExplored?: boolean;
  codeFixComplete?: boolean;
  gitWorkflowComplete?: boolean;
  reflectionComplete?: boolean;
}

interface InternOnboardingSessionProps {
  session: any;
  project: any;
  onComplete: () => void;
  mode?: 'practice' | 'journey';
  savedProgress?: DayProgress;
  savedProgressId?: number;
  initialDay?: number;
}

type ViewMode = 'overview' | 'team-intro' | 'documentation' | 'comprehension-check' | 
  'day2-standup' | 'day2-codebase' | 'day2-code-fix' | 'day2-git' | 'day2-reflection';

interface TeamMember {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  availability: string;
  bio?: string;
}

export default function InternOnboardingSession({ 
  session, 
  project, 
  onComplete,
  mode = 'journey',
  savedProgress,
  savedProgressId,
  initialDay
}: InternOnboardingSessionProps) {
  const [currentDay, setCurrentDay] = useState(initialDay || 1);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [message, setMessage] = useState("");
  const [introProgress, setIntroProgress] = useState<Record<string, boolean>>(savedProgress?.introProgress || {});
  const [docsRead, setDocsRead] = useState(savedProgress?.docsRead || false);
  const [comprehensionComplete, setComprehensionComplete] = useState(savedProgress?.comprehensionComplete || false);
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null);
  
  const [docSectionsRead, setDocSectionsRead] = useState<Record<string, boolean>>(savedProgress?.docSectionsRead || {});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showDay2Preview, setShowDay2Preview] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<string>('product');
  
  // Day 2 state
  const [standupComplete, setStandupComplete] = useState(savedProgress?.standupComplete || false);
  const [codebaseExplored, setCodebaseExplored] = useState(savedProgress?.codebaseExplored || false);
  const [codeFixComplete, setCodeFixComplete] = useState(savedProgress?.codeFixComplete || false);
  const [gitWorkflowComplete, setGitWorkflowComplete] = useState(savedProgress?.gitWorkflowComplete || false);
  const [reflectionComplete, setReflectionComplete] = useState(savedProgress?.reflectionComplete || false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [gitStep, setGitStep] = useState(0);
  const [gitCommands, setGitCommands] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [reflectionText, setReflectionText] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const docsScrollRef = useRef<HTMLDivElement>(null);
  const progressIdRef = useRef<number | null>(savedProgressId || null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<any>(null);

  const requirements = project.requirements || {};
  const dailyStructure = requirements.dailyStructure || [];
  const teamMembers: TeamMember[] = project.teamStructure || [];
  const scenarioScript = project.scenarioScript || {};
  const projectInfo = requirements.project || {};

  const currentDayData = dailyStructure.find((d: any) => d.day === currentDay) || dailyStructure[0];
  const dayProgress = calculateDayProgress();

  function calculateDayProgress() {
    if (currentDay === 1) {
      const totalIntros = teamMembers.length;
      const completedIntros = Object.values(introProgress).filter(Boolean).length;
      // New weights: Docs 30%, Team 40%, Comprehension 30%
      const docsWeight = 30;
      const introWeight = 40;
      const comprehensionWeight = 30;
      
      let progress = 0;
      if (docsRead) progress += docsWeight;
      progress += (completedIntros / totalIntros) * introWeight;
      if (comprehensionComplete) progress += comprehensionWeight;
      
      return Math.round(progress);
    }
    
    if (currentDay === 2) {
      let progress = 0;
      if (standupComplete) progress += 20;
      if (codebaseExplored) progress += 15;
      if (codeFixComplete) progress += 30;
      if (gitWorkflowComplete) progress += 25;
      if (reflectionComplete) progress += 10;
      return progress;
    }
    
    return 0;
  }

  const { data: interactions, isLoading: interactionsLoading } = useQuery({
    queryKey: ['/api/workspace', session.id, 'interactions'],
    queryFn: () => fetch(`/api/workspace/${session.id}/interactions`).then(res => res.json()),
    refetchInterval: 2000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const channel = selectedMember ? `dm-${selectedMember.name}` : 'team-chat';
      
      if (selectedMember) {
        setTypingIndicator(selectedMember.name);
      }
      
      const response = await apiRequest("POST", `/api/workspace/${session.id}/action`, {
        type: 'send-message',
        channel,
        data: { content: userMessage }
      });
      return response.json();
    },
    onMutate: async (userMessage: string) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/workspace', session.id, 'interactions'] });
      
      // Snapshot previous value
      const previousInteractions = queryClient.getQueryData(['/api/workspace', session.id, 'interactions']);
      
      // Optimistically add user's message immediately
      const channel = selectedMember ? `dm-${selectedMember.name}` : 'team-chat';
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sessionId: session.id,
        channel,
        sender: 'You',
        senderRole: 'Intern',
        content: userMessage,
        createdAt: new Date().toISOString(),
        isOptimistic: true
      };
      
      queryClient.setQueryData(
        ['/api/workspace', session.id, 'interactions'],
        (old: any[] | undefined) => [...(old || []), optimisticMessage]
      );
      
      // Clear input immediately for snappy feel
      setMessage("");
      
      return { previousInteractions };
    },
    onSuccess: () => {
      setTypingIndicator(null);
      queryClient.invalidateQueries({ queryKey: ['/api/workspace', session.id, 'interactions'] });
      
      if (selectedMember && !introProgress[selectedMember.name]) {
        setIntroProgress(prev => ({ ...prev, [selectedMember.name]: true }));
      }
    },
    onError: (_err, _userMessage, context) => {
      setTypingIndicator(null);
      // Rollback on error
      if (context?.previousInteractions) {
        queryClient.setQueryData(
          ['/api/workspace', session.id, 'interactions'],
          context.previousInteractions
        );
      }
    }
  });

  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      if (progressIdRef.current) {
        const response = await apiRequest("PATCH", `/api/workspace/progress/${progressIdRef.current}`, progressData);
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/workspace/progress`, {
          sessionId: session.id,
          userId: 1,
          projectId: project.id,
          role: session.configuration?.activeRole || 'Developer',
          mode: mode,
          currentDay,
          ...progressData
        });
        const result = await response.json();
        progressIdRef.current = result.id;
        return result;
      }
    }
  });

  const buildProgressData = () => ({
    currentDay,
    dayProgress: {
      docsRead,
      introProgress,
      comprehensionComplete,
      docSectionsRead,
      standupComplete,
      codebaseExplored,
      codeFixComplete,
      gitWorkflowComplete,
      reflectionComplete
    },
    overallProgress: dayProgress,
    status: dayProgress === 100 ? 'completed' : 'in_progress'
  });

  const saveProgress = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const progressData = buildProgressData();
    pendingSaveRef.current = progressData;
    
    saveTimeoutRef.current = setTimeout(() => {
      saveProgressMutation.mutate(progressData);
      pendingSaveRef.current = null;
    }, 1000);
  };

  const flushPendingSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    if (pendingSaveRef.current) {
      try {
        const progressData = pendingSaveRef.current;
        if (progressIdRef.current) {
          await apiRequest("PATCH", `/api/workspace/progress/${progressIdRef.current}`, progressData);
        } else {
          const response = await apiRequest("POST", `/api/workspace/progress`, {
            sessionId: session.id,
            userId: 1,
            projectId: project.id,
            role: session.configuration?.activeRole || 'Developer',
            mode: mode,
            currentDay,
            ...progressData
          });
          const result = await response.json();
          progressIdRef.current = result.id;
        }
        pendingSaveRef.current = null;
      } catch (error) {
        console.error('Failed to flush pending save:', error);
      }
    }
  };

  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // Skip auto-save on initial mount - progress is already created by handleStartPractice/handleStartJourney
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveProgress();
  }, [docsRead, introProgress, comprehensionComplete, docSectionsRead, standupComplete, codebaseExplored, codeFixComplete, gitWorkflowComplete, reflectionComplete, currentDay]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        flushPendingSave();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushPendingSave();
    };
  }, []);

  useEffect(() => {
    if (viewMode === 'overview' && scenarioScript.onboarding) {
      const timers: NodeJS.Timeout[] = [];
      let cumulativeDelay = 0;
      
      scenarioScript.onboarding.forEach((event: any) => {
        const baseDelay = 2000;
        const randomDelay = Math.random() * 3000;
        cumulativeDelay += baseDelay + randomDelay;
        
        const timer = setTimeout(async () => {
          try {
            await apiRequest("POST", `/api/workspace/${session.id}/interactions`, {
              sessionId: session.id,
              channel: 'team-chat',
              sender: event.from,
              senderRole: teamMembers.find((m: TeamMember) => m.name === event.from)?.role || 'Team Member',
              content: event.message
            });
            queryClient.invalidateQueries({ queryKey: ['/api/workspace', session.id, 'interactions'] });
          } catch (error) {
            console.error('Failed to send auto message:', error);
          }
        }, cumulativeDelay);
        timers.push(timer);
      });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [viewMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactions]);

  function handleSendMessage() {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  }

  function startTeamIntro(member: TeamMember) {
    setSelectedMember(member);
    setViewMode('team-intro');
  }

  function getFilteredInteractions() {
    if (!Array.isArray(interactions)) return [];
    
    if (viewMode === 'team-intro' && selectedMember) {
      return interactions.filter((i: any) => 
        i.channel === `dm-${selectedMember.name}` || 
        (i.sender === selectedMember.name && i.channel === 'dm-You')
      );
    }
    
    if (viewMode === 'comprehension-check') {
      return interactions.filter((i: any) => 
        i.channel === 'dm-Sarah' || 
        (i.sender === 'Sarah' && i.channel === 'dm-You')
      );
    }
    
    return interactions.filter((i: any) => i.channel === 'team-chat');
  }

  const filteredInteractions = getFilteredInteractions();

  function renderOverview() {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">
                  Welcome to {projectInfo.name || 'NovaPay'}!
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Day {currentDay}: {currentDayData?.theme || 'Welcome aboard'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800">
              {projectInfo.description || 'Your first week as a software engineering intern starts now. Take your time getting to know the team and understanding the project.'}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Today's Activities
          </h3>
          
          <div className="grid gap-3">
            {/* Step 1: Documentation - Always available first */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                docsRead ? 'border-green-200 bg-green-50' : ''
              }`}
              onClick={() => setViewMode('documentation')}
              data-testid="card-documentation"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">1</div>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Read Onboarding Docs</h4>
                      <p className="text-sm text-gray-600">
                        Learn about the product and your mission
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {docsRead && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Meet the Team - Unlocks after docs */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                Object.values(introProgress).filter(Boolean).length === teamMembers.length ? 'border-green-200 bg-green-50' : ''
              } ${!docsRead ? 'opacity-60' : ''}`}
              onClick={() => docsRead && setViewMode('team-intro')}
              data-testid="card-team-intros"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${docsRead ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>2</div>
                    <div className={`p-2 rounded-lg ${docsRead ? 'bg-purple-100' : 'bg-gray-100'}`}>
                      <Users className={`h-5 w-5 ${docsRead ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Meet the Team</h4>
                      <p className="text-sm text-gray-600">
                        1:1 introductions with your teammates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!docsRead && (
                      <Badge variant="outline" className="text-xs">
                        Read docs first
                      </Badge>
                    )}
                    {docsRead && (
                      <Badge variant="outline">
                        {Object.values(introProgress).filter(Boolean).length}/{teamMembers.length}
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Comprehension Check - Unlocks after meeting all team members */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                comprehensionComplete ? 'border-green-200 bg-green-50' : ''
              } ${Object.values(introProgress).filter(Boolean).length !== teamMembers.length ? 'opacity-60' : ''}`}
              onClick={() => Object.values(introProgress).filter(Boolean).length === teamMembers.length && setViewMode('comprehension-check')}
              data-testid="card-comprehension-check"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${Object.values(introProgress).filter(Boolean).length === teamMembers.length ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>3</div>
                    <div className={`p-2 rounded-lg ${Object.values(introProgress).filter(Boolean).length === teamMembers.length ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <MessageSquare className={`h-5 w-5 ${Object.values(introProgress).filter(Boolean).length === teamMembers.length ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Comprehension Check</h4>
                      <p className="text-sm text-gray-600">
                        Chat with Sarah about what you learned
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.values(introProgress).filter(Boolean).length !== teamMembers.length && (
                      <Badge variant="outline" className="text-xs">
                        Meet the team first
                      </Badge>
                    )}
                    {comprehensionComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {currentDayData?.overnightEvent && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Coming tomorrow:</span>
                <span>{currentDayData.overnightEvent}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderDay2Overview() {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bug className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-orange-900">
                  Day 2: Your First Ticket
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Time to fix the timezone bug!
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800">
              Today you'll experience the full developer workflow: standup, code exploration, making a fix, and submitting your first PR.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Today's Activities
          </h3>
          
          <div className="grid gap-3">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                standupComplete ? 'border-green-200 bg-green-50' : ''
              }`}
              onClick={() => setViewMode('day2-standup')}
              data-testid="card-day2-standup"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Sun className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Morning Standup</h4>
                      <p className="text-sm text-gray-600">
                        Sync with Sarah on your ticket
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {standupComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                codebaseExplored ? 'border-green-200 bg-green-50' : ''
              } ${!standupComplete ? 'opacity-60' : ''}`}
              onClick={() => standupComplete && setViewMode('day2-codebase')}
              data-testid="card-day2-codebase"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Explore the Codebase</h4>
                      <p className="text-sm text-gray-600">
                        Find the timezone utility file
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!standupComplete && <Badge variant="outline" className="text-xs">Complete standup first</Badge>}
                    {codebaseExplored && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                codeFixComplete ? 'border-green-200 bg-green-50' : ''
              } ${!codebaseExplored ? 'opacity-60' : ''}`}
              onClick={() => codebaseExplored && setViewMode('day2-code-fix')}
              data-testid="card-day2-code-fix"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Code className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Fix the Code</h4>
                      <p className="text-sm text-gray-600">
                        Make the timezone fix
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!codebaseExplored && <Badge variant="outline" className="text-xs">Explore codebase first</Badge>}
                    {codeFixComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                gitWorkflowComplete ? 'border-green-200 bg-green-50' : ''
              } ${!codeFixComplete ? 'opacity-60' : ''}`}
              onClick={() => codeFixComplete && setViewMode('day2-git')}
              data-testid="card-day2-git"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <GitBranch className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Git Workflow</h4>
                      <p className="text-sm text-gray-600">
                        Branch, commit, and create PR
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!codeFixComplete && <Badge variant="outline" className="text-xs">Fix code first</Badge>}
                    {gitWorkflowComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                reflectionComplete ? 'border-green-200 bg-green-50' : ''
              } ${!gitWorkflowComplete ? 'opacity-60' : ''}`}
              onClick={() => gitWorkflowComplete && setViewMode('day2-reflection')}
              data-testid="card-day2-reflection"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <PenLine className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Day 2 Reflection</h4>
                      <p className="text-sm text-gray-600">
                        What will you confirm with QA tomorrow?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!gitWorkflowComplete && <Badge variant="outline" className="text-xs">Complete git workflow first</Badge>}
                    {reflectionComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function renderDay2Standup() {
    const sarah = teamMembers.find(m => m.name === 'Sarah') || teamMembers[0];
    
    return (
      <div className="h-full flex flex-col">
        <Card className="mb-4 bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sun className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Morning Standup with Sarah</p>
                <p className="text-sm text-yellow-700">
                  Share what you'll be working on and get clarity on the ticket requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {filteredInteractions.length === 0 && (
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <p className="text-xs font-medium text-blue-600 mb-1">Sarah</p>
                <p className="text-gray-800">
                  Good morning! Ready for standup? Tell me - what are you planning to work on today, and do you have any questions about the timezone bug ticket?
                </p>
              </div>
            )}
            {filteredInteractions.map((interaction: any, idx: number) => (
              <div
                key={idx}
                className={`flex ${interaction.sender === 'You' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    interaction.sender === 'You'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  {interaction.sender !== 'You' && (
                    <p className="text-xs font-medium text-blue-600 mb-1">{interaction.sender}</p>
                  )}
                  <p className={interaction.sender === 'You' ? 'text-white' : 'text-gray-800'}>
                    {interaction.content}
                  </p>
                </div>
              </div>
            ))}
            {typingIndicator && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-500">{typingIndicator} is typing...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your plan for the day..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              data-testid="input-standup-message"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              data-testid="button-send-standup"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {filteredInteractions.length >= 2 && (
            <Button 
              className="w-full"
              onClick={() => {
                setStandupComplete(true);
                setViewMode('overview');
              }}
              data-testid="button-complete-standup"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Standup
            </Button>
          )}
        </div>
      </div>
    );
  }

  function renderDay2Codebase() {
    const fileStructure = [
      { name: 'client', type: 'folder', children: [
        { name: 'src', type: 'folder', children: [
          { name: 'components', type: 'folder', children: [
            { name: 'TransactionList.tsx', type: 'file', highlight: true }
          ]},
          { name: 'utils', type: 'folder', children: [
            { name: 'dateFormatters.ts', type: 'file', highlight: true, target: true }
          ]}
        ]}
      ]},
      { name: 'server', type: 'folder', children: [
        { name: 'routes', type: 'folder' },
        { name: 'services', type: 'folder' }
      ]},
      { name: 'shared', type: 'folder', children: [
        { name: 'types', type: 'folder', children: [
          { name: 'merchant.ts', type: 'file' }
        ]}
      ]}
    ];

    const renderFileTree = (items: any[], depth = 0) => {
      return items.map((item, idx) => (
        <div key={idx} style={{ marginLeft: depth * 16 }}>
          <div 
            className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 ${
              item.highlight ? 'bg-yellow-50' : ''
            } ${item.target && currentFile === item.name ? 'bg-blue-100 border-l-2 border-blue-500' : ''}`}
            onClick={() => {
              if (item.type === 'file') {
                setCurrentFile(item.name);
                if (item.target) {
                  setCodebaseExplored(true);
                }
              }
            }}
            data-testid={`file-${item.name}`}
          >
            {item.type === 'folder' ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <File className={`h-4 w-4 ${item.highlight ? 'text-orange-500' : 'text-gray-500'}`} />
            )}
            <span className={`text-sm ${item.highlight ? 'font-medium text-orange-700' : 'text-gray-700'}`}>
              {item.name}
            </span>
            {item.target && <Badge className="ml-2 text-xs bg-orange-100 text-orange-700">Fix here</Badge>}
          </div>
          {item.children && renderFileTree(item.children, depth + 1)}
        </div>
      ));
    };

    return (
      <div className="space-y-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Explore the Codebase</p>
                <p className="text-sm text-blue-700">
                  Navigate to <code className="bg-blue-100 px-1 rounded">dateFormatters.ts</code> - that's where the timezone fix needs to happen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              merchant-dashboard/
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm">
              {renderFileTree(fileStructure)}
            </div>
          </CardContent>
        </Card>

        {currentFile === 'dateFormatters.ts' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Found it!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                This is where dates are formatted for display. You'll fix the timezone handling here.
              </p>
              <Button 
                className="mt-3"
                onClick={() => setViewMode('overview')}
                data-testid="button-continue-to-fix"
              >
                Continue to Fix Code
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderDay2CodeFix() {
    const codeTemplate = `export function formatTransactionDate(
  timestamp: string,
  merchantTimezone: string = 'UTC'
): string {
  const date = new Date(timestamp);
  
  // TODO: Convert to merchant's timezone
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ___BLANK_1___  // Fill in the timezone
  };
  
  return date.toLocaleString('en-US', options);
}`;

    const isCorrect = codeInputs['blank1']?.toLowerCase().trim() === 'merchanttimezone';
    
    return (
      <div className="space-y-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Code className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Fix the Timezone Bug</p>
                <p className="text-sm text-purple-700">
                  Complete the code by filling in the missing value. The function should use the merchant's timezone, not UTC.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <File className="h-4 w-4" />
              client/src/utils/dateFormatters.ts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
              <pre className="whitespace-pre-wrap">
{`export function formatTransactionDate(
  timestamp: string,
  merchantTimezone: string = 'UTC'
): string {
  const date = new Date(timestamp);
  
  // TODO: Convert to merchant's timezone
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: `}<span className="inline-flex items-center bg-gray-800 border border-gray-600 rounded px-1">
                  <input
                    type="text"
                    value={codeInputs['blank1'] || ''}
                    onChange={(e) => setCodeInputs(prev => ({ ...prev, blank1: e.target.value }))}
                    placeholder="???"
                    className="bg-transparent text-yellow-400 w-32 outline-none font-mono"
                    data-testid="input-code-blank"
                  />
                </span>{`  // Fill in the timezone
  };
  
  return date.toLocaleString('en-US', options);
}`}
              </pre>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Hint:</strong> Look at the function parameter - what variable holds the merchant's timezone preference?
              </p>
            </div>
          </CardContent>
        </Card>

        {codeInputs['blank1'] && (
          <Card className={isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Correct!</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Not quite - check the function parameter name</span>
                  </>
                )}
              </div>
              {isCorrect && (
                <>
                  <p className="text-sm text-green-700 mt-1">
                    By using <code className="bg-green-100 px-1 rounded">merchantTimezone</code>, transactions will now display in the merchant's local time!
                  </p>
                  <Button 
                    className="mt-3"
                    onClick={() => {
                      setCodeFixComplete(true);
                      setViewMode('overview');
                    }}
                    data-testid="button-code-fix-complete"
                  >
                    Continue to Git Workflow
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderDay2Git() {
    const gitSteps = [
      { command: 'git checkout -b fix/timezone-display', description: 'Create a new branch for your fix' },
      { command: 'git add .', description: 'Stage your changes' },
      { command: 'git commit -m "..."', description: 'Commit with a descriptive message' },
      { command: 'git push origin fix/timezone-display', description: 'Push to remote' }
    ];

    const handleGitCommand = () => {
      if (gitStep < gitSteps.length) {
        const expectedCommand = gitSteps[gitStep].command;
        const userCommand = gitCommands[gitStep] || '';
        
        if (gitStep === 2) {
          if (userCommand.startsWith('git commit -m') && commitMessage.trim()) {
            setGitStep(prev => prev + 1);
          }
        } else if (userCommand.trim() === expectedCommand) {
          setGitStep(prev => prev + 1);
        }
      }
    };

    return (
      <div className="space-y-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Git Workflow</p>
                <p className="text-sm text-green-700">
                  Now let's commit your fix and create a pull request. Follow the commands below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Terminal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm space-y-3">
              {gitSteps.map((step, idx) => (
                <div key={idx} className={idx > gitStep ? 'opacity-40' : ''}>
                  <p className="text-gray-400 text-xs mb-1"># {step.description}</p>
                  {idx < gitStep ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">$</span>
                      <span className="text-white">{gitCommands[idx] || step.command}</span>
                      <Check className="h-4 w-4 text-green-400 ml-2" />
                    </div>
                  ) : idx === gitStep ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">$</span>
                      <input
                        type="text"
                        value={gitCommands[idx] || ''}
                        onChange={(e) => {
                          const newCommands = [...gitCommands];
                          newCommands[idx] = e.target.value;
                          setGitCommands(newCommands);
                        }}
                        placeholder={step.command}
                        className="bg-transparent text-white flex-1 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleGitCommand();
                        }}
                        data-testid={`input-git-step-${idx}`}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">$</span>
                      <span className="text-gray-600">{step.command}</span>
                    </div>
                  )}
                  
                  {idx === 2 && gitStep === 2 && (
                    <div className="mt-2 ml-4">
                      <p className="text-gray-400 text-xs mb-1">Enter your commit message:</p>
                      <Textarea
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Fix timezone display in transaction list"
                        className="bg-gray-800 border-gray-700 text-white min-h-[60px]"
                        data-testid="input-commit-message"
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {gitStep >= gitSteps.length && (
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <GitPullRequest className="h-4 w-4" />
                    <span>Ready to create Pull Request!</span>
                  </div>
                </div>
              )}
            </div>

            {gitStep < gitSteps.length && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Current step:</strong> {gitSteps[gitStep].description}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Type the command and press Enter
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {gitStep >= gitSteps.length && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Git workflow complete!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your PR is ready for review. Sarah will look at it tomorrow during code review!
              </p>
              <Button 
                className="mt-3"
                onClick={() => {
                  setGitWorkflowComplete(true);
                  setViewMode('overview');
                }}
                data-testid="button-git-complete"
              >
                Continue to Reflection
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderDay2Reflection() {
    return (
      <div className="space-y-4">
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <PenLine className="h-6 w-6 text-indigo-600" />
              <div>
                <p className="font-medium text-indigo-900">Day 2 Reflection</p>
                <p className="text-sm text-indigo-700">
                  Great work today! Before wrapping up, think about what you'd like to confirm with QA tomorrow.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What will you confirm with Alex (QA) tomorrow?</CardTitle>
            <CardDescription>
              Think about edge cases, testing scenarios, or anything you're unsure about.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="For example: I want to confirm that the timezone fix works for merchants in different timezones, especially those with daylight saving time..."
              className="min-h-[120px]"
              data-testid="input-reflection"
            />
            
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">Good things to think about:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Edge cases (daylight saving time, international date line)</li>
                <li>• Different timezone formats</li>
                <li>• How the fix affects date filters</li>
                <li>• Mobile vs desktop display</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {reflectionText.length >= 20 && (
          <Button 
            className="w-full"
            onClick={() => {
              setReflectionComplete(true);
              setViewMode('overview');
            }}
            data-testid="button-complete-day2"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Day 2
          </Button>
        )}
      </div>
    );
  }

  function renderTeamIntroView() {
    if (selectedMember) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedMember(null)}
              data-testid="button-back-to-team-list"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-purple-100 text-purple-700">
                  {selectedMember.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{selectedMember.name}</p>
                <p className="text-xs text-gray-600">{selectedMember.role}</p>
              </div>
            </div>
            {introProgress[selectedMember.name] && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Introduced
              </Badge>
            )}
          </div>

          {selectedMember.bio && (
            <Card className="mb-4 bg-gray-50">
              <CardContent className="p-3 text-sm text-gray-700">
                {selectedMember.bio}
              </CardContent>
            </Card>
          )}

          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {filteredInteractions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Coffee className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Say hello to {selectedMember.name}!</p>
                  <p className="text-sm">Introduce yourself and ask about their role.</p>
                </div>
              )}
              {filteredInteractions.map((interaction: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex ${interaction.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${idx}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      interaction.sender === 'You'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    {interaction.sender !== 'You' && (
                      <p className="text-xs font-medium text-purple-600 mb-1">
                        {interaction.sender}
                      </p>
                    )}
                    <p className={interaction.sender === 'You' ? 'text-white' : 'text-gray-800'}>
                      {interaction.content}
                    </p>
                  </div>
                </div>
              ))}
              {typingIndicator && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <p className="text-sm text-gray-500">{typingIndicator} is typing...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message ${selectedMember.name}...`}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              data-testid="input-message"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Your Team</h3>
          <Badge variant="outline">
            {Object.values(introProgress).filter(Boolean).length}/{teamMembers.length} introduced
          </Badge>
        </div>
        
        <div className="grid gap-3">
          {teamMembers.map((member: TeamMember, idx: number) => (
            <Card 
              key={idx}
              className={`cursor-pointer transition-all hover:shadow-md ${
                introProgress[member.name] ? 'border-green-200' : ''
              }`}
              onClick={() => startTeamIntro(member)}
              data-testid={`team-member-card-${idx}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        {introProgress[member.name] && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{member.role}</p>
                      <p className="text-xs text-gray-500 italic">{member.personality}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {member.expertise?.slice(0, 2).map((skill: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function toggleSection(section: string, open: boolean) {
    setExpandedSections(prev => ({ ...prev, [section]: open }));
    if (open) {
      setDocSectionsRead(prev => ({ ...prev, [section]: true }));
    }
  }

  const allSectionsRead = Boolean(
    docSectionsRead['product'] && 
    docSectionsRead['users'] && 
    docSectionsRead['bug'] && 
    docSectionsRead['setup']
  );

  function handleFinishDocs() {
    if (!allSectionsRead) return;
    setDocsRead(true);
    setViewMode('overview');
  }

  function renderDocumentation() {
    return (
      <div className="space-y-4" ref={docsScrollRef}>
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-purple-900">Welcome to your first day!</p>
                <p className="text-sm text-purple-800 mt-1">
                  Before you meet the team, take 5-10 minutes to read through these onboarding docs. 
                  You'll learn what NovaPay does and what you'll be working on this week.
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-purple-600">
                  <Clock className="h-3 w-3" />
                  <span>4 short sections to read</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Day 1 Onboarding Docs
          </h3>
          <Badge variant={allSectionsRead ? "default" : "outline"} className={allSectionsRead ? "bg-green-600" : ""}>
            {Object.keys(docSectionsRead).length}/4 sections
          </Badge>
        </div>

        <Tabs value={activeDocTab} onValueChange={setActiveDocTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="product" className="flex items-center gap-2" data-testid="tab-product">
              <Store className="h-4 w-4" />
              Product & Users
              {docSectionsRead['product'] && docSectionsRead['users'] && (
                <CheckCircle2 className="h-3 w-3 text-green-600 ml-1" />
              )}
            </TabsTrigger>
            <TabsTrigger value="mission" className="flex items-center gap-2" data-testid="tab-mission">
              <Target className="h-4 w-4" />
              Your Mission
              {docSectionsRead['bug'] && docSectionsRead['setup'] && (
                <CheckCircle2 className="h-3 w-3 text-green-600 ml-1" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">TL;DR</p>
                    <p className="text-sm text-blue-800">
                      Merchant Dashboard helps small business owners track their money. You'll be fixing a timezone bug in the Transactions page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Collapsible open={expandedSections['product']} onOpenChange={(open) => toggleSection('product', open)}>
              <Card>
                <CollapsibleTrigger className="w-full" data-testid="section-product">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Store className="h-4 w-4 text-purple-600" />
                        What is Merchant Dashboard?
                        {docSectionsRead['product'] && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      {expandedSections['product'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <p className="text-gray-700">
                      <strong>Merchant Dashboard</strong> is the admin panel where NovaPay's business customers manage their payment operations. Think of it as their "mission control" for money.
                    </p>
                    
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Transactions</p>
                          <p className="text-sm text-gray-600">View all customer payments, refunds, and chargebacks in real-time</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Payouts</p>
                          <p className="text-sm text-gray-600">See when money hits their bank account (usually every 2 business days)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Settings</p>
                          <p className="text-sm text-gray-600">Update bank details, business info, and notification preferences</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-sm text-gray-500">Tech:</span>
                      {['React', 'Node.js', 'PostgreSQL', 'TypeScript'].map((tech, idx) => (
                        <Badge key={idx} variant="secondary">{tech}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={expandedSections['users']} onOpenChange={(open) => toggleSection('users', open)}>
              <Card>
                <CollapsibleTrigger className="w-full" data-testid="section-users">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        Who Uses It?
                        {docSectionsRead['users'] && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      {expandedSections['users'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 bg-amber-100">
                            <AvatarFallback className="text-amber-700 text-lg">M</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-amber-900">Meet Maria - Coffee Shop Owner</p>
                            <p className="text-sm text-amber-800 mt-1">
                              Maria runs "Bean There" in Austin, TX. Every morning she checks her dashboard to see yesterday's sales, verify tips were processed correctly, and confirm her weekly payout is on schedule.
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">Small Business</Badge>
                              <Badge variant="outline" className="text-xs">50-100 transactions/day</Badge>
                              <Badge variant="outline" className="text-xs">CST Timezone</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div>
                      <p className="font-medium text-gray-900 mb-2">Maria's Daily Workflow:</p>
                      <ol className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">1</span>
                          Opens dashboard, checks total sales from yesterday
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">2</span>
                          Filters transactions by payment type (card vs cash)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">3</span>
                          Checks if Friday's payout arrived in her bank
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">4</span>
                          Downloads weekly report for her accountant
                        </li>
                      </ol>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800">
                        <strong>The Problem:</strong> Maria is in Austin (CST) but transactions show in UTC. A sale at 8pm Monday shows as 2am Tuesday - confusing her daily reconciliation!
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {docSectionsRead['product'] && docSectionsRead['users'] && (
              <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-orange-900">Section Complete!</p>
                        <p className="text-sm text-orange-700">2 of 4 sections done. Ready to learn about your mission?</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setActiveDocTab('mission');
                        setTimeout(() => {
                          docsScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                      data-testid="button-continue-mission"
                    >
                      Continue to Your Mission
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mission" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Your Mission</p>
                    <p className="text-sm text-orange-800">
                      Fix the timezone bug so Maria sees transactions in her local time, not server time. You'll work on this starting Day 2.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Collapsible open={expandedSections['bug']} onOpenChange={(open) => toggleSection('bug', open)}>
              <Card>
                <CollapsibleTrigger className="w-full" data-testid="section-bug">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bug className="h-4 w-4 text-red-600" />
                        The Timezone Bug
                        {docSectionsRead['bug'] && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      {expandedSections['bug'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs font-medium text-red-600 mb-1">CURRENT (Bug)</p>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-8 w-8 text-red-400" />
                          <div>
                            <p className="font-mono text-sm">Feb 15, 02:30 AM</p>
                            <p className="text-xs text-red-600">Shows UTC time</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs font-medium text-green-600 mb-1">EXPECTED (Fixed)</p>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-8 w-8 text-green-400" />
                          <div>
                            <p className="font-mono text-sm">Feb 14, 08:30 PM</p>
                            <p className="text-xs text-green-600">Shows merchant's local time</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900 mb-2">What's Happening:</p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">1.</span>
                          <span>Transaction timestamps are stored in UTC (correct)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">2.</span>
                          <span>Frontend displays them as-is without conversion (bug)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">3.</span>
                          <span>Merchant's timezone preference is ignored</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900 mb-2">Files You'll Touch:</p>
                      <div className="font-mono text-xs space-y-1 text-blue-800">
                        <p>client/src/components/TransactionList.tsx</p>
                        <p>client/src/utils/dateFormatters.ts</p>
                        <p>shared/types/merchant.ts</p>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium text-green-900 mb-1">Success Criteria:</p>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Transactions display in merchant's configured timezone</li>
                        <li>• Date filters work correctly with local dates</li>
                        <li>• Existing tests pass + new timezone tests added</li>
                      </ul>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={expandedSections['setup']} onOpenChange={(open) => toggleSection('setup', open)}>
              <Card>
                <CollapsibleTrigger className="w-full" data-testid="section-setup">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-purple-600" />
                        How We Work
                        {docSectionsRead['setup'] && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      {expandedSections['setup'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <p className="font-medium text-gray-900 mb-3">Development Workflow:</p>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>1</span> Pick ticket
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>2</span> Branch
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>3</span> Code
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>4</span> PR
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>5</span> Review
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                          <span>6</span> Merge
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400">
                      <pre className="whitespace-pre-wrap">{`# Your first commands tomorrow:
git checkout -b fix/timezone-display
npm install
npm run dev

# When ready to submit:
git add .
git commit -m "Fix timezone display in transactions"
git push origin fix/timezone-display`}</pre>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900 mb-2">Who to Ask:</p>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">S</AvatarFallback>
                          </Avatar>
                          <span><strong>Sarah</strong> - Code questions, PR reviews</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-pink-100 text-pink-700">P</AvatarFallback>
                          </Avatar>
                          <span><strong>Priya</strong> - Requirements, user context</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-green-100 text-green-700">M</AvatarFallback>
                          </Avatar>
                          <span><strong>Marcus</strong> - Architecture, tricky bugs</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-orange-100 text-orange-700">A</AvatarFallback>
                          </Avatar>
                          <span><strong>Alex</strong> - Testing, QA process</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="font-medium text-purple-900 mb-2">Team Norms:</p>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• <strong>Standup at 10am</strong> - Quick sync on progress</li>
                        <li>• <strong>Ask early</strong> - Stuck for 15 min? Ask for help</li>
                        <li>• <strong>Reviews = learning</strong> - Feedback is about code, not you</li>
                        <li>• <strong>Document as you go</strong> - Comments save future headaches</li>
                      </ul>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </TabsContent>
        </Tabs>

        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Reading progress</span>
            <span>{Object.keys(docSectionsRead).length} of 4 sections completed</span>
          </div>
          <Progress value={(Object.keys(docSectionsRead).length / 4) * 100} className="h-2" />
          
          <Button 
            className="w-full"
            onClick={handleFinishDocs}
            disabled={!allSectionsRead}
            data-testid="button-finish-reading"
          >
            {allSectionsRead ? (
              <>
                <Users className="h-4 w-4 mr-2" />
                Done Reading - Continue to Meet the Team
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Read all 4 sections to continue
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  function renderComprehensionCheck() {
    const sarah = teamMembers.find(m => m.name === 'Sarah') || teamMembers[0];
    
    return (
      <div className="h-full flex flex-col">
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-700">S</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-blue-900">Comprehension Check with Sarah</p>
                <p className="text-sm text-blue-700">
                  Sarah will ask you some questions about what you've read. Answer naturally - this is a conversation, not a test!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {filteredInteractions.length === 0 && (
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <p className="text-xs font-medium text-purple-600 mb-1">Sarah</p>
                <p className="text-gray-800">
                  Hey! I see you've been reading through the docs. Before we get you started on anything, I just want to make sure we're on the same page. What's your understanding of what our Merchant Dashboard does?
                </p>
              </div>
            )}
            {filteredInteractions.map((interaction: any, idx: number) => (
              <div
                key={idx}
                className={`flex ${interaction.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                data-testid={`comprehension-message-${idx}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    interaction.sender === 'You'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  {interaction.sender !== 'You' && (
                    <p className="text-xs font-medium text-purple-600 mb-1">
                      {interaction.sender}
                    </p>
                  )}
                  <p className={interaction.sender === 'You' ? 'text-white' : 'text-gray-800'}>
                    {interaction.content}
                  </p>
                </div>
              </div>
            ))}
            {typingIndicator && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-500">{typingIndicator} is typing...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your response..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              data-testid="input-comprehension-message"
            />
            <Button 
              onClick={() => {
                setSelectedMember(sarah);
                handleSendMessage();
              }}
              disabled={!message.trim() || sendMessageMutation.isPending}
              data-testid="button-send-comprehension-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {filteredInteractions.length >= 4 && !comprehensionComplete && (
            <Button 
              className="w-full"
              onClick={() => {
                setComprehensionComplete(true);
                setShowDay2Preview(true);
              }}
              data-testid="button-complete-comprehension"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Day 1
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-session-title">
                {project.name}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Your first week as a software engineering intern
              </p>
            </div>
            <Button
              onClick={onComplete}
              variant="outline"
              size="sm"
              data-testid="button-exit-session"
            >
              Exit Simulation
            </Button>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Day {currentDay} of 5</span>
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Today's Progress</span>
                <span className="font-medium">{dayProgress}%</span>
              </div>
              <Progress value={dayProgress} className="h-2" />
            </div>
            {dayProgress >= 80 && currentDay < 5 && (
              <Button 
                size="sm"
                onClick={() => setCurrentDay(currentDay + 1)}
                data-testid="button-next-day"
              >
                Continue to Day {currentDay + 1}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-screen-xl mx-auto px-6 py-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4 overflow-y-auto">
              <Card data-testid="card-day-info">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Day {currentDay}: {currentDayData?.theme}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentDayData?.activities?.map((activity: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 ${
                          (idx === 0 && docsRead) ||
                          (idx === 1 && Object.values(introProgress).filter(Boolean).length === teamMembers.length) ||
                          (idx === 2 && comprehensionComplete)
                            ? 'text-green-600'
                            : 'text-gray-300'
                        }`} />
                        <span className="text-gray-700">{activity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-learning-objectives">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requirements.learningObjectives?.slice(0, 3).map((obj: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {viewMode !== 'overview' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setViewMode('overview');
                    setSelectedMember(null);
                  }}
                  data-testid="button-back-to-overview"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Overview
                </Button>
              )}
            </div>

            <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-6">
                  {viewMode === 'overview' && currentDay === 1 && renderOverview()}
                  {viewMode === 'overview' && currentDay === 2 && renderDay2Overview()}
                  {viewMode === 'team-intro' && renderTeamIntroView()}
                  {viewMode === 'documentation' && renderDocumentation()}
                  {viewMode === 'comprehension-check' && renderComprehensionCheck()}
                  {viewMode === 'day2-standup' && renderDay2Standup()}
                  {viewMode === 'day2-codebase' && renderDay2Codebase()}
                  {viewMode === 'day2-code-fix' && renderDay2CodeFix()}
                  {viewMode === 'day2-git' && renderDay2Git()}
                  {viewMode === 'day2-reflection' && renderDay2Reflection()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Day 1 Complete Dialog - triggered after comprehension check */}
      <Dialog open={showDay2Preview} onOpenChange={setShowDay2Preview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              Day 1 Complete!
            </DialogTitle>
            <DialogDescription>
              Great job! You've completed your first day at NovaPay.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">What you accomplished today:</p>
                    <ul className="text-sm text-green-800 mt-2 space-y-1">
                      <li>• Read through onboarding documentation</li>
                      <li>• Met all your teammates</li>
                      <li>• Checked in with Sarah</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Bug className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-900">Coming up on Day 2:</p>
                    <p className="text-sm text-orange-800 mt-1">
                      Your first ticket! Fix the timezone display bug so merchants see times in their local timezone.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Pro tip:</strong> If you get stuck tomorrow, message Sarah or check the codebase for similar date handling patterns.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => {
              setShowDay2Preview(false);
              setViewMode('overview');
            }} data-testid="button-wrap-up">
              <Clock className="h-4 w-4 mr-2" />
              Wrap Up for Today
            </Button>
            <Button onClick={() => {
              setShowDay2Preview(false);
              setCurrentDay(2);
              setViewMode('overview');
            }} data-testid="button-start-day2">
              <Rocket className="h-4 w-4 mr-2" />
              Start Day 2
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
