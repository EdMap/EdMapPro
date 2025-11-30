import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  PenLine,
  MessageCircle,
  Minimize2
} from "lucide-react";

interface DayProgress {
  docsRead?: boolean;
  introProgress?: Record<string, boolean>;
  comprehensionComplete?: boolean;
  docSectionsRead?: Record<string, boolean>;
  closedConversations?: Record<string, boolean>;
  standupComplete?: boolean;
  devSetupComplete?: boolean;
  ticketReviewed?: boolean;
  branchCreated?: boolean;
  codebaseExplored?: boolean;
  codeFixComplete?: boolean;
  testFixComplete?: boolean;
  gitWorkflowComplete?: boolean;
  prCreated?: boolean;
  reflectionComplete?: boolean;
  codeInputs?: Record<string, string>;
  gitInputs?: Record<string, string>;
}

interface InternOnboardingSessionProps {
  session: any;
  project: any;
  onComplete: () => void;
  mode?: 'practice' | 'journey';
  savedProgress?: DayProgress;
  savedProgressId?: number;
  initialDay?: number;
  user?: any;
}

type ViewMode = 'overview' | 'team-intro' | 'documentation' | 'comprehension-check' | 
  'day2-standup' | 'day2-dev-setup' | 'day2-ticket' | 'day2-branch' | 'day2-codebase' | 'day2-code-fix' | 
  'day2-test-fix' | 'day2-git' | 'day2-pr' | 'day2-reflection';

interface TeamMember {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  availability: string;
  bio?: string;
}

// Floating Team Chat Component
interface FloatingTeamChatProps {
  isOpen: boolean;
  onToggle: () => void;
  teamMembers: TeamMember[];
  activeChatMember: TeamMember | null;
  onSelectMember: (member: TeamMember) => void;
  message: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  isSending: boolean;
  interactions: any[];
  typingIndicator: string | null;
}

function FloatingTeamChat({
  isOpen,
  onToggle,
  teamMembers,
  activeChatMember,
  onSelectMember,
  message,
  onMessageChange,
  onSendMessage,
  isSending,
  interactions,
  typingIndicator
}: FloatingTeamChatProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [interactions, isOpen]);

  const filteredMessages = activeChatMember 
    ? interactions.filter((i: any) => 
        i.channel === `dm-${activeChatMember.name}` || 
        (i.sender === activeChatMember.name && i.channel === 'dm-You') ||
        i.channel === `floating-dm-${activeChatMember.name}`
      )
    : [];

  // Get initials for avatar
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Get color for member
  const getMemberColor = (name: string) => {
    const colors: Record<string, string> = {
      'Sarah': 'bg-blue-500',
      'Marcus': 'bg-green-500',
      'Priya': 'bg-purple-500',
      'Alex': 'bg-orange-500',
      'Jordan': 'bg-teal-500'
    };
    return colors[name] || 'bg-gray-500';
  };

  // Get avatar URL for team member using DiceBear API
  const getAvatarUrl = (name: string) => {
    const avatarSeeds: Record<string, { seed: string; style: string }> = {
      'Sarah': { seed: 'sarah-tech-lead', style: 'avataaars' },
      'Marcus': { seed: 'marcus-senior-dev', style: 'avataaars' },
      'Priya': { seed: 'priya-product-mgr', style: 'avataaars' },
      'Alex': { seed: 'alex-qa-engineer', style: 'avataaars' },
      'Jordan': { seed: 'jordan-intern', style: 'avataaars' }
    };
    const config = avatarSeeds[name] || { seed: name, style: 'avataaars' };
    return `https://api.dicebear.com/7.x/${config.style}/svg?seed=${config.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  };

  return (
    <>
      {/* Floating Chat Button - Bottom right corner (FAB style) */}
      <button
        onClick={onToggle}
        className={`fixed right-6 bottom-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-200 ${
          isOpen 
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' 
            : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
        }`}
        data-testid="button-floating-chat"
      >
        <MessageCircle className="h-5 w-5" />
        {!isOpen && <span className="text-sm font-medium">Ask Team</span>}
      </button>

      {/* Chat Panel - Bottom right, partial height */}
      <div 
        className={`fixed right-6 bottom-20 w-80 sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-all duration-300 ease-in-out rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        style={{ height: 'clamp(420px, 70vh, 640px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Team Chat
          </h3>
          <Button variant="ghost" size="sm" onClick={onToggle} data-testid="button-close-chat">
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Team Member Tabs */}
        <div className="p-2 border-b dark:border-gray-700">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {teamMembers.slice(0, 5).map((member) => (
              <button
                key={member.name}
                onClick={() => onSelectMember(member)}
                className={`flex flex-col items-center p-2 rounded-lg min-w-[60px] transition-colors ${
                  activeChatMember?.name === member.name
                    ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                data-testid={`button-chat-member-${member.name.toLowerCase()}`}
              >
                <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                  <AvatarImage src={getAvatarUrl(member.name)} alt={member.name} />
                  <AvatarFallback className={`text-white text-xs ${getMemberColor(member.name)}`}>
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs mt-1 text-gray-600 dark:text-gray-300 truncate w-full text-center">
                  {member.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Content */}
        {activeChatMember ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Active member info */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{activeChatMember.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activeChatMember.role}</p>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {filteredMessages.length === 0 && (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Send a message to {activeChatMember.name}</p>
                    <p className="text-xs mt-1">Ask for help or clarification</p>
                  </div>
                )}
                {filteredMessages.map((interaction: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${interaction.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                  >
                    {interaction.sender !== 'You' && (
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={getAvatarUrl(interaction.sender)} alt={interaction.sender} />
                        <AvatarFallback className={`text-white text-xs ${getMemberColor(interaction.sender)}`}>
                          {getInitials(interaction.sender)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        interaction.sender === 'You'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <p className={`text-sm ${interaction.sender === 'You' ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                        {interaction.content}
                      </p>
                    </div>
                  </div>
                ))}
                {typingIndicator && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{typingIndicator} is typing...</p>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t dark:border-gray-700">
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => onMessageChange(e.target.value)}
                  placeholder={`Ask ${activeChatMember.name}...`}
                  className="min-h-[50px] max-h-[100px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSendMessage();
                    }
                  }}
                  data-testid="input-floating-chat"
                />
                <Button 
                  size="sm"
                  onClick={onSendMessage}
                  disabled={!message.trim() || isSending}
                  className="self-end"
                  data-testid="button-send-floating-chat"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a teammate to chat</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function InternOnboardingSession({ 
  session, 
  project, 
  onComplete,
  mode = 'journey',
  savedProgress,
  savedProgressId,
  initialDay,
  user
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
  const [devSetupComplete, setDevSetupComplete] = useState(savedProgress?.devSetupComplete || false);
  const [ticketReviewed, setTicketReviewed] = useState(savedProgress?.ticketReviewed || false);
  const [branchCreated, setBranchCreated] = useState(savedProgress?.branchCreated || false);
  const [codebaseExplored, setCodebaseExplored] = useState(savedProgress?.codebaseExplored || false);
  const [codeFixComplete, setCodeFixComplete] = useState(savedProgress?.codeFixComplete || false);
  const [testFixComplete, setTestFixComplete] = useState(savedProgress?.testFixComplete || false);
  const [gitWorkflowComplete, setGitWorkflowComplete] = useState(savedProgress?.gitWorkflowComplete || false);
  const [prCreated, setPrCreated] = useState(savedProgress?.prCreated || false);
  const [reflectionComplete, setReflectionComplete] = useState(savedProgress?.reflectionComplete || false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>(savedProgress?.codeInputs || {});
  const [gitInputs, setGitInputs] = useState<Record<string, string>>(savedProgress?.gitInputs || {});
  const [gitStep, setGitStep] = useState(0);
  const [gitCommands, setGitCommands] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [reflectionText, setReflectionText] = useState("");
  
  // Day 2 Standup state
  const [standupStarted, setStandupStarted] = useState(false);
  const [standupVisibleMessages, setStandupVisibleMessages] = useState(0);
  // Initialize from savedProgress to persist across reloads
  const [standupUserSpoke, setStandupUserSpoke] = useState(savedProgress?.standupComplete || false);
  
  // Day 2 Test Fix state
  const [testState, setTestState] = useState<'before' | 'running' | 'after'>('before');
  
  // Day 2 PR state  
  const [prTitle, setPrTitle] = useState('');
  const [prDescriptionLocal, setPrDescriptionLocal] = useState('');
  const [prSubmittedLocal, setPrSubmittedLocal] = useState(false);
  
  // Day 2 Branch creation state
  const [branchInput, setBranchInput] = useState('');
  const [branchError, setBranchError] = useState('');
  const [branchSuccess, setBranchSuccess] = useState(false);
  
  // Floating chat state
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);
  const [floatingChatMember, setFloatingChatMember] = useState<TeamMember | null>(null);
  const [floatingChatMessage, setFloatingChatMessage] = useState("");
  const [floatingTypingIndicator, setFloatingTypingIndicator] = useState<string | null>(null);
  
  // Track closed conversations (when user says goodbye)
  const [closedConversations, setClosedConversations] = useState<Record<string, boolean>>(savedProgress?.closedConversations || {});
  // Track if showing all-intros-complete screen
  const [showAllIntrosComplete, setShowAllIntrosComplete] = useState(false);
  // Track if all-intros-complete dialog has been dismissed (to prevent showing again)
  const [introsDialogDismissed, setIntrosDialogDismissed] = useState(false);
  
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

  // Avatar helper functions
  const getTeamAvatarUrl = (name: string) => {
    const avatarSeeds: Record<string, { seed: string; style: string }> = {
      'Sarah': { seed: 'sarah-tech-lead', style: 'avataaars' },
      'Marcus': { seed: 'marcus-senior-dev', style: 'avataaars' },
      'Priya': { seed: 'priya-product-mgr', style: 'avataaars' },
      'Alex': { seed: 'alex-qa-engineer', style: 'avataaars' },
      'Jordan': { seed: 'jordan-intern', style: 'avataaars' }
    };
    const config = avatarSeeds[name] || { seed: name, style: 'avataaars' };
    return `https://api.dicebear.com/7.x/${config.style}/svg?seed=${config.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  };

  const getTeamMemberColor = (name: string) => {
    const colors: Record<string, string> = {
      'Sarah': 'bg-blue-500',
      'Marcus': 'bg-green-500',
      'Priya': 'bg-purple-500',
      'Alex': 'bg-orange-500',
      'Jordan': 'bg-teal-500'
    };
    return colors[name] || 'bg-gray-500';
  };

  const getTeamMemberInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const currentDayData = dailyStructure.find((d: any) => d.day === currentDay) || dailyStructure[0];
  
  const teamMembersToMeet = teamMembers.filter((m: TeamMember) => m.name !== 'Sarah');
  const completedIntroCount = teamMembersToMeet.filter((m: TeamMember) => introProgress[m.name]).length;
  const allTeamMet = completedIntroCount === teamMembersToMeet.length;

  function calculateDayProgress() {
    if (currentDay === 1) {
      const totalIntros = teamMembersToMeet.length;
      const completedIntros = completedIntroCount;
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
      if (standupComplete) progress += 10;
      if (devSetupComplete) progress += 10;
      if (ticketReviewed) progress += 5;
      if (branchCreated) progress += 5;
      if (codebaseExplored) progress += 10;
      if (codeFixComplete) progress += 20;
      if (testFixComplete) progress += 10;
      if (gitWorkflowComplete) progress += 15;
      if (prCreated) progress += 10;
      if (reflectionComplete) progress += 5;
      return progress;
    }
    
    return 0;
  }

  const dayProgress = calculateDayProgress();

  // Helper to get today's activities based on current day
  function getDayActivities(): string[] {
    if (currentDay === 1) {
      return [
        'Meet the team (1-on-1 introductions with Sarah, Marcus, Priya, Alex, Jordan)',
        'Read project documentation (Product & Users, How We Work)',
        'Comprehension check with Sarah'
      ];
    }
    if (currentDay === 2) {
      return [
        'Morning standup with Sarah',
        'Set up dev environment (clone, install, run)',
        'Review your ticket',
        'Create a feature branch',
        'Explore the codebase and find the bug',
        'Fix the timezone bug',
        'Test your fix locally',
        'Git workflow (branch, commit, push)',
        'Create pull request',
        'End-of-day reflection'
      ];
    }
    if (currentDay === 3) {
      return [
        'Respond to Sarah\'s code review feedback',
        'Revise and update your code based on feedback'
      ];
    }
    if (currentDay === 4) {
      return [
        'Write README documentation section',
        'Get feedback on documentation'
      ];
    }
    if (currentDay === 5) {
      return [
        'Fix edge case bug',
        'Final evaluation with Sarah'
      ];
    }
    return [];
  }

  // Helper to get completed activities based on current state
  function getCompletedActivities(): string[] {
    const completed: string[] = [];
    
    if (currentDay === 1) {
      if (docsRead) completed.push('Read project documentation');
      const introsCompleted = Object.entries(introProgress).filter(([_, done]) => done).map(([name]) => `Met ${name}`);
      completed.push(...introsCompleted);
      if (comprehensionComplete) completed.push('Completed comprehension check');
    }
    
    if (currentDay === 2) {
      if (standupComplete) completed.push('Morning standup completed');
      if (devSetupComplete) completed.push('Dev environment set up');
      if (ticketReviewed) completed.push('Reviewed ticket');
      if (codebaseExplored) completed.push('Explored codebase and found dateFormatters.ts');
      if (codeFixComplete) completed.push('Fixed the timezone bug');
      if (testFixComplete) completed.push('Tested the fix');
      if (gitWorkflowComplete) completed.push('Completed Git workflow');
      if (prCreated) completed.push('Created pull request');
      if (reflectionComplete) completed.push('Completed end-of-day reflection');
    }
    
    return completed;
  }

  const { data: interactions, isLoading: interactionsLoading } = useQuery({
    queryKey: ['/api/workspace', session.id, 'interactions'],
    queryFn: () => fetch(`/api/workspace/${session.id}/interactions`).then(res => res.json()),
    refetchInterval: 2000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ userMessage, targetMember }: { userMessage: string; targetMember?: TeamMember }) => {
      const member = targetMember || selectedMember;
      const channel = member ? `dm-${member.name}` : 'team-chat';
      
      if (member) {
        setTypingIndicator(member.name);
      }
      
      const response = await apiRequest("POST", `/api/workspace/${session.id}/action`, {
        type: 'send-message',
        channel,
        data: { content: userMessage },
        currentDay,
        dayActivities: getDayActivities(),
        completedActivities: getCompletedActivities()
      });
      return response.json();
    },
    onMutate: async ({ userMessage, targetMember }: { userMessage: string; targetMember?: TeamMember }) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/workspace', session.id, 'interactions'] });
      
      // Snapshot previous value
      const previousInteractions = queryClient.getQueryData(['/api/workspace', session.id, 'interactions']);
      
      // Optimistically add user's message immediately
      const member = targetMember || selectedMember;
      const channel = member ? `dm-${member.name}` : 'team-chat';
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
      
      return { previousInteractions, member };
    },
    onSuccess: (data, _variables, context) => {
      setTypingIndicator(null);
      queryClient.invalidateQueries({ queryKey: ['/api/workspace', session.id, 'interactions'] });
      
      const member = context?.member;
      if (member && !introProgress[member.name]) {
        setIntroProgress(prev => ({ ...prev, [member.name]: true }));
      }
      
      // Check if conversation was closed by the team member
      if (data?.conversationClosed && member) {
        setClosedConversations(prev => {
          const newClosed = { ...prev, [member.name]: true };
          
          // Check if all intros are now complete using the new state
          // Only show dialog if NOT already in comprehension-check mode and dialog hasn't been dismissed
          const teamMembersToMeet = teamMembers.filter((m: TeamMember) => m.name !== 'Sarah');
          const allClosed = teamMembersToMeet.every((m: TeamMember) => newClosed[m.name]);
          
          if (allClosed && viewMode !== 'comprehension-check' && !introsDialogDismissed) {
            // Also ensure all are marked as met
            setIntroProgress(prevIntro => {
              const newIntro = { ...prevIntro, [member.name]: true };
              const allMet = teamMembersToMeet.every((m: TeamMember) => newIntro[m.name]);
              if (allMet) {
                setTimeout(() => setShowAllIntrosComplete(true), 1000);
              }
              return newIntro;
            });
          }
          
          return newClosed;
        });
      }
    },
    onError: (_err, _variables, context) => {
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

  // Floating chat mutation - separate from main chat to avoid state conflicts
  const floatingChatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      if (!floatingChatMember) return;
      
      const channel = `dm-${floatingChatMember.name}`;
      setFloatingTypingIndicator(floatingChatMember.name);
      
      const response = await apiRequest("POST", `/api/workspace/${session.id}/action`, {
        type: 'send-message',
        channel,
        data: { content: userMessage },
        currentDay,
        dayActivities: getDayActivities(),
        completedActivities: getCompletedActivities()
      });
      return response.json();
    },
    onMutate: async (userMessage: string) => {
      if (!floatingChatMember) return;
      
      await queryClient.cancelQueries({ queryKey: ['/api/workspace', session.id, 'interactions'] });
      const previousInteractions = queryClient.getQueryData(['/api/workspace', session.id, 'interactions']);
      
      const channel = `dm-${floatingChatMember.name}`;
      const optimisticMessage = {
        id: `temp-floating-${Date.now()}`,
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
      
      setFloatingChatMessage("");
      return { previousInteractions };
    },
    onSuccess: () => {
      setFloatingTypingIndicator(null);
      queryClient.invalidateQueries({ queryKey: ['/api/workspace', session.id, 'interactions'] });
    },
    onError: (_err, _userMessage, context) => {
      setFloatingTypingIndicator(null);
      if (context?.previousInteractions) {
        queryClient.setQueryData(
          ['/api/workspace', session.id, 'interactions'],
          context.previousInteractions
        );
      }
    }
  });

  const handleFloatingChatSend = () => {
    if (!floatingChatMessage.trim() || floatingChatMutation.isPending || !floatingChatMember) return;
    floatingChatMutation.mutate(floatingChatMessage);
  };

  const handleFloatingChatToggle = () => {
    setFloatingChatOpen(!floatingChatOpen);
    // Default to Sarah (team lead) if no member selected
    if (!floatingChatOpen && !floatingChatMember && teamMembers.length > 0) {
      const sarah = teamMembers.find(m => m.name === 'Sarah') || teamMembers[0];
      setFloatingChatMember(sarah);
    }
  };

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
      closedConversations,
      standupComplete,
      devSetupComplete,
      ticketReviewed,
      branchCreated,
      codebaseExplored,
      codeFixComplete,
      testFixComplete,
      gitWorkflowComplete,
      prCreated,
      reflectionComplete,
      codeInputs
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
  }, [docsRead, introProgress, comprehensionComplete, docSectionsRead, closedConversations, standupComplete, devSetupComplete, ticketReviewed, branchCreated, codebaseExplored, codeFixComplete, testFixComplete, gitWorkflowComplete, prCreated, reflectionComplete, codeInputs, currentDay]);

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

  // Day 2 standup script timing - use user's name if available
  // Delays are set for realistic pacing: longer for full updates, shorter for transitions
  const userName = user?.firstName || user?.username || 'there';
  const standupScript = [
    { sender: 'Sarah', role: 'Tech Lead', content: "Morning team! Let's do a quick standup. Marcus, you're up first.", delay: 0 },
    { sender: 'Marcus', role: 'Senior Engineer', content: "Yesterday: Finished the Stripe webhook handlers and got them deployed to staging. Today: Testing edge cases on the payment retry flow - specifically around network timeouts. Blockers: None, all good.", delay: 4000 },
    { sender: 'Sarah', role: 'Tech Lead', content: "Thanks Marcus. Alex?", delay: 2500 },
    { sender: 'Alex', role: 'QA Engineer', content: "Yesterday: Wrote integration tests for the new checkout flow. Today: Setting up the test environment for payment retries. Blockers: None.", delay: 4000 },
    { sender: 'Sarah', role: 'Tech Lead', content: "Great, thanks Alex. Priya?", delay: 2500 },
    { sender: 'Priya', role: 'Product Manager', content: "Yesterday: Finalized requirements for the merchant analytics dashboard. Today: Writing user stories for the next sprint. Blockers: Waiting on design mockups, but should have them by EOD.", delay: 5000 },
    { sender: 'Sarah', role: 'Tech Lead', content: `Thanks Priya. ${userName}, you're up!`, delay: 3000 }
  ];

  useEffect(() => {
    if (standupStarted && standupVisibleMessages < standupScript.length) {
      const timer = setTimeout(() => {
        setStandupVisibleMessages(prev => prev + 1);
      }, standupScript[standupVisibleMessages]?.delay || 1500);
      return () => clearTimeout(timer);
    }
  }, [standupStarted, standupVisibleMessages]);

  function handleSendMessage(targetMember?: TeamMember) {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ userMessage: message, targetMember });
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
                allTeamMet ? 'border-green-200 bg-green-50' : ''
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
                        {completedIntroCount}/{teamMembersToMeet.length}
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Check in with Sarah - Unlocks after meeting all team members */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                comprehensionComplete ? 'border-green-200 bg-green-50' : ''
              } ${!allTeamMet ? 'opacity-60' : ''}`}
              onClick={() => allTeamMet && setViewMode('comprehension-check')}
              data-testid="card-comprehension-check"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${allTeamMet ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>3</div>
                    <div className={`p-2 rounded-lg ${allTeamMet ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <MessageSquare className={`h-5 w-5 ${allTeamMet ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Check in with Sarah</h4>
                      <p className="text-sm text-gray-600">
                        Share what you've learned with your lead
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!allTeamMet && (
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
              Today you'll experience the full developer workflow: set up your environment, understand your ticket, write code, test it, and submit your first PR.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Today's Activities
          </h3>
          
          <div className="grid gap-3">
            {/* 1. Morning Standup */}
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
                      <h4 className="font-medium text-gray-900">1. Morning Standup</h4>
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

            {/* 2. Dev Environment Setup */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                devSetupComplete ? 'border-green-200 bg-green-50' : ''
              } ${!standupComplete ? 'opacity-60' : ''}`}
              onClick={() => standupComplete && setViewMode('day2-dev-setup')}
              data-testid="card-day2-dev-setup"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Terminal className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">2. Set Up Dev Environment</h4>
                      <p className="text-sm text-gray-600">
                        Clone the repo, install dependencies, run locally
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!standupComplete && <Badge variant="outline" className="text-xs">Complete standup first</Badge>}
                    {devSetupComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Review Your Ticket */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                ticketReviewed ? 'border-green-200 bg-green-50' : ''
              } ${!devSetupComplete ? 'opacity-60' : ''}`}
              onClick={() => devSetupComplete && setViewMode('day2-ticket')}
              data-testid="card-day2-ticket"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clipboard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">3. Review Your Ticket</h4>
                      <p className="text-sm text-gray-600">
                        Understand the requirements and acceptance criteria
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!devSetupComplete && <Badge variant="outline" className="text-xs">Set up environment first</Badge>}
                    {ticketReviewed && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Create Branch */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                branchCreated ? 'border-green-200 bg-green-50' : ''
              } ${!ticketReviewed ? 'opacity-60' : ''}`}
              onClick={() => ticketReviewed && setViewMode('day2-branch')}
              data-testid="card-day2-branch"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <GitBranch className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">4. Create a Branch</h4>
                      <p className="text-sm text-gray-600">
                        Create a feature branch before making changes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!ticketReviewed && <Badge variant="outline" className="text-xs">Review ticket first</Badge>}
                    {branchCreated && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Explore Codebase */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                codebaseExplored ? 'border-green-200 bg-green-50' : ''
              } ${!branchCreated ? 'opacity-60' : ''}`}
              onClick={() => branchCreated && setViewMode('day2-codebase')}
              data-testid="card-day2-codebase"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <FolderOpen className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">5. Explore the Codebase</h4>
                      <p className="text-sm text-gray-600">
                        Find the file where the bug lives
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!branchCreated && <Badge variant="outline" className="text-xs">Create branch first</Badge>}
                    {codebaseExplored && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6. Fix the Code */}
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
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Code className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">6. Fix the Bug</h4>
                      <p className="text-sm text-gray-600">
                        Write the timezone fix
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

            {/* 7. Test Your Fix */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                testFixComplete ? 'border-green-200 bg-green-50' : ''
              } ${!codeFixComplete ? 'opacity-60' : ''}`}
              onClick={() => codeFixComplete && setViewMode('day2-test-fix')}
              data-testid="card-day2-test-fix"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Play className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">7. Test Your Fix</h4>
                      <p className="text-sm text-gray-600">
                        Verify it works in the browser
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!codeFixComplete && <Badge variant="outline" className="text-xs">Fix the bug first</Badge>}
                    {testFixComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 8. Git Workflow */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                gitWorkflowComplete ? 'border-green-200 bg-green-50' : ''
              } ${!testFixComplete ? 'opacity-60' : ''}`}
              onClick={() => testFixComplete && setViewMode('day2-git')}
              data-testid="card-day2-git"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <GitCommit className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">8. Stage & Commit</h4>
                      <p className="text-sm text-gray-600">
                        Stage and commit your changes to the branch
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!testFixComplete && <Badge variant="outline" className="text-xs">Test your fix first</Badge>}
                    {gitWorkflowComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 9. Create PR */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                prCreated ? 'border-green-200 bg-green-50' : ''
              } ${!gitWorkflowComplete ? 'opacity-60' : ''}`}
              onClick={() => gitWorkflowComplete && setViewMode('day2-pr')}
              data-testid="card-day2-pr"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <GitPullRequest className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">9. Create Pull Request</h4>
                      <p className="text-sm text-gray-600">
                        Submit your work for review
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!gitWorkflowComplete && <Badge variant="outline" className="text-xs">Commit your changes first</Badge>}
                    {prCreated && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 10. Reflection */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                reflectionComplete ? 'border-green-200 bg-green-50' : ''
              } ${!prCreated ? 'opacity-60' : ''}`}
              onClick={() => prCreated && setViewMode('day2-reflection')}
              data-testid="card-day2-reflection"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <PenLine className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">10. Day 2 Reflection</h4>
                      <p className="text-sm text-gray-600">
                        What did you learn today?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!prCreated && <Badge variant="outline" className="text-xs">Create PR first</Badge>}
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

  // Track when user speaks in standup (moved to useEffect to avoid setState in render)
  const userHasSpokenInStandup = filteredInteractions.some((i: any) => i.sender === 'You' && viewMode === 'day2-standup');
  useEffect(() => {
    if (userHasSpokenInStandup && !standupUserSpoke) {
      setStandupUserSpoke(true);
    }
  }, [userHasSpokenInStandup, standupUserSpoke]);

  function renderDay2Standup() {
    // Use stable state so it doesn't flash during query invalidation
    const userHasSpoken = standupUserSpoke || userHasSpokenInStandup;
    const standupInteractions = filteredInteractions;
    const isUserTurn = standupVisibleMessages >= standupScript.length;

    // If standup is already complete, show a summary instead of regenerating the chat
    if (standupComplete) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-green-100 rounded-full w-fit mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Standup Complete</CardTitle>
              <CardDescription>
                You participated in the morning standup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-teal-50 to-green-50 border border-teal-200 rounded-lg p-4">
                <p className="text-sm text-teal-700">
                  You shared your update with the team and learned what everyone is working on today.
                </p>
              </div>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => setViewMode('overview')}
                data-testid="button-back-to-overview"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Overview
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!standupStarted) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-yellow-100 rounded-full w-fit mb-2">
                <Users className="h-8 w-8 text-yellow-700" />
              </div>
              <CardTitle>Daily Standup</CardTitle>
              <CardDescription>
                Payments Team • 9:00 AM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Standup format:</p>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. What I did yesterday</li>
                  <li>2. What I'm doing today</li>
                  <li>3. Any blockers?</li>
                </ol>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Sarah is starting the meeting. You'll share your update after Marcus.
              </p>
              <Button 
                className="w-full"
                onClick={() => {
                  setStandupStarted(true);
                  setStandupVisibleMessages(1);
                }}
                data-testid="button-join-standup"
              >
                <Play className="h-4 w-4 mr-2" />
                Join Standup
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="h-full flex flex-col">
        {/* Meeting Header */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Daily Standup</h3>
                <p className="text-sm text-gray-600">Payments Team</p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Live
            </Badge>
          </div>
        </div>

        {/* Conversation */}
        <ScrollArea className="flex-1 pr-2 mb-4">
          <div className="space-y-4">
            {standupScript.slice(0, standupVisibleMessages).map((msg, idx) => (
              <div key={idx} className="flex gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={getTeamAvatarUrl(msg.sender)} alt={msg.sender} />
                  <AvatarFallback className={msg.sender === 'Marcus' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}>
                    {msg.sender[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{msg.sender}</span>
                    <Badge variant="outline" className="text-xs py-0 h-5">{msg.role}</Badge>
                  </div>
                  <div className="bg-white border rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-700">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator while script is playing */}
            {standupVisibleMessages > 0 && standupVisibleMessages < standupScript.length && (
              <div className="flex gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={getTeamAvatarUrl(standupScript[standupVisibleMessages].sender)} alt="" />
                  <AvatarFallback className="bg-purple-500 text-white">
                    {standupScript[standupVisibleMessages].sender[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg px-4 py-3 inline-block">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User's messages and responses */}
            {standupInteractions.map((interaction: any, idx: number) => {
              const getSenderRole = (sender: string) => {
                if (sender === 'You') return 'Intern';
                if (sender === 'Sarah') return 'Tech Lead';
                if (sender === 'Marcus') return 'Senior Engineer';
                if (sender === 'Priya') return 'Product Manager';
                if (sender === 'Alex') return 'QA Engineer';
                return interaction.senderRole || 'Team Member';
              };
              
              return (
                <div key={`user-${idx}`} className="flex gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    {interaction.sender === 'You' ? (
                      <AvatarFallback className="bg-teal-500 text-white">
                        {userName?.[0]?.toUpperCase() || 'Y'}
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage src={getTeamAvatarUrl(interaction.sender)} alt={interaction.sender} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {interaction.sender[0]}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {interaction.sender === 'You' ? userName : interaction.sender}
                      </span>
                      <Badge variant="outline" className="text-xs py-0 h-5">
                        {getSenderRole(interaction.sender)}
                      </Badge>
                    </div>
                    <div className={`rounded-lg p-3 shadow-sm ${
                      interaction.sender === 'You' 
                        ? 'bg-teal-50 border border-teal-200' 
                        : 'bg-white border'
                    }`}>
                      <p className="text-sm text-gray-700">{interaction.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {typingIndicator && (
              <div className="flex gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={getTeamAvatarUrl('Sarah')} alt="Sarah" />
                  <AvatarFallback className="bg-blue-500 text-white">S</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg px-4 py-3 inline-block">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Your turn prompt */}
        {isUserTurn && !userHasSpoken && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 text-blue-800">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Your turn!</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Share your update when you're ready.
            </p>
          </div>
        )}

        {/* Input area - show when it's user's turn */}
        {isUserTurn && (
          <div className="flex gap-2 mb-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Yesterday: got set up. Today: working on the timezone bug. Blockers: I have a question about..."
              className="min-h-[70px] resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              data-testid="input-standup-message"
            />
            <Button 
              onClick={() => handleSendMessage()}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="sm"
              className="self-end"
              data-testid="button-send-standup"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Wrap up section - show once user has spoken */}
        {userHasSpoken && (
          <div className="space-y-3">
            {/* Sarah's closing message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={getTeamAvatarUrl('Sarah')} alt="Sarah" />
                  <AvatarFallback className="bg-blue-500 text-white">S</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">Sarah</p>
                  <p className="text-sm text-green-800 mt-1">
                    Thanks {userName}! Good luck with the timezone ticket - ping me or Marcus if you get stuck. Alright everyone, let's have a great day!
                  </p>
                </div>
              </div>
            </div>
            
            {/* Accomplishment */}
            <div className="bg-gradient-to-r from-teal-50 to-green-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-teal-800 mb-2">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                <span className="font-medium">Standup Complete!</span>
              </div>
              <p className="text-sm text-teal-700">
                You participated in your first daily standup. This is how teams stay aligned and unblock each other.
              </p>
            </div>
            
            <Button 
              className="w-full"
              onClick={() => {
                setStandupComplete(true);
                setViewMode('overview');
              }}
              data-testid="button-complete-standup"
            >
              Continue to Dev Setup
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  function renderDay2DevSetup() {
    const setupSteps = [
      { 
        id: 'clone',
        instruction: 'Clone the repository novapay/merchant-dashboard',
        hint: 'Use git clone with the GitHub URL',
        validate: (input: string) => {
          const normalized = input.trim().toLowerCase();
          return normalized.includes('git clone') && 
                 (normalized.includes('novapay/merchant-dashboard') || 
                  normalized.includes('github.com/novapay/merchant-dashboard'));
        },
        successOutput: `Cloning into 'merchant-dashboard'...
remote: Enumerating objects: 1247, done.
remote: Counting objects: 100% (1247/1247), done.
remote: Compressing objects: 100% (892/892), done.
Receiving objects: 100% (1247/1247), 2.34 MiB | 12.5 MiB/s, done.
Resolving deltas: 100% (623/623), done.`
      },
      {
        id: 'cd',
        instruction: 'Navigate into the project directory',
        hint: 'Use cd to change directory',
        validate: (input: string) => {
          const normalized = input.trim().toLowerCase();
          return normalized === 'cd merchant-dashboard' || normalized === 'cd ./merchant-dashboard';
        },
        successOutput: ''
      },
      {
        id: 'install',
        instruction: 'Install the project dependencies',
        hint: 'This project uses npm',
        validate: (input: string) => {
          const normalized = input.trim().toLowerCase();
          return normalized === 'npm install' || normalized === 'npm i';
        },
        successOutput: `added 1423 packages in 8.2s

247 packages are looking for funding
  run \`npm fund\` for details`
      },
      {
        id: 'run',
        instruction: 'Start the development server',
        hint: 'Check the package.json scripts',
        validate: (input: string) => {
          const normalized = input.trim().toLowerCase();
          return normalized === 'npm run dev' || normalized === 'npm start';
        },
        successOutput: `> merchant-dashboard@1.0.0 dev
> vite

  VITE v5.0.0  ready in 342ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose`
      }
    ];

    const currentStep = setupSteps.findIndex(step => !gitInputs[step.id]);
    const allComplete = currentStep === -1;

    const handleCommand = (stepId: string, input: string) => {
      const step = setupSteps.find(s => s.id === stepId);
      if (step && step.validate(input)) {
        setGitInputs(prev => ({ ...prev, [stepId]: input }));
      }
    };

    return (
      <div className="space-y-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Terminal className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Set Up Your Dev Environment</p>
                <p className="text-sm text-blue-700">
                  Before you can work on the code, you need to get it on your machine and running locally.
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
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm space-y-4">
              {setupSteps.map((step, idx) => {
                const isComplete = gitInputs[step.id];
                const isCurrent = idx === currentStep;
                const isFuture = idx > currentStep && currentStep !== -1;

                return (
                  <div key={step.id} className={isFuture ? 'opacity-40' : ''}>
                    <p className="text-gray-400 text-xs mb-1"># {step.instruction}</p>
                    {isComplete ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">$</span>
                          <span className="text-white">{gitInputs[step.id]}</span>
                          <Check className="h-4 w-4 text-green-400 ml-2" />
                        </div>
                        {step.successOutput && (
                          <pre className="text-gray-400 text-xs mt-1 whitespace-pre-wrap">{step.successOutput}</pre>
                        )}
                      </>
                    ) : isCurrent ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">$</span>
                        <input
                          type="text"
                          className="bg-transparent text-white flex-1 outline-none"
                          placeholder="Type your command..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCommand(step.id, e.currentTarget.value);
                            }
                          }}
                          data-testid={`input-setup-${step.id}`}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">$</span>
                        <span className="text-gray-600">...</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {currentStep !== -1 && currentStep < setupSteps.length && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Hint:</strong> {setupSteps[currentStep].hint}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {allComplete && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Dev environment ready!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                The app is running locally. You can see it at http://localhost:5173
              </p>
              <Button 
                className="mt-3"
                onClick={() => {
                  setDevSetupComplete(true);
                  setViewMode('overview');
                }}
                data-testid="button-dev-setup-complete"
              >
                Continue to Review Ticket
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderDay2Ticket() {
    return (
      <div className="space-y-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clipboard className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Review Your Ticket</p>
                <p className="text-sm text-purple-700">
                  Before writing any code, understand exactly what you're building.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-purple-50 border-b border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-orange-100 text-orange-700 border-orange-300">Bug</Badge>
                <Badge variant="outline" className="text-purple-600 border-purple-300">In Progress</Badge>
              </div>
              <span className="text-sm text-gray-500 font-mono">PAY-1234</span>
            </div>
            <CardTitle className="text-lg mt-2">
              Transactions show incorrect time for non-UTC merchants
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
              <p className="text-gray-600 text-sm">
                Merchants in timezones other than UTC see transaction timestamps in UTC instead of their local time. 
                For example, a transaction at 8pm CST shows as 2am the next day, causing confusion during daily reconciliation.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Acceptance Criteria</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded border border-gray-300 mt-0.5" />
                  <span>Transactions display in the merchant's configured timezone</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded border border-gray-300 mt-0.5" />
                  <span>Date filters work correctly with local dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded border border-gray-300 mt-0.5" />
                  <span>Existing tests pass</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-gray-500">Assignee</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-xs bg-teal-100 text-teal-700">Y</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">You</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reporter</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-xs bg-pink-100 text-pink-700">P</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Priya</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Priority</p>
                <Badge variant="outline" className="mt-1 text-orange-600 border-orange-300">Medium</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sprint</p>
                <span className="text-sm">Sprint 14</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">Files to investigate</p>
              <div className="font-mono text-xs text-blue-700 space-y-1">
                <p>client/src/utils/dateFormatters.ts</p>
                <p>client/src/components/TransactionList.tsx</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full"
          onClick={() => {
            setTicketReviewed(true);
            setViewMode('overview');
          }}
          data-testid="button-ticket-reviewed"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          I understand the ticket - Continue to Create Branch
        </Button>
      </div>
    );
  }

  function renderDay2CreateBranch() {
    const validateBranchName = (name: string) => {
      const normalized = name.trim().toLowerCase();
      if (!normalized) return { valid: false, error: 'Enter a branch name' };
      if (normalized === 'main' || normalized === 'master') {
        return { valid: false, error: "Don't work on main/master directly!" };
      }
      if (!/^[a-z0-9][a-z0-9\-\/]*[a-z0-9]$/.test(normalized) && normalized.length > 1) {
        return { valid: false, error: 'Use lowercase letters, numbers, hyphens, or slashes' };
      }
      if (normalized.includes('fix') || normalized.includes('timezone') || normalized.includes('bug')) {
        return { valid: true, error: '' };
      }
      return { valid: true, error: '' };
    };

    const handleCreateBranch = () => {
      const result = validateBranchName(branchInput);
      if (!result.valid) {
        setBranchError(result.error);
        return;
      }
      setBranchError('');
      setBranchSuccess(true);
    };

    if (branchCreated) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <Card className="max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-green-100 rounded-full w-fit mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Branch Created</CardTitle>
              <CardDescription>
                You're now working on your feature branch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-cyan-50 to-green-50 border border-cyan-200 rounded-lg p-4">
                <p className="text-sm text-cyan-700">
                  All your changes will be isolated from the main branch until your PR is merged.
                </p>
              </div>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => setViewMode('overview')}
                data-testid="button-back-to-overview"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Overview
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Card className="bg-cyan-50 border-cyan-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-cyan-600" />
              <div>
                <p className="font-medium text-cyan-900">Create a Feature Branch</p>
                <p className="text-sm text-cyan-700">
                  Before making any changes, create a branch to isolate your work.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why Create a Branch?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <span className="text-sm text-gray-700">Your changes are isolated from main</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <span className="text-sm text-gray-700">You can experiment without affecting others</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <span className="text-sm text-gray-700">Easy to abandon if your approach doesn't work</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <span className="text-sm text-gray-700">Your PR shows exactly what changed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Create Your Branch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <div className="text-gray-400 mb-2">$ git checkout -b <span className="text-cyan-400">[branch-name]</span></div>
              <p className="text-gray-500 text-xs mt-2">
                Common patterns: fix/timezone-bug, feature/user-auth, bugfix/payment-error
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Enter your git command:</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">$</span>
                  <input
                    type="text"
                    value={branchInput}
                    onChange={(e) => {
                      setBranchInput(e.target.value);
                      setBranchError('');
                      setBranchSuccess(false);
                    }}
                    placeholder="git checkout -b fix/timezone-bug"
                    className="w-full pl-7 pr-3 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    data-testid="input-branch-name"
                  />
                </div>
                <Button 
                  onClick={handleCreateBranch}
                  disabled={!branchInput.trim()}
                  data-testid="button-create-branch"
                >
                  Run
                </Button>
              </div>
              {branchError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-4 w-4" />
                  {branchError}
                </p>
              )}
            </div>

            {branchSuccess && (
              <div className="space-y-3">
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400">
                  <p>Switched to a new branch '{branchInput.replace('git checkout -b ', '').trim()}'</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Branch created successfully!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    You're now on your feature branch. All changes will be isolated here.
                  </p>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    setBranchCreated(true);
                    setViewMode('overview');
                  }}
                  data-testid="button-branch-complete"
                >
                  Continue to Explore Codebase
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
                    Continue to Test Your Fix
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

  function renderDay2TestFix() {
    return (
      <div className="space-y-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Play className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Test Your Fix</p>
                <p className="text-sm text-green-700">
                  Before committing, always verify your changes work in the browser.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Merchant Dashboard - Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-2 flex items-center gap-2 border-b">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded px-2 py-1 text-xs text-gray-500">
                  localhost:5173/transactions
                </div>
              </div>
              
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
                  <Badge variant="outline">Maria's Coffee Shop (CST)</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div>
                      <p className="font-medium">$24.50 - Card Payment</p>
                      <p className={`text-sm ${testState === 'after' ? 'text-green-600' : 'text-red-600'}`}>
                        {testState === 'after' ? 'Feb 14, 8:30 PM CST' : 'Feb 15, 2:30 AM UTC'}
                      </p>
                    </div>
                    {testState === 'after' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {testState === 'before' && <X className="h-5 w-5 text-red-400" />}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div>
                      <p className="font-medium">$8.75 - Card Payment</p>
                      <p className={`text-sm ${testState === 'after' ? 'text-green-600' : 'text-red-600'}`}>
                        {testState === 'after' ? 'Feb 14, 7:15 PM CST' : 'Feb 15, 1:15 AM UTC'}
                      </p>
                    </div>
                    {testState === 'after' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {testState === 'before' && <X className="h-5 w-5 text-red-400" />}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div>
                      <p className="font-medium">$15.00 - Card Payment</p>
                      <p className={`text-sm ${testState === 'after' ? 'text-green-600' : 'text-red-600'}`}>
                        {testState === 'after' ? 'Feb 14, 6:45 PM CST' : 'Feb 15, 12:45 AM UTC'}
                      </p>
                    </div>
                    {testState === 'after' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {testState === 'before' && <X className="h-5 w-5 text-red-400" />}
                  </div>
                </div>
              </div>
            </div>

            {testState === 'before' && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Bug visible:</strong> Transactions show UTC time (next day at 2am) instead of Maria's local CST time (8pm same day).
                </p>
              </div>
            )}

            {testState === 'running' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                <p className="text-sm text-blue-800">Refreshing with your fix...</p>
              </div>
            )}

            {testState === 'after' && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Fix working!</strong> Transactions now show in Maria's local timezone (CST). The dates make sense for her daily reconciliation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {testState === 'before' && (
          <Button 
            className="w-full"
            onClick={() => {
              setTestState('running');
              setTimeout(() => setTestState('after'), 1500);
            }}
            data-testid="button-run-test"
          >
            <Play className="h-4 w-4 mr-2" />
            Refresh Page to Test Fix
          </Button>
        )}

        {testState === 'after' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Your fix works!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Time to save your work with git and create a pull request.
              </p>
              <Button 
                className="mt-3"
                onClick={() => {
                  setTestFixComplete(true);
                  setViewMode('overview');
                }}
                data-testid="button-test-complete"
              >
                Continue to Git Workflow
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderDay2Git() {
    const gitSteps = [
      { 
        id: 'add',
        instruction: 'Stage your changes for commit',
        hint: 'Use git add to include the files you modified',
        validate: (input: string) => {
          const normalized = input.trim().toLowerCase();
          return normalized === 'git add .' || 
                 normalized === 'git add -a' || 
                 normalized.includes('git add') && normalized.includes('dateformatter');
        },
        successOutput: ''
      },
      {
        id: 'commit',
        instruction: 'Commit your changes with a message describing what you fixed',
        hint: 'Use git commit -m "your descriptive message"',
        validate: (input: string) => {
          const normalized = input.trim().toLowerCase();
          return normalized.startsWith('git commit -m') && 
                 (input.includes('"') || input.includes("'")) &&
                 (normalized.includes('timezone') || normalized.includes('fix') || normalized.includes('date'));
        },
        successOutput: `[fix/timezone-display abc1234] Fix timezone display for merchant transactions
 1 file changed, 2 insertions(+), 2 deletions(-)`
      },
      {
        id: 'push',
        instruction: 'Push your branch to the remote repository',
        hint: 'Use git push origin followed by your branch name',
        validate: (input: string) => {
          const normalized = input.trim().toLowerCase();
          return normalized.startsWith('git push');
        },
        successOutput: `Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), 312 bytes | 312.00 KiB/s, done.
remote: Create a pull request:
remote:   https://github.com/novapay/merchant-dashboard/pull/new/fix/timezone-display`
      }
    ];

    const currentStepIdx = gitSteps.findIndex(step => !gitInputs[step.id]);
    const allComplete = currentStepIdx === -1;

    const handleGitCommand = (stepId: string, input: string) => {
      const step = gitSteps.find(s => s.id === stepId);
      if (step && step.validate(input)) {
        setGitInputs(prev => ({ ...prev, [stepId]: input }));
      }
    };

    return (
      <div className="space-y-4">
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GitCommit className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Git Workflow</p>
                <p className="text-sm text-gray-700">
                  Save your work by staging, committing, and pushing your changes.
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
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm space-y-4">
              {gitSteps.map((step, idx) => {
                const isComplete = gitInputs[step.id];
                const isCurrent = idx === currentStepIdx;
                const isFuture = idx > currentStepIdx && currentStepIdx !== -1;

                return (
                  <div key={step.id} className={isFuture ? 'opacity-40' : ''}>
                    <p className="text-gray-400 text-xs mb-1"># {step.instruction}</p>
                    {isComplete ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">$</span>
                          <span className="text-white">{gitInputs[step.id]}</span>
                          <Check className="h-4 w-4 text-green-400 ml-2" />
                        </div>
                        {step.successOutput && (
                          <pre className="text-gray-400 text-xs mt-1 whitespace-pre-wrap">{step.successOutput}</pre>
                        )}
                      </>
                    ) : isCurrent ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">$</span>
                        <input
                          type="text"
                          className="bg-transparent text-white flex-1 outline-none"
                          placeholder="Type your command..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleGitCommand(step.id, e.currentTarget.value);
                            }
                          }}
                          data-testid={`input-git-${step.id}`}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">$</span>
                        <span className="text-gray-600">...</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {currentStepIdx !== -1 && currentStepIdx < gitSteps.length && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Hint:</strong> {gitSteps[currentStepIdx].hint}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {allComplete && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Changes pushed!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your code is now on GitHub. Time to create a pull request for review.
              </p>
              <Button 
                className="mt-3"
                onClick={() => {
                  setGitWorkflowComplete(true);
                  setViewMode('overview');
                }}
                data-testid="button-git-complete"
              >
                Continue to Create PR
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderDay2PR() {
    const isValidPR = prTitle.trim().length > 10 && prDescriptionLocal.trim().length > 20;

    return (
      <div className="space-y-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GitPullRequest className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Create Pull Request</p>
                <p className="text-sm text-purple-700">
                  A good PR helps reviewers understand your changes quickly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!prSubmittedLocal ? (
          <Card>
            <CardHeader className="pb-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <GitPullRequest className="h-5 w-5 text-green-600" />
                <span className="font-medium">Open a pull request</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <Badge variant="outline" className="text-xs">fix/timezone-display</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline" className="text-xs">main</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <Input
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  placeholder="Fix timezone display for merchant transactions"
                  data-testid="input-pr-title"
                />
                <p className="text-xs text-gray-500 mt-1">Summarize what this PR does</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Textarea
                  value={prDescriptionLocal}
                  onChange={(e) => setPrDescriptionLocal(e.target.value)}
                  placeholder={`## What changed
- Updated formatTransactionDate to use merchant's timezone

## Why
Merchants were seeing transactions in UTC instead of their local time, causing confusion during reconciliation.

## Testing
Tested with CST timezone, transactions now display correctly.`}
                  className="min-h-[150px] font-mono text-sm"
                  data-testid="input-pr-description"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-gray-500">
                  Reviewers: Sarah (auto-assigned)
                </div>
                <Button 
                  disabled={!isValidPR}
                  onClick={() => setPrSubmittedLocal(true)}
                  data-testid="button-create-pr"
                >
                  Create Pull Request
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800 mb-3">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Pull Request Created!</span>
              </div>
              
              <div className="bg-white rounded-lg p-4 border mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <GitPullRequest className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-gray-900">{prTitle || 'Fix timezone display'}</span>
                  <Badge className="bg-green-100 text-green-700 text-xs">Open</Badge>
                </div>
                <p className="text-sm text-gray-600">#47 opened just now by you</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    0 comments
                  </span>
                  <span className="flex items-center gap-1">
                    <File className="h-3 w-3" />
                    1 file changed
                  </span>
                </div>
              </div>

              <p className="text-sm text-green-700">
                Sarah will review this tomorrow morning. Great work on your first PR!
              </p>
              <Button 
                className="mt-3"
                onClick={() => {
                  setPrCreated(true);
                  setViewMode('overview');
                }}
                data-testid="button-pr-complete"
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
          {/* Chat Header - styled like standup */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedMember(null)}
                  className="mr-1"
                  data-testid="button-back-to-team-list"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                  <AvatarImage src={getTeamAvatarUrl(selectedMember.name)} alt={selectedMember.name} />
                  <AvatarFallback className={`text-white ${getTeamMemberColor(selectedMember.name)}`}>
                    {getTeamMemberInitials(selectedMember.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{selectedMember.name}</h3>
                    <Badge variant="outline" className="text-xs py-0 h-5">{selectedMember.role}</Badge>
                  </div>
                  <p className="text-xs text-gray-600">Direct Message</p>
                </div>
              </div>
              {introProgress[selectedMember.name] && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Introduced
                </Badge>
              )}
            </div>
          </div>

          {selectedMember.bio && (
            <Card className="mb-4 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
              <CardContent className="p-3 text-sm text-gray-700">
                <p className="text-xs font-medium text-gray-500 mb-1">About {selectedMember.name}</p>
                {selectedMember.bio}
              </CardContent>
            </Card>
          )}

          {/* Messages - styled like standup */}
          <ScrollArea className="flex-1 pr-2 mb-4">
            <div className="space-y-4">
              {filteredInteractions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Coffee className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Say hello to {selectedMember.name}!</p>
                  <p className="text-sm">Introduce yourself and ask about their role.</p>
                </div>
              )}
              {filteredInteractions.map((interaction: any, idx: number) => {
                const isUserMsg = interaction.sender === 'You' || interaction.sender === 'User';
                return (
                <div key={idx} className="flex gap-3" data-testid={`message-${idx}`}>
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage 
                      src={isUserMsg 
                        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=user-intern&backgroundColor=b6e3f4`
                        : getTeamAvatarUrl(interaction.sender)
                      } 
                      alt={interaction.sender} 
                    />
                    <AvatarFallback className={`text-white text-xs ${
                      isUserMsg ? 'bg-blue-500' : getTeamMemberColor(interaction.sender)
                    }`}>
                      {isUserMsg ? 'ME' : getTeamMemberInitials(interaction.sender)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {isUserMsg ? 'You' : interaction.sender}
                      </span>
                      <Badge variant="outline" className="text-xs py-0 h-5">
                        {isUserMsg ? 'Intern' : selectedMember.role}
                      </Badge>
                    </div>
                    <div className={`rounded-lg p-3 shadow-sm ${
                      isUserMsg
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-white border'
                    }`}>
                      <p className="text-sm text-gray-700">{interaction.content}</p>
                    </div>
                  </div>
                </div>
              );})}
              {typingIndicator && (
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={getTeamAvatarUrl(typingIndicator)} alt={typingIndicator} />
                    <AvatarFallback className={`text-white text-xs ${getTeamMemberColor(typingIndicator)}`}>
                      {getTeamMemberInitials(typingIndicator)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{typingIndicator}</span>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 inline-block">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area or Completion Card */}
          {closedConversations[selectedMember.name] ? (
            <div className="border-t pt-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">Intro Complete!</h4>
                    <p className="text-sm text-green-600">You've met {selectedMember.name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      // Notify backend to reopen the channel
                      try {
                        const response = await apiRequest("POST", `/api/workspace/${session.id}/reopen-channel`, {
                          channel: `dm-${selectedMember.name}`
                        });
                        const result = await response.json();
                        if (result.success) {
                          setClosedConversations(prev => ({ ...prev, [selectedMember.name]: false }));
                        } else {
                          console.error('Failed to reopen channel:', result.message);
                        }
                      } catch (error) {
                        console.error('Failed to reopen channel:', error);
                        // Still allow local reopen even if backend fails
                        setClosedConversations(prev => ({ ...prev, [selectedMember.name]: false }));
                      }
                    }}
                    data-testid="button-reopen-chat"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Reopen Chat
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setSelectedMember(null);
                      // Find next team member to meet
                      const teamMembersToMeet = teamMembers.filter((m: TeamMember) => m.name !== 'Sarah');
                      const nextMember = teamMembersToMeet.find((m: TeamMember) => !closedConversations[m.name]);
                      if (nextMember) {
                        setTimeout(() => startTeamIntro(nextMember), 300);
                      }
                    }}
                    data-testid="button-next-teammate"
                  >
                    {teamMembers.filter((m: TeamMember) => m.name !== 'Sarah').every((m: TeamMember) => closedConversations[m.name] || m.name === selectedMember.name) 
                      ? 'All Done!' 
                      : 'Meet Next Teammate'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Message ${selectedMember.name}...`}
                  className="min-h-[60px] resize-none bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  data-testid="input-message"
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="self-end"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Your Team</h3>
          <Badge variant="outline">
            {completedIntroCount}/{teamMembersToMeet.length} introduced
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          Meet your teammates! Sarah (your lead) will check in with you after you've read the docs.
        </p>
        
        <div className="grid gap-3">
          {teamMembersToMeet.map((member: TeamMember, idx: number) => (
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
                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                      <AvatarImage src={getTeamAvatarUrl(member.name)} alt={member.name} />
                      <AvatarFallback className={`text-white ${getTeamMemberColor(member.name)}`}>
                        {getTeamMemberInitials(member.name)}
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
    docSectionsRead['norms'] && 
    docSectionsRead['workflow']
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
            <TabsTrigger value="howwework" className="flex items-center gap-2" data-testid="tab-howwework">
              <Users className="h-4 w-4" />
              How We Work
              {docSectionsRead['norms'] && docSectionsRead['workflow'] && (
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
                        <p className="text-sm text-orange-700">2 of 4 sections done. Learn how the team works next.</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setActiveDocTab('howwework');
                        setTimeout(() => {
                          docsScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                      data-testid="button-continue-howwework"
                    >
                      Continue to How We Work
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="howwework" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-900">How the Team Works</p>
                    <p className="text-sm text-purple-800">
                      Before diving into code, learn how we collaborate, communicate, and ship features together.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Collapsible open={expandedSections['norms']} onOpenChange={(open) => toggleSection('norms', open)}>
              <Card>
                <CollapsibleTrigger className="w-full" data-testid="section-norms">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-purple-600" />
                        Team Norms & Culture
                        {docSectionsRead['norms'] && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      {expandedSections['norms'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <p className="text-gray-700">
                      Every team has its own rhythm. Here's how we work together at NovaPay.
                    </p>

                    <div className="grid gap-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Daily Standup at 10am</p>
                          <p className="text-sm text-blue-800">Quick 15-min sync. Share what you did, what you're doing, and any blockers.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <MessageCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900">Ask Early, Ask Often</p>
                          <p className="text-sm text-green-800">Stuck for more than 15 minutes? Reach out. No question is too small.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <GitPullRequest className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900">Reviews = Learning</p>
                          <p className="text-sm text-amber-800">Code review feedback is about the code, not about you. It's how we all improve.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <PenLine className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-purple-900">Document As You Go</p>
                          <p className="text-sm text-purple-800">Comments and READMEs save future headaches. Write for future-you.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">Communication Channels:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• <strong>Slack #team-payments</strong> - Day-to-day team chat</li>
                        <li>• <strong>Slack DMs</strong> - Quick questions to individuals</li>
                        <li>• <strong>GitHub PRs</strong> - Code discussions and reviews</li>
                        <li>• <strong>Notion</strong> - Documentation and specs</li>
                      </ul>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={expandedSections['workflow']} onOpenChange={(open) => toggleSection('workflow', open)}>
              <Card>
                <CollapsibleTrigger className="w-full" data-testid="section-workflow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-teal-600" />
                        Development Flow
                        {docSectionsRead['workflow'] && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      {expandedSections['workflow'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <p className="font-medium text-gray-900 mb-3">How We Ship Features:</p>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <Badge variant="outline" className="flex items-center gap-1 bg-gray-50">
                          <span className="text-gray-500">1</span> Pick ticket
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
                          <span className="text-blue-600">2</span> Branch
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1 bg-purple-50">
                          <span className="text-purple-600">3</span> Code
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1 bg-amber-50">
                          <span className="text-amber-600">4</span> PR
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1 bg-orange-50">
                          <span className="text-orange-600">5</span> Review
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1 bg-green-100">
                          <span className="text-green-700">6</span> Merge
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="font-medium text-gray-900 mb-3">Our Codebase:</p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Folder className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">Repository: novapay/merchant-dashboard</p>
                            <p className="text-sm text-gray-600">Monorepo with client, server, and shared code</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                          <div className="p-2 bg-white rounded border">
                            <FolderOpen className="h-3 w-3 inline mr-1 text-blue-500" />
                            client/
                            <p className="text-gray-500 mt-1">React frontend</p>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <FolderOpen className="h-3 w-3 inline mr-1 text-green-500" />
                            server/
                            <p className="text-gray-500 mt-1">Node.js API</p>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <FolderOpen className="h-3 w-3 inline mr-1 text-purple-500" />
                            shared/
                            <p className="text-gray-500 mt-1">Types & utils</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-medium text-blue-900 mb-2">Conventions:</p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• <strong>Branch names:</strong> fix/description or feature/description</li>
                        <li>• <strong>Commits:</strong> Clear, descriptive messages ("Fix timezone display in transactions")</li>
                        <li>• <strong>PRs:</strong> Include what, why, and how to test</li>
                        <li>• <strong>Comments:</strong> Explain the "why", not the "what"</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900 mb-2">Who to Ask:</p>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">S</AvatarFallback>
                          </Avatar>
                          <span><strong>Sarah</strong> - Code questions, PR reviews, architecture</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-pink-100 text-pink-700">P</AvatarFallback>
                          </Avatar>
                          <span><strong>Priya</strong> - Requirements, user context, priorities</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-green-100 text-green-700">M</AvatarFallback>
                          </Avatar>
                          <span><strong>Marcus</strong> - Tricky bugs, system design</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-orange-100 text-orange-700">A</AvatarFallback>
                          </Avatar>
                          <span><strong>Alex</strong> - Testing, QA process, edge cases</span>
                        </div>
                      </div>
                    </div>

                    <Collapsible>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg text-white hover:bg-gray-800 transition-colors">
                          <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4 text-green-400" />
                            <span className="text-sm font-medium">Quick Reference: Git Commands</span>
                          </div>
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="bg-gray-900 rounded-b-lg p-4 font-mono text-sm text-green-400 -mt-2 border-t border-gray-700">
                          <pre className="whitespace-pre-wrap">{`# Start a new feature:
git checkout main
git pull origin main
git checkout -b fix/your-feature-name

# Save your work:
git add .
git commit -m "Your descriptive message"

# Push and create PR:
git push origin fix/your-feature-name
# Then open a PR on GitHub`}</pre>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
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
    const isUserMessage = (sender: string) => sender === 'You' || sender === 'User';
    
    return (
      <div className="h-full flex flex-col">
        <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                <AvatarImage src={getTeamAvatarUrl('Sarah')} alt="Sarah" />
                <AvatarFallback className="bg-blue-500 text-white font-semibold">S</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-blue-900">Check in with Sarah</p>
                <p className="text-sm text-blue-700">
                  Share what you've learned from the documentation. This is a casual chat, not a test!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4 px-1">
            {/* Always show Sarah's initial greeting as the first message */}
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 mt-1 ring-1 ring-gray-200 shadow-sm flex-shrink-0">
                <AvatarImage src={getTeamAvatarUrl('Sarah')} alt="Sarah" />
                <AvatarFallback className="bg-blue-500 text-white text-xs">S</AvatarFallback>
              </Avatar>
              <div className="flex-1 max-w-[85%]">
                <p className="text-xs font-medium text-blue-600 mb-1">Sarah</p>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="text-gray-800 leading-relaxed">
                    Hey! I see you've been reading through the docs. Before we get you started on anything, I just want to make sure we're on the same page. What's your understanding of what our Merchant Dashboard does?
                  </p>
                </div>
              </div>
            </div>
            {filteredInteractions.map((interaction: any, idx: number) => (
              <div
                key={idx}
                className={`flex ${isUserMessage(interaction.sender) ? 'justify-end' : 'items-start gap-3'}`}
                data-testid={`comprehension-message-${idx}`}
              >
                {!isUserMessage(interaction.sender) && (
                  <Avatar className="h-8 w-8 mt-1 ring-1 ring-gray-200 shadow-sm flex-shrink-0">
                    <AvatarImage src={getTeamAvatarUrl('Sarah')} alt="Sarah" />
                    <AvatarFallback className="bg-blue-500 text-white text-xs">S</AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col ${isUserMessage(interaction.sender) ? 'items-end' : 'flex-1 max-w-[85%]'}`}>
                  {!isUserMessage(interaction.sender) && (
                    <p className="text-xs font-medium text-blue-600 mb-1">Sarah</p>
                  )}
                  <div
                    className={`px-4 py-3 ${
                      isUserMessage(interaction.sender)
                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm max-w-[85%] shadow-sm'
                        : 'bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm'
                    }`}
                  >
                    <p className={`leading-relaxed ${isUserMessage(interaction.sender) ? 'text-white' : 'text-gray-800'}`}>
                      {interaction.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {typingIndicator && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 mt-1 ring-1 ring-gray-200 shadow-sm flex-shrink-0">
                  <AvatarImage src={getTeamAvatarUrl('Sarah')} alt="Sarah" />
                  <AvatarFallback className="bg-blue-500 text-white text-xs">S</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-blue-600 mb-1">Sarah</p>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="space-y-3 bg-gray-50 -mx-4 -mb-4 px-4 py-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your response to Sarah..."
              className="min-h-[60px] resize-none bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(sarah);
                }
              }}
              data-testid="input-comprehension-message"
            />
            <Button 
              onClick={() => handleSendMessage(sarah)}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="px-4"
              data-testid="button-send-comprehension-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Show Complete button after meaningful exchange (at least 3 user messages to Sarah) */}
          {(() => {
            const userMessages = filteredInteractions.filter((i: any) => 
              i.sender === 'You' || i.sender === 'User'
            );
            return userMessages.length >= 3 && !comprehensionComplete;
          })() && (
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
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
            {/* Only show "Continue to next day" in journey mode, and only for implemented days (1-2) */}
            {dayProgress >= 80 && currentDay < 5 && mode === 'journey' && currentDay < 2 && (
              <Button 
                size="sm"
                onClick={() => setCurrentDay(currentDay + 1)}
                data-testid="button-next-day"
              >
                Continue to Day {currentDay + 1}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {/* Show completion message when day is complete in practice mode */}
            {dayProgress >= 80 && mode === 'practice' && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Day Complete!
              </Badge>
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
                          (idx === 1 && allTeamMet) ||
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
                  {viewMode === 'day2-dev-setup' && renderDay2DevSetup()}
                  {viewMode === 'day2-ticket' && renderDay2Ticket()}
                  {viewMode === 'day2-branch' && renderDay2CreateBranch()}
                  {viewMode === 'day2-codebase' && renderDay2Codebase()}
                  {viewMode === 'day2-code-fix' && renderDay2CodeFix()}
                  {viewMode === 'day2-test-fix' && renderDay2TestFix()}
                  {viewMode === 'day2-git' && renderDay2Git()}
                  {viewMode === 'day2-pr' && renderDay2PR()}
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

      {/* All Team Intros Complete Dialog */}
      <Dialog open={showAllIntrosComplete} onOpenChange={(open) => {
        setShowAllIntrosComplete(open);
        if (!open) setIntrosDialogDismissed(true);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <DialogTitle className="text-xl">You've Met the Team!</DialogTitle>
              <DialogDescription className="mt-2">
                Great job! You've introduced yourself to all your teammates. They're excited to work with you!
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="space-y-3 my-4">
            <div className="flex flex-wrap justify-center gap-2">
              {teamMembers.filter((m: TeamMember) => m.name !== 'Sarah').map((member: TeamMember, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-full pl-1 pr-3 py-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={getTeamAvatarUrl(member.name)} alt={member.name} />
                    <AvatarFallback className={`text-white text-xs ${getTeamMemberColor(member.name)}`}>
                      {getTeamMemberInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{member.name}</span>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Next up:</strong> Sarah wants to do a quick comprehension check to make sure you're ready for tomorrow.
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAllIntrosComplete(false);
                setIntrosDialogDismissed(true);
                setSelectedMember(null);
                setViewMode('overview');
              }}
              data-testid="button-back-to-overview"
            >
              Back to Overview
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setShowAllIntrosComplete(false);
                setIntrosDialogDismissed(true);
                setSelectedMember(null);
                setViewMode('comprehension-check');
              }}
              data-testid="button-go-to-comprehension"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with Sarah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Team Chat - hidden during structured conversations */}
      {/* Hide during: team-intro (has its own chat), comprehension-check (Sarah chat), day2-standup (Sarah chat) */}
      {!['team-intro', 'comprehension-check', 'day2-standup'].includes(viewMode) && (
        <FloatingTeamChat
          isOpen={floatingChatOpen}
          onToggle={handleFloatingChatToggle}
          teamMembers={teamMembers}
          activeChatMember={floatingChatMember}
          onSelectMember={setFloatingChatMember}
          message={floatingChatMessage}
          onMessageChange={setFloatingChatMessage}
          onSendMessage={handleFloatingChatSend}
          isSending={floatingChatMutation.isPending}
          interactions={Array.isArray(interactions) ? interactions : []}
          typingIndicator={floatingTypingIndicator}
        />
      )}
    </div>
  );
}
