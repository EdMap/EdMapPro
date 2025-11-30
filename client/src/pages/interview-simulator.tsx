import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ModeBanner } from "@/components/ModeBanner";
import LangchainInterviewSession from "@/components/simulation/langchain-interview-session";
import { 
  Play, 
  MessageCircle, 
  Brain, 
  Clock,
  TrendingUp,
  Briefcase,
  Code,
  Lightbulb,
  Bot,
  User as UserIcon,
  Send,
  Loader2,
  Target
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getPersonaStyle } from "@/lib/persona-styles";
import type { User as UserType, InterviewSession } from "@shared/schema";

const targetRoles = [
  { value: "developer", label: "Software Developer", icon: Code },
  { value: "pm", label: "Product Manager", icon: Briefcase },
  { value: "designer", label: "UX Designer", icon: Lightbulb },
  { value: "data-scientist", label: "Data Scientist", icon: Brain },
];

const interviewTypes = [
  { value: "behavioral", label: "Behavioral Interview", description: "Assess soft skills and past experiences" },
  { value: "technical", label: "Technical Interview", description: "Evaluate technical knowledge and problem-solving" },
  { value: "system-design", label: "System Design", description: "Test architectural thinking and design skills" },
  { value: "case-study", label: "Case Study", description: "Analyze business problems and solutions" },
];

const difficulties = [
  { value: "easy", label: "Entry Level", description: "Junior positions, basic questions" },
  { value: "medium", label: "Mid Level", description: "Standard industry expectations" },
  { value: "hard", label: "Senior Level", description: "Advanced, challenging questions" },
];

export default function InterviewSimulator() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [activeFirstQuestion, setActiveFirstQuestion] = useState<any>(null);
  const [activeIntroduction, setActiveIntroduction] = useState<string | undefined>(undefined);
  const [applicationStageId, setApplicationStageId] = useState<number | null>(null);
  const [targetRole, setTargetRole] = useState("developer");
  const [interviewType, setInterviewType] = useState("behavioral");
  const [difficulty, setDifficulty] = useState("medium");
  const [totalQuestions, setTotalQuestions] = useState([5]);
  const [autoStarted, setAutoStarted] = useState(false);
  
  // Prelude conversation state
  const [isPreludeMode, setIsPreludeMode] = useState(false);
  const [preludeMessages, setPreludeMessages] = useState<Array<{role: 'interviewer' | 'candidate', content: string; personaId?: string}>>([]);
  const [completedPreludeMessages, setCompletedPreludeMessages] = useState<Array<{role: 'interviewer' | 'candidate', content: string; personaId?: string}>>([]);
  const [preludeResponse, setPreludeResponse] = useState("");
  const [isPreludeSubmitting, setIsPreludeSubmitting] = useState(false);
  
  // Team interview state
  const [isTeamInterview, setIsTeamInterview] = useState(false);
  const [teamPersonas, setTeamPersonas] = useState<Array<{id: string; name: string; role: string; displayRole: string}>>([]);
  
  // Pacing state for prelude
  const [preludeStartTime, setPreludeStartTime] = useState<number | null>(null);
  const [preludeElapsedMinutes, setPreludeElapsedMinutes] = useState(0);

  // Ref for auto-scroll in prelude
  const preludeMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or submitting
  useEffect(() => {
    if (preludeMessagesEndRef.current) {
      preludeMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [preludeMessages, isPreludeSubmitting]);

  // Determine mode based on URL params
  const isJourneyMode = applicationStageId !== null;

  // Parse URL search params
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const stageId = params.get('stageId');
    const type = params.get('type');
    const role = params.get('role');
    
    if (stageId) {
      setApplicationStageId(parseInt(stageId));
    }
    if (type && ['behavioral', 'technical', 'system-design', 'case-study', 'team', 'panel'].includes(type)) {
      setInterviewType(type);
    }
    if (role && ['developer', 'pm', 'designer', 'data-scientist'].includes(role)) {
      setTargetRole(role);
    }
  }, [searchString]);

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  const { data: interviewHistory = [] } = useQuery<InterviewSession[]>({
    queryKey: ["/api/users", user?.id, "interviews"],
    enabled: !!user?.id,
  });

  const startInterviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/interviews/start", data);
      return response.json();
    },
    onSuccess: (result) => {
      setActiveSession(result.session);
      
      // Reset prelude state for new session
      setCompletedPreludeMessages([]);
      
      // Handle team interview data
      if (result.isTeamInterview && result.teamPersonas) {
        setIsTeamInterview(true);
        setTeamPersonas(result.teamPersonas);
      } else {
        setIsTeamInterview(false);
        setTeamPersonas([]);
      }
      
      if (result.isPreludeMode && result.greeting) {
        // Enter conversational prelude mode
        setIsPreludeMode(true);
        // For team interviews, include the active persona in the greeting message
        const greetingMessage = {
          role: 'interviewer' as const, 
          content: result.greeting,
          personaId: result.activePersonaId
        };
        setPreludeMessages([greetingMessage]);
      } else {
        // Legacy flow without prelude
        setIsPreludeMode(false);
        setPreludeMessages([]);
        setActiveFirstQuestion(result.firstQuestion);
        setActiveIntroduction(result.introduction);
      }
      
      if (result.applicationStageId) {
        setApplicationStageId(result.applicationStageId);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "interviews"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Interview",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Handle prelude responses during conversational intro
  const preludeMutation = useMutation({
    mutationFn: async ({ sessionId, response, currentMessages }: { 
      sessionId: number; 
      response: string;
      currentMessages: Array<{role: 'interviewer' | 'candidate', content: string, personaId?: string}>;
    }) => {
      const res = await apiRequest("POST", `/api/interviews/${sessionId}/prelude`, { response });
      const data = await res.json();
      // Return both the API result and the current messages for proper state handling
      return { ...data, messagesAtSubmit: currentMessages };
    },
    onSuccess: (result) => {
      setIsPreludeSubmitting(false);
      
      if (result.preludeComplete && result.firstQuestion) {
        // Prelude is done, transition to real interview
        // Use the messages from the mutation context (not stale closure)
        setCompletedPreludeMessages(result.messagesAtSubmit);
        setIsPreludeMode(false);
        setActiveFirstQuestion(result.firstQuestion);
      } else if (result.preludeMessage) {
        // Add interviewer's response to prelude messages - include persona info for team interviews
        setPreludeMessages(prev => [...prev, { 
          role: 'interviewer', 
          content: result.preludeMessage,
          personaId: result.activePersonaId
        }]);
      }
    },
    onError: (error: any) => {
      setIsPreludeSubmitting(false);
      toast({
        title: "Error",
        description: error.message || "Failed to continue conversation",
        variant: "destructive",
      });
    },
  });

  const handlePreludeSubmit = () => {
    if (!preludeResponse.trim() || isPreludeSubmitting || !activeSession) return;
    
    const trimmedResponse = preludeResponse.trim();
    
    setIsPreludeSubmitting(true);
    
    // Add the candidate's response to messages first
    const candidateMessage = { role: 'candidate' as const, content: trimmedResponse };
    const updatedMessages = [...preludeMessages, candidateMessage];
    setPreludeMessages(updatedMessages);
    
    // Clear input immediately so user sees their message was sent
    setPreludeResponse("");
    
    // Pass the updated messages to the mutation to avoid stale closure
    preludeMutation.mutate({
      sessionId: activeSession.id,
      response: trimmedResponse,
      currentMessages: updatedMessages
    });
  };

  // Auto-start interview if coming from Journey page with stageId
  useEffect(() => {
    if (user && applicationStageId && !autoStarted && !activeSession) {
      setAutoStarted(true);
      // For Journey mode, don't send totalQuestions - let the backend decide
      // based on interview type (7 for HR/behavioral, 5 for technical)
      startInterviewMutation.mutate({
        userId: user.id,
        interviewType,
        targetRole,
        difficulty,
        applicationStageId,
      });
    }
  }, [user, applicationStageId, autoStarted, activeSession]);
  
  // Track elapsed time during prelude
  useEffect(() => {
    if (isPreludeMode && activeSession && !preludeStartTime) {
      setPreludeStartTime(Date.now());
    }
    
    if (!isPreludeMode || !preludeStartTime) return;
    
    // Immediate update
    const elapsed = Math.floor((Date.now() - preludeStartTime) / 60000);
    setPreludeElapsedMinutes(elapsed);
    
    // Update every 10 seconds
    const timer = setInterval(() => {
      const elapsedNow = Math.floor((Date.now() - preludeStartTime) / 60000);
      setPreludeElapsedMinutes(elapsedNow);
    }, 10000);
    
    return () => clearInterval(timer);
  }, [isPreludeMode, activeSession, preludeStartTime]);

  const handleStartInterview = () => {
    if (!user) return;

    // For Journey mode, don't send totalQuestions - let the backend decide
    // For Practice mode, send the user-selected totalQuestions
    const mutationData: any = {
      userId: user.id,
      interviewType,
      targetRole,
      difficulty,
    };
    
    if (applicationStageId) {
      mutationData.applicationStageId = applicationStageId;
    } else {
      // Only include totalQuestions for Practice mode
      mutationData.totalQuestions = totalQuestions[0];
    }

    startInterviewMutation.mutate(mutationData);
  };

  // Show loading if in Journey mode and interview is starting
  if (isJourneyMode && startInterviewMutation.isPending) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Starting your interview...</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Preparing your interview session</p>
        </div>
      </div>
    );
  }

  // Show conversational prelude UI - matches LangchainInterviewSession styling
  if (activeSession && isPreludeMode) {
    const interviewTypeLabel = activeSession.interviewType.charAt(0).toUpperCase() + activeSession.interviewType.slice(1);
    
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col p-4">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {interviewTypeLabel} Interview
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {activeSession.targetRole} • {activeSession.difficulty} level
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Time-based pacing indicator */}
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {preludeElapsedMinutes} min
                  </span>
                </div>
                
                {/* Status chip */}
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-0.5 border-blue-200 bg-blue-50 text-blue-700"
                  data-testid="badge-pacing-status"
                >
                  Getting started
                </Badge>
                
                {/* Progress ring */}
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 transform -rotate-90">
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${Math.min(preludeElapsedMinutes * 3, 75)} 100`}
                      className="text-blue-500"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {preludeMessages.map((msg, index) => {
              const personaStyle = msg.role === 'interviewer' ? getPersonaStyle(msg.personaId, isTeamInterview, teamPersonas) : null;
              
              return (
              <div
                key={index}
                className={cn(
                  "flex items-start space-x-3",
                  msg.role === 'candidate' && "flex-row-reverse space-x-reverse"
                )}
                data-testid={`prelude-message-${msg.role}-${index}`}
              >
                <Avatar className={cn(
                  "h-10 w-10 shrink-0",
                  msg.role === 'interviewer' 
                    ? (personaStyle?.bgColor || "bg-blue-100") 
                    : "bg-green-100"
                )}>
                  <AvatarFallback className={cn(
                    "font-semibold",
                    msg.role === 'interviewer' ? personaStyle?.textColor : "text-green-600"
                  )}>
                    {msg.role === 'interviewer' ? (
                      isTeamInterview && personaStyle?.initials ? personaStyle.initials : <Bot className={cn("h-5 w-5", personaStyle?.iconColor || "text-blue-600")} />
                    ) : (
                      <UserIcon className="h-5 w-5 text-green-600" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "max-w-[70%] rounded-lg p-4",
                  msg.role === 'interviewer' 
                    ? cn(
                        personaStyle?.messageBg || "bg-blue-50",
                        "text-gray-900",
                        isTeamInterview && personaStyle && "border-l-4",
                        isTeamInterview && personaStyle?.borderColor
                      )
                    : "bg-green-50 text-gray-900"
                )}>
                  {/* Show persona name and role for team interviews with enhanced styling */}
                  {isTeamInterview && msg.role === 'interviewer' && personaStyle && personaStyle.name !== 'Interviewer' && (
                    <div className="mb-2 pb-2 border-b border-gray-200/50 flex items-center gap-2">
                      <span className={cn("font-semibold text-sm", personaStyle.textColor)}>
                        {personaStyle.name}
                      </span>
                      {personaStyle.displayRole && (
                        <span className={cn("text-[10px] px-1.5 py-0 border rounded-full", personaStyle.borderColor)}>
                          {personaStyle.displayRole}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
            })}
            
            {isPreludeSubmitting && (() => {
              // For typing indicator, use the first persona (who is currently speaking)
              const typingPersonaStyle = getPersonaStyle(teamPersonas.length > 0 ? teamPersonas[0].id : undefined, isTeamInterview, teamPersonas);
              return (
              <div className="flex items-start space-x-3">
                <Avatar className={cn("h-10 w-10", typingPersonaStyle.bgColor)}>
                  <AvatarFallback className={cn("font-semibold", typingPersonaStyle.textColor)}>
                    {isTeamInterview && typingPersonaStyle.initials ? typingPersonaStyle.initials : <Bot className={cn("h-5 w-5", typingPersonaStyle.iconColor)} />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  typingPersonaStyle.messageBg, 
                  "rounded-lg p-4",
                  isTeamInterview && "border-l-4",
                  isTeamInterview && typingPersonaStyle.borderColor
                )}>
                  {isTeamInterview && typingPersonaStyle.name !== 'Interviewer' && (
                    <div className="mb-2 pb-2 border-b border-gray-200/50 flex items-center gap-2">
                      <span className={cn("font-semibold text-sm", typingPersonaStyle.textColor)}>
                        {typingPersonaStyle.name}
                      </span>
                      {typingPersonaStyle.displayRole && (
                        <span className={cn("text-[10px] px-1.5 py-0 border rounded-full", typingPersonaStyle.borderColor)}>
                          {typingPersonaStyle.displayRole}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className={cn("w-2 h-2 rounded-full animate-bounce", isTeamInterview ? typingPersonaStyle.accentColor : "bg-gray-400")} style={{ animationDelay: '0ms' }} />
                      <div className={cn("w-2 h-2 rounded-full animate-bounce", isTeamInterview ? typingPersonaStyle.accentColor : "bg-gray-400")} style={{ animationDelay: '150ms' }} />
                      <div className={cn("w-2 h-2 rounded-full animate-bounce", isTeamInterview ? typingPersonaStyle.accentColor : "bg-gray-400")} style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-500">typing...</span>
                  </div>
                </div>
              </div>
            );
            })()}
            
            {/* Scroll anchor */}
            <div ref={preludeMessagesEndRef} />
          </CardContent>

          <div className="flex-shrink-0 border-t p-4">
            <div className="flex space-x-3">
              <Textarea
                value={preludeResponse}
                onChange={(e) => setPreludeResponse(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePreludeSubmit();
                  }
                }}
                placeholder="Type your response here... (Press Enter to send, Shift+Enter for new line)"
                className="flex-1 min-h-[80px] resize-none"
                disabled={isPreludeSubmitting}
                data-testid="input-prelude-response"
              />
              <Button 
                onClick={handlePreludeSubmit}
                disabled={!preludeResponse.trim() || isPreludeSubmitting}
                className="self-end"
                data-testid="button-send-prelude"
              >
                {isPreludeSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (activeSession && activeFirstQuestion) {
    return (
      <LangchainInterviewSession
        session={activeSession}
        firstQuestion={activeFirstQuestion}
        introduction={activeIntroduction}
        preludeMessages={completedPreludeMessages.length > 0 ? completedPreludeMessages : undefined}
        mode={isJourneyMode ? "journey" : "practice"}
        isTeamInterview={isTeamInterview}
        teamPersonas={teamPersonas}
        onComplete={() => {
          setActiveSession(null);
          setActiveFirstQuestion(null);
          queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "interviews"] });
          
          // If this was part of a job application, redirect to journey page
          if (applicationStageId && user?.id) {
            // Invalidate with the exact query key format used in journey.tsx
            queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/applications`] });
            toast({
              title: "Interview Completed!",
              description: "Your application has been updated. Check your journey for next steps.",
            });
            navigate('/journey');
          } else {
            // Practice mode: show practice results
            toast({
              title: "Interview Complete!",
              description: "Great job! You can start another practice session anytime.",
            });
            navigate('/interview');
          }
        }}
      />
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Mode Banner */}
        <ModeBanner 
          mode={isJourneyMode ? "journey" : "practice"} 
          variant="banner"
        />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isJourneyMode ? "Complete Your Interview" : "Interview Simulator"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isJourneyMode 
              ? "This interview is part of your job application — your performance will be evaluated"
              : "Build your interview skills with AI-powered feedback — no real stakes"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-blue-600" />
              Configure Your Interview
            </CardTitle>
            <CardDescription>
              {isJourneyMode 
                ? "Review and confirm your interview settings before starting"
                : "Customize your practice session to match your target role and interview type"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Target Role</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {targetRoles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <Button
                      key={role.value}
                      variant={targetRole === role.value ? "default" : "outline"}
                      className={cn(
                        "h-auto py-4 flex flex-col items-center justify-center",
                        targetRole === role.value && "bg-blue-600 hover:bg-blue-700"
                      )}
                      onClick={() => setTargetRole(role.value)}
                      data-testid={`button-role-${role.value}`}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-sm">{role.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Interview Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {interviewTypes.map((type) => (
                  <div
                    key={type.value}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-all",
                      interviewType === type.value 
                        ? "border-blue-600 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setInterviewType(type.value)}
                    data-testid={`card-interview-type-${type.value}`}
                  >
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Difficulty Level</Label>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map((diff) => (
                  <Button
                    key={diff.value}
                    variant={difficulty === diff.value ? "default" : "outline"}
                    className={cn(
                      "h-auto py-3 flex flex-col",
                      difficulty === diff.value && "bg-blue-600 hover:bg-blue-700"
                    )}
                    onClick={() => setDifficulty(diff.value)}
                    data-testid={`button-difficulty-${diff.value}`}
                  >
                    <span className="font-medium">{diff.label}</span>
                    <span className="text-xs opacity-80">{diff.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-gray-700">Number of Questions</Label>
                <span className="text-sm font-semibold text-blue-600">{totalQuestions[0]} questions</span>
              </div>
              <Slider
                value={totalQuestions}
                onValueChange={setTotalQuestions}
                min={3}
                max={10}
                step={1}
                className="w-full"
                data-testid="slider-questions"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Quick (3)</span>
                <span>Standard (5-7)</span>
                <span>Thorough (10)</span>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleStartInterview}
                disabled={startInterviewMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 px-8"
                data-testid="button-start-interview"
              >
                {startInterviewMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-5 w-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start Interview
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {interviewHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Interview History
              </CardTitle>
              <CardDescription>
                Review your past interview sessions and track your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interviewHistory.map((session: any) => (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`card-history-${session.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        session.status === 'completed' ? "bg-green-100" : "bg-yellow-100"
                      )}>
                        <MessageCircle className={cn(
                          "h-6 w-6",
                          session.status === 'completed' ? "text-green-600" : "text-yellow-600"
                        )} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {session.interviewType.charAt(0).toUpperCase() + session.interviewType.slice(1)} Interview
                        </h4>
                        <p className="text-sm text-gray-500">
                          {session.targetRole} • {session.difficulty} level
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={session.status === 'completed' ? "default" : "secondary"}>
                        {session.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                      {session.overallScore && (
                        <div className="text-right">
                          <div className={cn(
                            "text-lg font-bold",
                            session.overallScore >= 80 ? "text-green-600" :
                            session.overallScore >= 60 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {session.overallScore}%
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
