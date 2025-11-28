import { useState, useEffect } from "react";
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
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User, InterviewSession } from "@shared/schema";

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
  const [preludeMessages, setPreludeMessages] = useState<Array<{role: 'interviewer' | 'candidate', content: string}>>([]);
  const [preludeResponse, setPreludeResponse] = useState("");
  const [isPreludeSubmitting, setIsPreludeSubmitting] = useState(false);

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
    if (type && ['behavioral', 'technical', 'system-design', 'case-study'].includes(type)) {
      setInterviewType(type);
    }
    if (role && ['developer', 'pm', 'designer', 'data-scientist'].includes(role)) {
      setTargetRole(role);
    }
  }, [searchString]);

  const { data: user } = useQuery<User>({
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
      
      if (result.isPreludeMode && result.greeting) {
        // Enter conversational prelude mode
        setIsPreludeMode(true);
        setPreludeMessages([{ role: 'interviewer', content: result.greeting }]);
      } else {
        // Legacy flow without prelude
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
    mutationFn: async ({ sessionId, response }: { sessionId: number; response: string }) => {
      const res = await apiRequest("POST", `/api/interviews/${sessionId}/prelude`, { response });
      return res.json();
    },
    onSuccess: (result) => {
      setIsPreludeSubmitting(false);
      setPreludeResponse("");
      
      if (result.preludeComplete && result.firstQuestion) {
        // Prelude is done, transition to real interview
        setIsPreludeMode(false);
        setActiveFirstQuestion(result.firstQuestion);
        // Keep prelude messages as the introduction context
        setActiveIntroduction(preludeMessages.map(m => m.content).join('\n\n'));
      } else if (result.preludeMessage) {
        // Add interviewer's response to prelude messages
        setPreludeMessages(prev => [...prev, { role: 'interviewer', content: result.preludeMessage }]);
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
    
    setIsPreludeSubmitting(true);
    setPreludeMessages(prev => [...prev, { role: 'candidate', content: preludeResponse }]);
    
    preludeMutation.mutate({
      sessionId: activeSession.id,
      response: preludeResponse.trim()
    });
  };

  // Auto-start interview if coming from Journey page with stageId
  useEffect(() => {
    if (user && applicationStageId && !autoStarted && !activeSession) {
      setAutoStarted(true);
      startInterviewMutation.mutate({
        userId: user.id,
        interviewType,
        targetRole,
        difficulty,
        totalQuestions: totalQuestions[0],
        applicationStageId,
      });
    }
  }, [user, applicationStageId, autoStarted, activeSession]);

  const handleStartInterview = () => {
    if (!user) return;

    startInterviewMutation.mutate({
      userId: user.id,
      interviewType,
      targetRole,
      difficulty,
      totalQuestions: totalQuestions[0],
      applicationStageId: applicationStageId || undefined,
    });
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

  // Show conversational prelude UI
  if (activeSession && isPreludeMode) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <ModeBanner mode="journey" variant="banner" />
        
        <Card className="mt-6">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Getting Started</h2>
                <p className="text-sm text-gray-500">Let's get to know each other before we dive in</p>
              </div>
            </div>
            
            {/* Messages */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {preludeMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex gap-3",
                    msg.role === 'candidate' && "justify-end"
                  )}
                >
                  {msg.role === 'interviewer' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div 
                    className={cn(
                      "rounded-lg px-4 py-3 max-w-[80%]",
                      msg.role === 'interviewer' 
                        ? "bg-gray-100 dark:bg-gray-800" 
                        : "bg-blue-600 text-white"
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  {msg.role === 'candidate' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Play className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isPreludeSubmitting && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={preludeResponse}
                onChange={(e) => setPreludeResponse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePreludeSubmit()}
                placeholder="Type your response..."
                disabled={isPreludeSubmitting}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                data-testid="input-prelude-response"
              />
              <Button 
                onClick={handlePreludeSubmit} 
                disabled={!preludeResponse.trim() || isPreludeSubmitting}
                data-testid="button-send-prelude"
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
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
        mode={isJourneyMode ? "journey" : "practice"}
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
