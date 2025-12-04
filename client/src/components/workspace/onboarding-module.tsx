import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  Clock,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Store,
  Send,
  Play,
  Target,
  Coffee
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspacePhase } from "@/hooks/use-sprint-workflow";

interface TeamMember {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  availability: string;
  bio?: string;
}

interface OnboardingProgress {
  teamIntrosComplete: Record<string, boolean>;
  docsRead: Record<string, boolean>;
  comprehensionComplete: boolean;
}

interface OnboardingModuleProps {
  workspaceId: number;
  userId: number;
  companyName: string;
  role: string;
  onComplete: () => void;
  onBack?: () => void;
}

const DEFAULT_TEAM: TeamMember[] = [
  {
    name: "Marcus",
    role: "Senior Developer",
    personality: "Detail-oriented and patient",
    expertise: ["Backend", "Databases", "Performance"],
    availability: "Prefers async communication",
    bio: "Marcus is the go-to person for complex backend issues and database optimization."
  },
  {
    name: "Priya",
    role: "Product Manager",
    personality: "Energetic and clear communicator",
    expertise: ["Requirements", "User Research", "Prioritization"],
    availability: "Available for quick syncs",
    bio: "Priya bridges the gap between business needs and technical implementation."
  },
  {
    name: "Alex",
    role: "QA Engineer",
    personality: "Thorough and helpful",
    expertise: ["Testing", "Bug Reports", "Automation"],
    availability: "Best reached via Slack",
    bio: "Alex ensures our code quality stays high and catches issues before they reach users."
  }
];

const DOCUMENTATION_SECTIONS = [
  { id: "product", title: "Product Overview", icon: Store, description: "Learn what we build and why" },
  { id: "users", title: "Our Users", icon: Users, description: "Understand who uses our product" },
  { id: "norms", title: "Team Norms", icon: MessageSquare, description: "How we work together" },
  { id: "workflow", title: "Development Workflow", icon: Target, description: "Our development process" }
];

function getAvatarUrl(name: string) {
  const avatarSeeds: Record<string, { seed: string; style: string }> = {
    'Sarah': { seed: 'sarah-tech-lead', style: 'avataaars' },
    'Marcus': { seed: 'marcus-senior-dev', style: 'avataaars' },
    'Priya': { seed: 'priya-product-mgr', style: 'avataaars' },
    'Alex': { seed: 'alex-qa-engineer', style: 'avataaars' }
  };
  const config = avatarSeeds[name] || { seed: name, style: 'avataaars' };
  return `https://api.dicebear.com/7.x/${config.style}/svg?seed=${config.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function getMemberColor(name: string) {
  const colors: Record<string, string> = {
    'Sarah': 'bg-blue-500',
    'Marcus': 'bg-green-500',
    'Priya': 'bg-purple-500',
    'Alex': 'bg-orange-500'
  };
  return colors[name] || 'bg-gray-500';
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

type OnboardingStep = 'overview' | 'team-intro' | 'documentation' | 'comprehension';

export function OnboardingModule({ 
  workspaceId, 
  userId, 
  companyName, 
  role,
  onComplete,
  onBack 
}: OnboardingModuleProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('overview');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [activeDocTab, setActiveDocTab] = useState<string>('product');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; message: string }>>([]);
  const [teamChatMessages, setTeamChatMessages] = useState<Record<string, Array<{ sender: string; message: string }>>>({});
  const [teamChatInput, setTeamChatInput] = useState('');
  const [isAIResponding, setIsAIResponding] = useState(false);
  
  const [progress, setProgress] = useState<OnboardingProgress>({
    teamIntrosComplete: {},
    docsRead: {},
    comprehensionComplete: false
  });

  const { data: workspace } = useQuery<{ workspaceMetadata?: { onboardingProgress?: OnboardingProgress } }>({
    queryKey: [`/api/workspaces/${workspaceId}`],
  });

  useEffect(() => {
    if (workspace?.workspaceMetadata?.onboardingProgress) {
      const savedProgress = workspace.workspaceMetadata.onboardingProgress;
      setProgress(savedProgress);
      if (savedProgress.docsRead) {
        setExpandedDocs(savedProgress.docsRead);
      }
    }
  }, [workspace]);

  const saveProgressMutation = useMutation({
    mutationFn: async (newProgress: OnboardingProgress) => {
      return apiRequest('PATCH', `/api/workspaces/${workspaceId}`, {
        workspaceMetadata: {
          ...(workspace?.workspaceMetadata || {}),
          onboardingProgress: newProgress
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}`] });
    }
  });

  const updateProgress = (newProgress: OnboardingProgress) => {
    setProgress(newProgress);
    saveProgressMutation.mutate(newProgress);
  };

  const teamIntroCount = Object.values(progress.teamIntrosComplete).filter(Boolean).length;
  const docsReadCount = Object.values(progress.docsRead).filter(Boolean).length;
  const allTeamIntrosComplete = teamIntroCount >= DEFAULT_TEAM.length;
  const allDocsRead = docsReadCount >= DOCUMENTATION_SECTIONS.length;
  
  const overallProgress = (
    (teamIntroCount / DEFAULT_TEAM.length) * 33 +
    (docsReadCount / DOCUMENTATION_SECTIONS.length) * 33 +
    (progress.comprehensionComplete ? 34 : 0)
  );

  const completePhase = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/workspaces/${workspaceId}/phase`, {
        newPhase: 'planning' as WorkspacePhase,
        status: 'completed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', workspaceId] });
      onComplete();
    }
  });

  const handleTeamIntroComplete = (memberName: string) => {
    const newProgress = {
      ...progress,
      teamIntrosComplete: { ...progress.teamIntrosComplete, [memberName]: true }
    };
    updateProgress(newProgress);
    setSelectedMember(null);
  };

  const handleDocRead = (docId: string) => {
    const newProgress = {
      ...progress,
      docsRead: { ...progress.docsRead, [docId]: true }
    };
    updateProgress(newProgress);
    setExpandedDocs(prev => ({ ...prev, [docId]: true }));
  };

  const handleComprehensionComplete = () => {
    const newProgress = { ...progress, comprehensionComplete: true };
    updateProgress(newProgress);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    setChatHistory(prev => [
      ...prev,
      { sender: 'You', message: chatMessage },
      { sender: 'Sarah', message: getSarahResponse(chatMessage, chatHistory.length) }
    ]);
    setChatMessage('');
    
    if (chatHistory.length >= 2) {
      handleComprehensionComplete();
    }
  };

  const getSarahResponse = (userMessage: string, messageCount: number): string => {
    if (messageCount === 0) {
      return "That's a great understanding! You've clearly been paying attention to the docs. The timezone handling is definitely critical for our merchants who operate across different regions. Any other questions about the codebase or the team?";
    }
    return "Perfect! I think you're ready to move on. Tomorrow we'll get you set up with your development environment and you'll start working on your first ticket. Exciting times ahead! Feel free to reach out if you need anything.";
  };

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [teamChatMessages, isAIResponding]);

  const handleTeamChatSend = async () => {
    if (!teamChatInput.trim() || !selectedMember || isAIResponding) return;
    
    const memberName = selectedMember.name;
    const currentMessages = teamChatMessages[memberName] || [];
    const userMessageText = teamChatInput;
    
    const newUserMessage = { sender: 'You', message: userMessageText };
    setTeamChatMessages(prev => ({
      ...prev,
      [memberName]: [...(prev[memberName] || []), newUserMessage]
    }));
    setTeamChatInput('');
    setIsAIResponding(true);

    try {
      const res = await apiRequest('POST', `/api/workspaces/${workspaceId}/onboarding-chat`, {
        teamMemberName: memberName,
        userMessage: userMessageText,
        conversationHistory: [...currentMessages, newUserMessage]
      });
      const data = await res.json();
      
      // Add a realistic typing delay (1-2 seconds) before showing response
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const aiResponse = { sender: memberName, message: data.response };
      setTeamChatMessages(prev => ({
        ...prev,
        [memberName]: [...(prev[memberName] || []), aiResponse]
      }));
    } catch (error) {
      console.error('Failed to get chat response:', error);
      const fallbackResponse = { sender: memberName, message: "Sorry, I got distracted for a moment. What were you saying?" };
      setTeamChatMessages(prev => ({
        ...prev,
        [memberName]: [...(prev[memberName] || []), fallbackResponse]
      }));
    }
    
    setIsAIResponding(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Onboarding</h2>
          <p className="text-gray-500 dark:text-gray-400">Welcome to {companyName}! Let's get you started.</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack} data-testid="button-back-to-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center">
              <Coffee className="h-6 w-6 text-teal-600 dark:text-teal-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-teal-900 dark:text-teal-100">Day 1: Getting Oriented</h3>
              <p className="text-sm text-teal-700 dark:text-teal-300">
                Read the docs, meet your team, and check in with Sarah
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-teal-600">{Math.round(overallProgress)}%</div>
              <div className="text-xs text-teal-500">Complete</div>
            </div>
          </div>
          <Progress value={overallProgress} className="mt-4 h-2" />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {/* Step 1: Read Documentation */}
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            allDocsRead ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" : ""
          )}
          onClick={() => setCurrentStep('documentation')}
          data-testid="card-documentation"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  allDocsRead ? "bg-green-100" : "bg-purple-100"
                )}>
                  <BookOpen className={cn(
                    "h-5 w-5",
                    allDocsRead ? "text-green-600" : "text-purple-600"
                  )} />
                </div>
                <div>
                  <h4 className="font-semibold">Read Documentation</h4>
                  <p className="text-sm text-gray-500">Learn about the product and how we work</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={allDocsRead ? "default" : "secondary"}>
                  {docsReadCount}/{DOCUMENTATION_SECTIONS.length}
                </Badge>
                {allDocsRead ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Meet Your Team (unlocks after documentation) */}
        <Card 
          className={cn(
            "cursor-pointer transition-all",
            !allDocsRead ? "opacity-60 cursor-not-allowed" : "hover:shadow-md",
            allTeamIntrosComplete ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" : ""
          )}
          onClick={() => allDocsRead && setCurrentStep('team-intro')}
          data-testid="card-team-intro"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  allTeamIntrosComplete ? "bg-green-100" : "bg-blue-100"
                )}>
                  <Users className={cn(
                    "h-5 w-5",
                    allTeamIntrosComplete ? "text-green-600" : "text-blue-600"
                  )} />
                </div>
                <div>
                  <h4 className="font-semibold">Meet Your Team</h4>
                  <p className="text-sm text-gray-500">
                    {allDocsRead 
                      ? "Get to know the people you'll be working with" 
                      : "Complete documentation first"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!allDocsRead && <Clock className="h-5 w-5 text-gray-400" />}
                {allDocsRead && (
                  <Badge variant={allTeamIntrosComplete ? "default" : "secondary"}>
                    {teamIntroCount}/{DEFAULT_TEAM.length}
                  </Badge>
                )}
                {allTeamIntrosComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : allDocsRead ? (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Check in with Sarah (unlocks after team intro) */}
        <Card 
          className={cn(
            "cursor-pointer transition-all",
            !allTeamIntrosComplete ? "opacity-60 cursor-not-allowed" : "hover:shadow-md",
            progress.comprehensionComplete ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" : ""
          )}
          onClick={() => allTeamIntrosComplete && setCurrentStep('comprehension')}
          data-testid="card-comprehension"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  progress.comprehensionComplete ? "bg-green-100" : "bg-indigo-100"
                )}>
                  <MessageSquare className={cn(
                    "h-5 w-5",
                    progress.comprehensionComplete ? "text-green-600" : "text-indigo-600"
                  )} />
                </div>
                <div>
                  <h4 className="font-semibold">Check in with Sarah</h4>
                  <p className="text-sm text-gray-500">
                    {allTeamIntrosComplete 
                      ? "Discuss what you've learned" 
                      : "Complete team introductions first"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!allTeamIntrosComplete && <Clock className="h-5 w-5 text-gray-400" />}
                {progress.comprehensionComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : allTeamIntrosComplete ? (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {allTeamIntrosComplete && allDocsRead && progress.comprehensionComplete && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Onboarding Complete!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You're ready to move on to Sprint Planning
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => completePhase.mutate()}
                disabled={completePhase.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-complete-onboarding"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Start Planning
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTeamIntro = () => {
    if (selectedMember) {
      const memberMessages = teamChatMessages[selectedMember.name] || [];
      const userMessageCount = memberMessages.filter(m => m.sender === 'You').length;
      const hasEnoughMessages = userMessageCount >= 2;
      
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)} data-testid="button-back-to-team">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Team
            </Button>
          </div>
          
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                  <AvatarImage src={getAvatarUrl(selectedMember.name)} alt={selectedMember.name} />
                  <AvatarFallback className={cn("text-white", getMemberColor(selectedMember.name))}>
                    {getInitials(selectedMember.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedMember.name}</h3>
                  <p className="text-sm text-gray-500">{selectedMember.role}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedMember.expertise.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat with {selectedMember.name}
              </CardTitle>
              <CardDescription>
                Get to know {selectedMember.name} - ask about their background, experience, or hobbies
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div ref={chatScrollRef} className="h-[200px] overflow-y-auto pr-4 mb-4">
                <div className="space-y-3">
                  {memberMessages.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      <p>Start a conversation! Try asking about:</p>
                      <div className="flex flex-wrap justify-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100" onClick={() => setTeamChatInput("How long have you been at the company?")}>
                          Their background
                        </Badge>
                        <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100" onClick={() => setTeamChatInput("What do you like most about working here?")}>
                          Work experience
                        </Badge>
                        <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100" onClick={() => setTeamChatInput("What do you do outside of work?")}>
                          Hobbies
                        </Badge>
                      </div>
                    </div>
                  )}
                  {memberMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex gap-2",
                        msg.sender === 'You' ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.sender !== 'You' && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={getAvatarUrl(selectedMember.name)} alt={selectedMember.name} />
                          <AvatarFallback className={cn("text-white text-xs", getMemberColor(selectedMember.name))}>
                            {getInitials(selectedMember.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 max-w-[80%] text-sm",
                          msg.sender === 'You'
                            ? "bg-primary text-primary-foreground"
                            : "bg-gray-100 dark:bg-gray-800"
                        )}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  {isAIResponding && (
                    <div className="flex gap-2">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={getAvatarUrl(selectedMember.name)} alt={selectedMember.name} />
                        <AvatarFallback className={cn("text-white text-xs", getMemberColor(selectedMember.name))}>
                          {getInitials(selectedMember.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Textarea
                  value={teamChatInput}
                  onChange={(e) => setTeamChatInput(e.target.value)}
                  placeholder={`Say hi to ${selectedMember.name}...`}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTeamChatSend();
                    }
                  }}
                  data-testid="input-team-chat"
                />
                <Button 
                  onClick={handleTeamChatSend} 
                  disabled={!teamChatInput.trim() || isAIResponding}
                  size="icon"
                  className="shrink-0 h-[60px] w-[60px]"
                  data-testid="button-send-team-chat"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full" 
            onClick={() => handleTeamIntroComplete(selectedMember.name)}
            disabled={!hasEnoughMessages}
            data-testid="button-complete-intro"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {hasEnoughMessages ? "Mark as Introduced" : "Have a conversation first"}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Your Team</h3>
            <p className="text-sm text-gray-500">Click on each person to learn more about them</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentStep('overview')} data-testid="button-back-to-overview">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="grid gap-3">
          {DEFAULT_TEAM.map((member, idx) => (
            <Card 
              key={idx}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                progress.teamIntrosComplete[member.name] ? "border-green-200 bg-green-50/30" : ""
              )}
              onClick={() => setSelectedMember(member)}
              data-testid={`team-member-${member.name.toLowerCase()}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                      <AvatarImage src={getAvatarUrl(member.name)} alt={member.name} />
                      <AvatarFallback className={cn("text-white", getMemberColor(member.name))}>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {progress.teamIntrosComplete[member.name] && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {member.expertise.slice(0, 2).map((skill, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress indicator and Continue button */}
        <Card className={cn(
          "mt-4 transition-all",
          allTeamIntrosComplete 
            ? "bg-gradient-to-r from-green-50 to-indigo-50 dark:from-green-900/20 dark:to-indigo-900/20 border-green-200" 
            : "bg-gray-50 dark:bg-gray-800/50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {allTeamIntrosComplete ? (
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className={cn("font-medium", allTeamIntrosComplete ? "text-green-800 dark:text-green-200" : "text-gray-600")}>
                    {allTeamIntrosComplete ? "You've met everyone!" : "Keep chatting..."}
                  </p>
                  <p className="text-sm text-gray-500">
                    {Object.values(progress.teamIntrosComplete).filter(Boolean).length} of {DEFAULT_TEAM.length} team members
                  </p>
                </div>
              </div>
              {allTeamIntrosComplete && (
                <Button 
                  onClick={() => setCurrentStep('comprehension')}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  data-testid="button-continue-to-sarah"
                >
                  Check in with Sarah
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDocumentation = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Onboarding Documentation</h3>
          <p className="text-sm text-gray-500">Read through all sections to continue</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentStep('overview')} data-testid="button-back-to-overview">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <Tabs value={activeDocTab} onValueChange={setActiveDocTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="product" data-testid="tab-product">
            <Store className="h-4 w-4 mr-2" />
            Product
          </TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="product" className="mt-4 space-y-4">
          {DOCUMENTATION_SECTIONS.slice(0, 2).map(section => (
            <Collapsible 
              key={section.id}
              open={expandedDocs[section.id]}
              onOpenChange={(open) => {
                if (open) handleDocRead(section.id);
                setExpandedDocs(prev => ({ ...prev, [section.id]: open }));
              }}
            >
              <Card>
                <CollapsibleTrigger className="w-full" data-testid={`section-${section.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <section.icon className="h-4 w-4 text-blue-600" />
                        {section.title}
                        {progress.docsRead[section.id] && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </CardTitle>
                      {expandedDocs[section.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Separator className="my-3" />
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {section.id === 'product' && (
                        <div className="space-y-3 text-gray-700 dark:text-gray-300">
                          <p>
                            {companyName} builds payment infrastructure for small and medium businesses.
                            Our Merchant Dashboard helps business owners track transactions, manage refunds,
                            and understand their revenue patterns.
                          </p>
                          <p>
                            As a {role}, you'll be working on features that help merchants manage their
                            daily operations more efficiently.
                          </p>
                        </div>
                      )}
                      {section.id === 'users' && (
                        <div className="space-y-3 text-gray-700 dark:text-gray-300">
                          <p>
                            Our primary users are small business owners who use the dashboard daily
                            to check their sales, process refunds, and reconcile payments.
                          </p>
                          <p>
                            They value reliability and simplicity - downtime or confusing UX directly
                            impacts their business operations.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-4">
          {DOCUMENTATION_SECTIONS.slice(2).map(section => (
            <Collapsible 
              key={section.id}
              open={expandedDocs[section.id]}
              onOpenChange={(open) => {
                if (open) handleDocRead(section.id);
                setExpandedDocs(prev => ({ ...prev, [section.id]: open }));
              }}
            >
              <Card>
                <CollapsibleTrigger className="w-full" data-testid={`section-${section.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <section.icon className="h-4 w-4 text-purple-600" />
                        {section.title}
                        {progress.docsRead[section.id] && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </CardTitle>
                      {expandedDocs[section.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Separator className="my-3" />
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {section.id === 'norms' && (
                        <div className="space-y-3 text-gray-700 dark:text-gray-300">
                          <p>We have daily standups at 10am - quick 15-minute syncs where you share what you're working on.</p>
                          <p>Communication is mostly async via Slack. Don't hesitate to ask questions!</p>
                          <p>Code reviews are collaborative - expect feedback and provide it respectfully.</p>
                        </div>
                      )}
                      {section.id === 'workflow' && (
                        <div className="space-y-3 text-gray-700 dark:text-gray-300">
                          <p>We work in 2-week sprints with planning, daily standups, and retrospectives.</p>
                          <p>All code goes through PR review before merging to main.</p>
                          <p>We use feature branches and squash merges.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </TabsContent>
      </Tabs>

      {/* Progress indicator and Continue button */}
      <Card className={cn(
        "mt-6 transition-all",
        allDocsRead 
          ? "bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200" 
          : "bg-gray-50 dark:bg-gray-800/50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {allDocsRead ? (
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>
              )}
              <div>
                <p className={cn("font-medium", allDocsRead ? "text-green-800 dark:text-green-200" : "text-gray-600")}>
                  {allDocsRead ? "All documentation reviewed!" : "Keep reading..."}
                </p>
                <p className="text-sm text-gray-500">
                  {Object.values(progress.docsRead).filter(Boolean).length} of {DOCUMENTATION_SECTIONS.length} sections complete
                </p>
              </div>
            </div>
            {allDocsRead && (
              <Button 
                onClick={() => setCurrentStep('team-intro')}
                className="bg-teal-600 hover:bg-teal-700"
                data-testid="button-continue-to-team"
              >
                Meet Your Team
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderComprehension = () => (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Check in with Sarah</h3>
          <p className="text-sm text-gray-500">Share what you've learned from the documentation</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentStep('overview')} data-testid="button-back-to-overview">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getAvatarUrl('Sarah')} alt="Sarah" />
              <AvatarFallback className="bg-blue-500 text-white">S</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">Sarah - Tech Lead</p>
              <p className="text-sm text-gray-500">This is a casual chat, not a test!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getAvatarUrl('Sarah')} alt="Sarah" />
              <AvatarFallback className="bg-blue-500 text-white text-xs">S</AvatarFallback>
            </Avatar>
            <div className="bg-white dark:bg-gray-800 border rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <p className="text-sm">
                Hey! I see you've been reading through the docs. What's your understanding of what our Merchant Dashboard does?
              </p>
            </div>
          </div>

          {chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              className={cn("flex", msg.sender === 'You' ? "justify-end" : "items-start gap-3")}
            >
              {msg.sender !== 'You' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl('Sarah')} alt="Sarah" />
                  <AvatarFallback className="bg-blue-500 text-white text-xs">S</AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                "px-4 py-3 rounded-2xl max-w-[80%]",
                msg.sender === 'You' 
                  ? "bg-blue-600 text-white rounded-br-sm" 
                  : "bg-white dark:bg-gray-800 border rounded-tl-sm"
              )}>
                <p className="text-sm">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {progress.comprehensionComplete ? (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">Great chat!</p>
                <p className="text-sm text-green-600 dark:text-green-300">You're ready to move on</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type your response to Sarah..."
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
            onClick={handleSendMessage}
            disabled={!chatMessage.trim()}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full" data-testid="onboarding-module">
      {currentStep === 'overview' && renderOverview()}
      {currentStep === 'team-intro' && renderTeamIntro()}
      {currentStep === 'documentation' && renderDocumentation()}
      {currentStep === 'comprehension' && renderComprehension()}
    </div>
  );
}
