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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const requirements = project.requirements || {};
  const phases = requirements.phases || [];
  const existingProduct = requirements.existingProduct || {};
  const featureRequest = requirements.featureRequest || {};
  const simulatedCodebase = requirements.simulatedCodebase || { structure: {}, keyFiles: [] };
  const scenarioScript = project.scenarioScript || {};

  const currentPhaseData = phases.find((p: any) => p.name === currentPhase) || phases[0];
  const currentPhaseIndex = phases.findIndex((p: any) => p.name === currentPhase);
  const progressPercentage = ((currentPhaseIndex + 1) / phases.length) * 100;

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
      const randomMember = teamMembers[Math.floor(Math.random() * teamMembers.length)];
      setTypingIndicator(randomMember?.name || "Teammate");
      
      const response = await apiRequest("POST", `/api/workspace/${session.id}/action`, {
        type: 'send-message',
        channel: getChannelForPhase(currentPhase),
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

  // Filter team members for mention autocomplete
  const teamMembers = project.teamStructure || [];
  const filteredMembers = showMentionMenu
    ? teamMembers.filter((member: any) =>
        member.name.toLowerCase().includes(mentionSearch)
      )
    : [];

  const currentChannel = getChannelForPhase(currentPhase);
  const channelInteractions = Array.isArray(interactions)
    ? interactions.filter((i: any) => i.channel === currentChannel)
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
              <Card data-testid="card-phase-objectives">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Phase Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentPhaseData?.objectives?.map((obj: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{obj}</span>
                      </div>
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
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.teamStructure?.map((member: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-blue-600">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {currentPhase !== 'onboarding' && currentPhase !== 'release' && (
                <Button
                  onClick={advancePhase}
                  className="w-full"
                  data-testid="button-next-phase"
                >
                  Complete Phase & Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
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
                      <CardTitle className="text-lg">Team Chat - {currentChannel.replace('-', ' ')}</CardTitle>
                      <CardDescription>Collaborate with your AI teammates</CardDescription>
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
                        <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
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
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
