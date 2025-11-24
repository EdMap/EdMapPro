import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  Target,
  Users,
  FileCode,
  MessageSquare,
  ChevronRight,
  AtSign
} from "lucide-react";
import CodebaseExplorer from "./codebase-explorer";

interface EnterpriseFeatureSessionProps {
  session: any;
  project: any;
  onComplete: () => void;
}

export default function EnterpriseFeatureSession({ session, project, onComplete }: EnterpriseFeatureSessionProps) {
  const [message, setMessage] = useState("");
  const [currentPhase, setCurrentPhase] = useState<string>("onboarding");
  const [phaseStartTime, setPhaseStartTime] = useState<Date>(new Date());
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [completedObjectives, setCompletedObjectives] = useState<Record<string, boolean[]>>({});
  const [activeChannel, setActiveChannel] = useState<string>("team-chat");
  const [openDMs, setOpenDMs] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const requirements = project.requirements || {};
  const phases = requirements.phases || [];
  const existingProduct = requirements.existingProduct || {};
  const featureRequest = requirements.featureRequest || {};
  const productDocumentation = requirements.productDocumentation || {};
  const simulatedCodebase = requirements.simulatedCodebase || { structure: {}, keyFiles: [] };
  const scenarioScript = project.scenarioScript || {};

  const currentPhaseData = phases.find((p: any) => p.name === currentPhase) || phases[0];
  const currentPhaseIndex = phases.findIndex((p: any) => p.name === currentPhase);
  const progressPercentage = ((currentPhaseIndex + 1) / phases.length) * 100;
  
  // Phase guidance for different roles
  const phaseGuidance: Record<string, { description: string; tips: string[] }> = {
    onboarding: {
      description: "Welcome! Get familiar with the team, codebase, and feature requirements.",
      tips: [
        "Review the feature requirements and acceptance criteria in the Requirements tab",
        "Explore the codebase structure in the Codebase tab to understand the architecture",
        "Chat with your teammates to ask questions and introduce yourself",
        "Check off objectives as you complete them to track your progress"
      ]
    },
    planning: {
      description: "Break down the feature into concrete tasks and align with the team.",
      tips: [
        "Discuss the technical approach with Ravi (Backend Lead) and Maya (Frontend)",
        "Ask about potential risks, dependencies, or architectural decisions",
        "For PMs: Define milestones and coordinate the sprint plan",
        "For Developers: Identify which files need changes and what APIs to create",
        "Check off objectives once you've discussed them with the team"
      ]
    },
    implementation: {
      description: "Build the feature by collaborating with your team.",
      tips: [
        "For Developers: Discuss code implementation details with technical teammates",
        "For PMs: Check in on progress, unblock dependencies, and coordinate with stakeholders",
        "Share your work-in-progress and ask for feedback",
        "Document key decisions and update the team on your progress",
        "This phase typically takes the longest - work through each objective systematically"
      ]
    },
    review: {
      description: "Get feedback from teammates and refine your work.",
      tips: [
        "Share your completed work with the team for review",
        "For Developers: Ask Elena (QA) about testing and Ravi about code review",
        "For PMs: Coordinate final sign-offs and ensure acceptance criteria are met",
        "Address any feedback or questions from teammates",
        "Ensure all deliverables are ready before moving to release"
      ]
    },
    release: {
      description: "Deploy the feature and wrap up the sprint.",
      tips: [
        "Coordinate with Luis (DevOps) on deployment process",
        "Participate in sprint retrospective to reflect on what went well",
        "Share key learnings and celebrate the team's success",
        "You'll receive a performance evaluation based on your collaboration and communication"
      ]
    }
  };
  
  const currentGuidance = phaseGuidance[currentPhase] || phaseGuidance.onboarding;
  const phaseObjectives = completedObjectives[currentPhase] || [];
  const objectivesCompleted = phaseObjectives.filter(Boolean).length;
  const totalObjectives = currentPhaseData?.objectives?.length || 0;
  const canAdvancePhase = objectivesCompleted >= Math.ceil(totalObjectives * 0.5); // At least 50% complete

  // Fetch interactions for current session
  const { data: interactions, isLoading: interactionsLoading } = useQuery({
    queryKey: ['/api/workspace', session.id, 'interactions'],
    queryFn: () => fetch(`/api/workspace/${session.id}/interactions`).then(res => res.json()),
    refetchInterval: 2000
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      // Show typing indicator for the responding AI teammate
      const teamMembers = project.teamStructure || [];
      
      // For DMs, show typing for specific member
      if (activeChannel.startsWith('dm-')) {
        const memberName = activeChannel.replace('dm-', '');
        setTypingIndicator(memberName);
      } else {
        const randomMember = teamMembers[Math.floor(Math.random() * teamMembers.length)];
        setTypingIndicator(randomMember?.name || "Teammate");
      }
      
      const response = await apiRequest("POST", `/api/workspace/${session.id}/action`, {
        type: 'send-message',
        channel: activeChannel === 'team-chat' ? getChannelForPhase(currentPhase) : activeChannel,
        data: { content: userMessage }
      });
      return response.json();
    },
    onSuccess: () => {
      setTypingIndicator(null);
      queryClient.invalidateQueries({ queryKey: ['/api/workspace', session.id, 'interactions'] });
      setMessage("");
    },
    onError: () => {
      setTypingIndicator(null);
    }
  });

  // Auto-trigger phase events when phase changes
  useEffect(() => {
    const phaseScript = scenarioScript.phases?.[currentPhase];
    if (!phaseScript || !Array.isArray(phaseScript)) return;

    const timers: NodeJS.Timeout[] = [];
    let cumulativeDelay = 0;
    
    phaseScript.forEach((event: any, index: number) => {
      // Add staggered delays (3-8 seconds apart) for more realistic timing
      const baseDelay = 3000; // 3 seconds minimum
      const randomDelay = Math.random() * 5000; // 0-5 seconds random
      cumulativeDelay += baseDelay + randomDelay; // Total 3-8 seconds between messages
      
      const timer = setTimeout(async () => {
        try {
          await apiRequest("POST", `/api/workspace/${session.id}/interactions`, {
            sessionId: session.id,
            channel: getChannelForPhase(currentPhase),
            sender: event.from,
            senderRole: project.teamStructure?.find((m: any) => m.name === event.from)?.role || 'Team Member',
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
  }, [currentPhase]);

  function getChannelForPhase(phase: string): string {
    const channelMap: Record<string, string> = {
      'onboarding': 'team-chat',
      'planning': 'standup',
      'implementation': 'team-chat',
      'review': 'code-reviews',
      'release': 'team-chat'
    };
    return channelMap[phase] || 'team-chat';
  }

  function handleSendMessage() {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  }

  function advancePhase() {
    const nextPhaseIndex = currentPhaseIndex + 1;
    if (nextPhaseIndex < phases.length) {
      setCurrentPhase(phases[nextPhaseIndex].name);
      setPhaseStartTime(new Date());
    } else {
      // Simulation complete
      onComplete();
    }
  }

  // Start or switch to DM with a team member
  function startDM(memberName: string) {
    const dmChannel = `dm-${memberName}`;
    if (!openDMs.includes(dmChannel)) {
      setOpenDMs([...openDMs, dmChannel]);
    }
    setActiveChannel(dmChannel);
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactions]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Handle message input changes and detect @ mentions
  function handleMessageChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setMessage(value);
    
    // User typing detection - hide typing indicator when user starts typing
    if (value.length > 0 && !userIsTyping) {
      setUserIsTyping(true);
      setTypingIndicator(null); // Hide typing indicator when user starts typing
    }
    
    // User stopped typing or cleared input
    if (value.length === 0) {
      setUserIsTyping(false);
    }
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set user as not typing after 2 seconds of inactivity
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setUserIsTyping(false);
      }, 2000);
    }
    
    // Check if we're typing an @ mention
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      const hasSpace = textAfterAt.includes(' ');
      
      if (!hasSpace) {
        setShowMentionMenu(true);
        setMentionSearch(textAfterAt.toLowerCase());
        setMentionCursorPos(lastAtSymbol);
      } else {
        setShowMentionMenu(false);
      }
    } else {
      setShowMentionMenu(false);
    }
  }

  // Insert mention when selected from dropdown
  function insertMention(memberName: string) {
    const beforeMention = message.substring(0, mentionCursorPos);
    const afterMention = message.substring(mentionCursorPos + mentionSearch.length + 1);
    const newMessage = `${beforeMention}@${memberName} ${afterMention}`;
    
    setMessage(newMessage);
    setShowMentionMenu(false);
    textareaRef.current?.focus();
  }

  // Toggle objective completion
  function toggleObjective(index: number) {
    setCompletedObjectives(prev => {
      const phaseObjs = prev[currentPhase] || Array(totalObjectives).fill(false);
      const updated = [...phaseObjs];
      updated[index] = !updated[index];
      return { ...prev, [currentPhase]: updated };
    });
  }
  
  // Initialize phase objectives when phase changes
  useEffect(() => {
    if (!completedObjectives[currentPhase] && totalObjectives > 0) {
      setCompletedObjectives(prev => ({
        ...prev,
        [currentPhase]: Array(totalObjectives).fill(false)
      }));
    }
  }, [currentPhase, totalObjectives]);

  // Filter team members for mention autocomplete
  const teamMembers = project.teamStructure || [];
  const filteredMembers = showMentionMenu
    ? teamMembers.filter((member: any) =>
        member.name.toLowerCase().includes(mentionSearch)
      )
    : [];

  // Filter interactions by active channel
  const channelInteractions = Array.isArray(interactions)
    ? interactions.filter((i: any) => {
        if (activeChannel === 'team-chat') {
          // For team chat, show messages from the current phase channel
          const phaseChannel = getChannelForPhase(currentPhase);
          return i.channel === phaseChannel;
        } else {
          // For DMs, show messages from that specific DM channel
          return i.channel === activeChannel;
        }
      })
    : [];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with Phase Progress */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-session-title">
                {project.name}
              </h1>
              <p className="text-gray-600 text-sm mt-1">{featureRequest.title || project.description}</p>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                Phase {currentPhaseIndex + 1} of {phases.length}: {currentPhaseData?.name}
              </span>
              <span className="text-gray-500">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-gray-600">
              {phases.map((phase: any, idx: number) => (
                <div key={phase.name} className="flex items-center gap-1">
                  {idx < currentPhaseIndex ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : idx === currentPhaseIndex ? (
                    <Clock className="h-4 w-4 text-blue-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={idx === currentPhaseIndex ? 'font-medium' : ''}>
                    {phase.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-screen-2xl mx-auto px-6 py-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Phase Info & Team */}
            <div className="lg:col-span-1 space-y-4 overflow-y-auto">
              {/* Phase Guidance */}
              <Card data-testid="card-phase-guidance" className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                    <Target className="h-5 w-5" />
                    What to Do Now
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    {currentGuidance.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentGuidance.tips.map((tip: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-blue-900">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              {/* Phase Objectives with Checkboxes */}
              <Card data-testid="card-phase-objectives">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Objectives ({objectivesCompleted}/{totalObjectives})
                    </CardTitle>
                    {objectivesCompleted > 0 && (
                      <span className="text-xs font-medium text-green-600">
                        {Math.round((objectivesCompleted / totalObjectives) * 100)}% complete
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    Check off objectives as you complete them
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentPhaseData?.objectives?.map((obj: string, idx: number) => (
                      <label
                        key={idx}
                        className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                        data-testid={`objective-${idx}`}
                      >
                        <input
                          type="checkbox"
                          checked={phaseObjectives[idx] || false}
                          onChange={() => toggleObjective(idx)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          data-testid={`checkbox-objective-${idx}`}
                        />
                        <span className={`text-sm flex-1 ${phaseObjectives[idx] ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                          {obj}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Deliverables</h4>
                    <div className="space-y-1">
                      {currentPhaseData?.deliverables?.map((del: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                          <span className="text-sm text-gray-600">{del}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-team-members">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Team
                  </CardTitle>
                  <CardDescription className="text-xs">Click to start a direct message</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {project.teamStructure?.map((member: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => startDM(member.name)}
                        className={`w-full flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-blue-50 ${
                          activeChannel === `dm-${member.name}` ? 'bg-blue-100 border border-blue-300' : ''
                        }`}
                        data-testid={`member-${idx}`}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-blue-600">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-600">{member.role}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.expertise?.slice(0, 2).map((exp: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {exp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {currentPhase !== 'release' && (
                <Card data-testid="card-phase-progression">
                  <CardContent className="pt-6">
                    {canAdvancePhase ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Ready to advance!</span>
                        </div>
                        <Button
                          onClick={advancePhase}
                          className="w-full"
                          data-testid="button-next-phase"
                        >
                          Complete {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} & Continue
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600 text-center">
                          Complete at least {Math.ceil(totalObjectives * 0.5)} objectives to continue
                        </div>
                        <Button
                          disabled
                          className="w-full"
                          data-testid="button-next-phase-disabled"
                        >
                          Continue to Next Phase
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center - Main Content Area */}
            <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
              <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chat" data-testid="tab-chat">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Team Chat
                  </TabsTrigger>
                  <TabsTrigger value="codebase" data-testid="tab-codebase">
                    <FileCode className="h-4 w-4 mr-2" />
                    Codebase
                  </TabsTrigger>
                  <TabsTrigger value="requirements" data-testid="tab-requirements">
                    <Target className="h-4 w-4 mr-2" />
                    Requirements
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 flex flex-col mt-4 overflow-hidden">
                  <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="flex-shrink-0">
                      <div className="flex items-center gap-2 mb-3 overflow-x-auto">
                        <Button
                          variant={activeChannel === 'team-chat' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveChannel('team-chat')}
                          data-testid="button-team-chat"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Team Chat
                        </Button>
                        {openDMs.map((dmChannel) => {
                          const memberName = dmChannel.replace('dm-', '');
                          return (
                            <Button
                              key={dmChannel}
                              variant={activeChannel === dmChannel ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setActiveChannel(dmChannel)}
                              data-testid={`button-dm-${memberName}`}
                            >
                              <AtSign className="h-3 w-3 mr-1" />
                              {memberName}
                            </Button>
                          );
                        })}
                      </div>
                      <CardTitle className="text-lg">
                        {activeChannel === 'team-chat' ? 'Team Chat' : `DM with ${activeChannel.replace('dm-', '')}`}
                      </CardTitle>
                      <CardDescription>
                        {activeChannel === 'team-chat' ? 'Collaborate with your AI teammates' : 'Private conversation'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                      <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
                        {interactionsLoading ? (
                          <div className="text-center py-8 text-gray-500">Loading messages...</div>
                        ) : channelInteractions.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          <>
                            {channelInteractions.map((interaction: any) => {
                              const isUser = interaction.sender === 'User' || interaction.sender === 'user';
                              return (
                                <div
                                  key={interaction.id}
                                  className={`flex gap-3 ${
                                    isUser ? 'flex-row-reverse' : ''
                                  }`}
                                  data-testid={`message-${interaction.id}`}
                                >
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-medium text-blue-600">
                                      {isUser ? 'U' : interaction.sender.charAt(0)}
                                    </span>
                                  </div>
                                  <div
                                    className={`flex-1 max-w-lg ${
                                      isUser ? 'text-right' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900">
                                        {isUser ? 'You' : interaction.sender}
                                      </span>
                                      <span className="text-xs text-gray-500">{interaction.senderRole}</span>
                                    </div>
                                    <div
                                      className={`inline-block rounded-lg px-4 py-2 ${
                                        isUser
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-gray-100 text-gray-900'
                                      }`}
                                    >
                                      <p className="text-sm whitespace-pre-wrap">{interaction.content}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Typing indicator */}
                            {typingIndicator && (
                              <div className="flex gap-3" data-testid="typing-indicator">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-medium text-blue-600">
                                    {typingIndicator.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1 max-w-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">{typingIndicator}</span>
                                  </div>
                                  <div className="inline-block rounded-lg px-4 py-2 bg-gray-100">
                                    <div className="flex gap-1">
                                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                          </>
                        )}
                      </div>
                      <div className="flex-shrink-0 border-t p-4 relative">
                        {/* Mention autocomplete dropdown */}
                        {showMentionMenu && filteredMembers.length > 0 && (
                          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                            {filteredMembers.map((member: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => insertMention(member.name)}
                                className="w-full px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-left"
                                data-testid={`mention-option-${member.name}`}
                              >
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-medium text-blue-600">
                                    {member.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                  <div className="text-xs text-gray-600">{member.role}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleMessageChange}
                            placeholder="Type @ to mention someone, or just ask your team..."
                            className="min-h-[60px]"
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
                            data-testid="button-send"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="codebase" className="flex-1 mt-4 overflow-y-auto">
                  <CodebaseExplorer 
                    codebaseData={simulatedCodebase}
                    productInfo={existingProduct}
                  />
                </TabsContent>

                <TabsContent value="requirements" className="flex-1 mt-4 overflow-y-auto">
                  <div className="mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileCode className="h-5 w-5" />
                          Product Documentation
                        </CardTitle>
                        <CardDescription>
                          Click any document to open it in a new tab for easy reading
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <a
                            href={`/workspace/${session.id}/document/executive-summary`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                            data-testid="doc-executive-summary"
                          >
                            <Target className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-blue-600">Executive Summary</div>
                              <div className="text-xs text-gray-500">Strategic overview</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                          </a>

                          <a
                            href={`/workspace/${session.id}/document/feature-requirements`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                            data-testid="doc-feature-requirements"
                          >
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-blue-600">Feature Requirements</div>
                              <div className="text-xs text-gray-500">Technical specs & criteria</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                          </a>

                          <a
                            href={`/workspace/${session.id}/document/stakeholder-analysis`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-colors group"
                            data-testid="doc-stakeholder-analysis"
                          >
                            <Users className="h-5 w-5 text-purple-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-purple-600">Stakeholder Analysis</div>
                              <div className="text-xs text-gray-500">Key stakeholders & priorities</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                          </a>

                          <a
                            href={`/workspace/${session.id}/document/user-stories`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                            data-testid="doc-user-stories"
                          >
                            <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-blue-600">User Stories & Personas</div>
                              <div className="text-xs text-gray-500">Target users & goals</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                          </a>

                          <a
                            href={`/workspace/${session.id}/document/success-metrics`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:border-green-300 transition-colors group"
                            data-testid="doc-success-metrics"
                          >
                            <Target className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-green-600">Success Metrics & KPIs</div>
                              <div className="text-xs text-gray-500">Measurable outcomes</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                          </a>

                          <a
                            href={`/workspace/${session.id}/document/roadmap-context`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-colors group"
                            data-testid="doc-roadmap-context"
                          >
                            <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-orange-600">Roadmap Context</div>
                              <div className="text-xs text-gray-500">Strategic timeline</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-600" />
                          </a>

                          <a
                            href={`/workspace/${session.id}/document/competitive-analysis`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                            data-testid="doc-competitive-analysis"
                          >
                            <FileCode className="h-5 w-5 text-gray-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-blue-600">Competitive Analysis</div>
                              <div className="text-xs text-gray-500">Market positioning</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                          </a>

                          <a
                            href={`/workspace/${session.id}/document/gtm-strategy`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
                            data-testid="doc-gtm-strategy"
                          >
                            <Target className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-blue-600">Go-to-Market Strategy</div>
                              <div className="text-xs text-gray-500">Launch plan</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                          </a>

                          <a
                            href={`/workspace/${session.id}/document/risk-assessment`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:border-red-300 transition-colors group"
                            data-testid="doc-risk-assessment"
                          >
                            <MessageSquare className="h-5 w-5 text-red-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-red-600">Risk Assessment</div>
                              <div className="text-xs text-gray-500">Risks & mitigation</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                          </a>

                          <a
                            href={`/workspace/${session.id}/document/resource-planning`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors group"
                            data-testid="doc-resource-planning"
                          >
                            <Users className="h-5 w-5 text-gray-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-blue-600">Resource Planning</div>
                              <div className="text-xs text-gray-500">Team & budget</div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="space-y-6 hidden">
                    {/* Executive Summary */}
                    {productDocumentation.executiveSummary && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            Executive Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 leading-relaxed">{productDocumentation.executiveSummary}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Feature Requirements */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Feature Requirements</CardTitle>
                        <CardDescription>{featureRequest.title}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Business Context</h4>
                          <p className="text-sm text-gray-700">{featureRequest.businessContext}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Technical Requirements</h4>
                          <ul className="space-y-2">
                            {featureRequest.requirements?.map((req: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Acceptance Criteria</h4>
                          <ul className="space-y-2">
                            {featureRequest.acceptanceCriteria?.map((criteria: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="h-4 w-4 rounded border-2 border-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stakeholder Analysis */}
                    {productDocumentation.stakeholders && productDocumentation.stakeholders.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-600" />
                            Stakeholder Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {productDocumentation.stakeholders.map((stakeholder: any, idx: number) => (
                            <div key={idx} className="border-l-4 border-purple-300 pl-4 py-2">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h5 className="font-semibold text-gray-900">{stakeholder.name}</h5>
                                  <p className="text-sm text-gray-600">{stakeholder.title}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">{stakeholder.priority}</Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Concerns:</span>
                                  <ul className="list-disc list-inside ml-2 text-gray-600">
                                    {stakeholder.concerns.map((concern: string, i: number) => (
                                      <li key={i}>{concern}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Success Metrics:</span>
                                  <ul className="list-disc list-inside ml-2 text-gray-600">
                                    {stakeholder.successMetrics.map((metric: string, i: number) => (
                                      <li key={i}>{metric}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* User Stories */}
                    {productDocumentation.userStories && productDocumentation.userStories.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>User Stories & Personas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {productDocumentation.userStories.map((story: any, idx: number) => (
                            <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-lg">{story.persona.charAt(0)}</span>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900">{story.persona}</h5>
                                  <p className="text-sm text-blue-700 font-medium">{story.goal}</p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 italic mb-2">{story.story}</p>
                              <div className="space-y-1 text-sm">
                                <div className="flex gap-2">
                                  <span className="font-medium text-gray-700">Pain Point:</span>
                                  <span className="text-gray-600">{story.painPoint}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="font-medium text-gray-700">Key Jobs:</span>
                                  <span className="text-gray-600">{story.jobs.join(', ')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Success Metrics */}
                    {productDocumentation.successMetrics && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-green-600" />
                            Success Metrics & KPIs
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {productDocumentation.successMetrics.primary && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Badge className="bg-green-600">Primary</Badge>
                              </h4>
                              <ul className="space-y-1">
                                {productDocumentation.successMetrics.primary.map((metric: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{metric}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {productDocumentation.successMetrics.secondary && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Badge variant="outline">Secondary</Badge>
                              </h4>
                              <ul className="space-y-1">
                                {productDocumentation.successMetrics.secondary.map((metric: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">{metric}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {productDocumentation.successMetrics.technical && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Badge variant="outline" className="bg-gray-100">Technical</Badge>
                              </h4>
                              <ul className="space-y-1">
                                {productDocumentation.successMetrics.technical.map((metric: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <FileCode className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">{metric}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Roadmap Context */}
                    {productDocumentation.roadmapContext && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            Roadmap Context
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <h4 className="font-semibold text-gray-900 mb-1">{productDocumentation.roadmapContext.quarterlyTheme}</h4>
                            <p className="text-sm text-gray-700">{productDocumentation.roadmapContext.positioning}</p>
                          </div>
                          
                          {productDocumentation.roadmapContext.dependencies && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Dependencies</h4>
                              <ul className="space-y-1">
                                {productDocumentation.roadmapContext.dependencies.map((dep: string, idx: number) => (
                                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                    <ChevronRight className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                    {dep}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {productDocumentation.roadmapContext.futureEnhancements && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Future Enhancements</h4>
                              <ul className="space-y-1">
                                {productDocumentation.roadmapContext.futureEnhancements.map((enhancement: string, idx: number) => (
                                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                    <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    {enhancement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Competitive Analysis */}
                    {productDocumentation.competitiveAnalysis && productDocumentation.competitiveAnalysis.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Competitive Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {productDocumentation.competitiveAnalysis.map((comp: any, idx: number) => (
                            <div key={idx} className="border rounded-lg p-3 space-y-2">
                              <h5 className="font-semibold text-gray-900">{comp.competitor}</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="font-medium text-gray-700">Their Capability:</span>
                                  <p className="text-gray-600 mt-1">{comp.theirCapability}</p>
                                </div>
                                <div className="bg-green-50 rounded p-2">
                                  <span className="font-medium text-green-800">Our Differentiator:</span>
                                  <p className="text-green-700 mt-1">{comp.ourDifferentiator}</p>
                                </div>
                              </div>
                              <div className="bg-blue-50 border-l-4 border-blue-400 p-2">
                                <span className="font-medium text-blue-800 text-sm">Gap: </span>
                                <span className="text-blue-700 text-sm">{comp.gap}</span>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Go-to-Market Strategy */}
                    {productDocumentation.goToMarketStrategy && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Go-to-Market Strategy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-1 text-sm">Launch Date</h5>
                              <p className="text-sm text-gray-700">{productDocumentation.goToMarketStrategy.launchDate}</p>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-1 text-sm">Pricing</h5>
                              <p className="text-sm text-gray-700">{productDocumentation.goToMarketStrategy.pricing}</p>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2 text-sm">Target Segment</h5>
                            <p className="text-sm text-gray-700">{productDocumentation.goToMarketStrategy.targetSegment}</p>
                          </div>

                          {productDocumentation.goToMarketStrategy.messagingPillars && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2 text-sm">Messaging Pillars</h5>
                              <ul className="space-y-1">
                                {productDocumentation.goToMarketStrategy.messagingPillars.map((pillar: string, idx: number) => (
                                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    {pillar}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {productDocumentation.goToMarketStrategy.launchActivities && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2 text-sm">Launch Activities</h5>
                              <ul className="space-y-1">
                                {productDocumentation.goToMarketStrategy.launchActivities.map((activity: string, idx: number) => (
                                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                    <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    {activity}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Risk Assessment */}
                    {productDocumentation.riskAssessment && productDocumentation.riskAssessment.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Risk Assessment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {productDocumentation.riskAssessment.map((risk: any, idx: number) => (
                            <div key={idx} className="border-l-4 border-red-300 pl-4 py-2">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-semibold text-gray-900">{risk.risk}</h5>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs">P: {risk.probability}</Badge>
                                  <Badge variant="outline" className="text-xs">I: {risk.impact}</Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Mitigation:</span> {risk.mitigation}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Resource Planning */}
                    {productDocumentation.resourcePlanning && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Resource Planning</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {productDocumentation.resourcePlanning.teamAllocation && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2 text-sm">Team Allocation</h5>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(productDocumentation.resourcePlanning.teamAllocation).map(([role, allocation]: [string, any]) => (
                                  <div key={role} className="bg-gray-50 rounded p-2">
                                    <span className="font-medium text-gray-700 capitalize">{role}:</span>
                                    <span className="text-gray-600 ml-2">{allocation}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {productDocumentation.resourcePlanning.timeline && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <h5 className="font-semibold text-gray-900 mb-1 text-sm">Timeline</h5>
                              <p className="text-sm text-gray-700">{productDocumentation.resourcePlanning.timeline}</p>
                            </div>
                          )}

                          {productDocumentation.resourcePlanning.budget && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2 text-sm">Budget</h5>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(productDocumentation.resourcePlanning.budget).map(([item, cost]: [string, any]) => (
                                  <div key={item} className="flex justify-between bg-gray-50 rounded p-2">
                                    <span className="font-medium text-gray-700 capitalize">{item}:</span>
                                    <span className="text-gray-900 font-semibold">{cost}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
