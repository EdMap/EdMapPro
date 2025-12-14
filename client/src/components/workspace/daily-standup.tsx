import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import {
  Sun,
  Clock,
  Target,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  Lightbulb,
  Users,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getStandupAdapter } from "@shared/adapters/standup";
import type { Role, Level } from "@shared/adapters";
import type { TeamFeedbackResponse, StandupPersona } from "@shared/adapters/standup";
import type { SprintTicket } from "@shared/schema";

interface DailyStandupProps {
  workspaceId: number;
  sprintId: number;
  sprintDay: number;
  role: string;
  level?: string;
  tickets: SprintTicket[];
  companyName: string;
  onComplete: () => void;
  onBack?: () => void;
}

export function DailyStandup({
  workspaceId,
  sprintId,
  sprintDay,
  role,
  level = 'intern',
  tickets,
  companyName,
  onComplete,
  onBack,
}: DailyStandupProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [teamFeedback, setTeamFeedback] = useState<TeamFeedbackResponse[]>([]);

  const adapter = useMemo(() => {
    return getStandupAdapter(role as Role, level as Level);
  }, [role, level]);

  const standupFormSchema = useMemo(() => {
    const questions = adapter.questions;
    return z.object({
      yesterday: z.string().min(
        questions.find(q => q.id === 'yesterday')?.minLength || 10,
        `Please describe what you worked on yesterday (at least ${questions.find(q => q.id === 'yesterday')?.minLength || 10} characters)`
      ),
      today: z.string().min(
        questions.find(q => q.id === 'today')?.minLength || 10,
        `Please describe what you plan to work on today (at least ${questions.find(q => q.id === 'today')?.minLength || 10} characters)`
      ),
      blockers: z.string().optional(),
    });
  }, [adapter.questions]);

  type StandupFormData = z.infer<typeof standupFormSchema>;

  const ticketsByStatus = useMemo(() => ({
    todo: tickets.filter(t => t.status === 'todo'),
    in_progress: tickets.filter(t => t.status === 'in_progress'),
    in_review: tickets.filter(t => t.status === 'in_review'),
    done: tickets.filter(t => t.status === 'done'),
  }), [tickets]);

  const totalPoints = tickets.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedPoints = ticketsByStatus.done.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  const form = useForm<StandupFormData>({
    resolver: zodResolver(standupFormSchema),
    defaultValues: {
      yesterday: "",
      today: "",
      blockers: "",
    },
  });

  const completeStandupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/standup/complete",
        { sprintId, sprintDay }
      );
      return response.json();
    },
    onSuccess: () => {
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save standup completion. Continuing anyway.",
        variant: "destructive",
      });
      onComplete();
    },
  });

  const handleCompleteStandup = () => {
    completeStandupMutation.mutate();
  };

  const feedbackMutation = useMutation({
    mutationFn: async (data: StandupFormData) => {
      const response = await apiRequest(
        "POST",
        "/api/standup/feedback",
        {
          context: {
            workspaceId,
            sprintId,
            sprintDay,
            role: role as Role,
            level: level as Level,
            companyName,
            userName: "Developer",
            ticketContext: {
              inProgress: ticketsByStatus.in_progress.map(t => t.ticketKey),
              completed: ticketsByStatus.done.map(t => t.ticketKey),
              blocked: [],
            },
          },
          submission: {
            yesterday: data.yesterday,
            today: data.today,
            blockers: data.blockers || "",
          },
        }
      );
      return response.json() as Promise<{ responses: TeamFeedbackResponse[]; success: boolean }>;
    },
    onSuccess: (data) => {
      setTeamFeedback(data.responses);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get team feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: StandupFormData) => {
    setSubmitted(true);
    feedbackMutation.mutate(data);
    
    toast({
      title: "Standup submitted!",
      description: "Your daily update has been recorded.",
    });
  };

  const getQuestion = (id: string) => adapter.questions.find(q => q.id === id);
  const inProgressTickets = ticketsByStatus.in_progress;
  const suggestedTicket = ticketsByStatus.todo[0];

  return (
    <div className="space-y-6" data-testid="daily-standup">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
            <Sun className="h-6 w-6 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Standup</h2>
            <p className="text-gray-500 dark:text-gray-400">Day {sprintDay} - {companyName} Sprint</p>
          </div>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {adapter.uiConfig.showProgressIndicator && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">To Do</p>
                <p className="text-xl font-semibold">{ticketsByStatus.todo.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-xl font-semibold">{ticketsByStatus.in_progress.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Review</p>
                <p className="text-xl font-semibold">{ticketsByStatus.in_review.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Done</p>
                <p className="text-xl font-semibold">{ticketsByStatus.done.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Your Update
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!submitted ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="yesterday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium">Y</span>
                            {getQuestion('yesterday')?.label || 'What did you work on yesterday?'}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={getQuestion('yesterday')?.placeholder}
                              className="min-h-[100px]"
                              data-testid="input-yesterday"
                            />
                          </FormControl>
                          {adapter.uiConfig.showExamples && getQuestion('yesterday')?.helpText && (
                            <FormDescription>{getQuestion('yesterday')?.helpText}</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="today"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-300">T</span>
                            {getQuestion('today')?.label || 'What will you work on today?'}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={getQuestion('today')?.placeholder}
                              className="min-h-[100px]"
                              data-testid="input-today"
                            />
                          </FormControl>
                          {adapter.uiConfig.showExamples && getQuestion('today')?.helpText && (
                            <FormDescription>{getQuestion('today')?.helpText}</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="blockers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center text-xs font-medium text-red-700 dark:text-red-300">B</span>
                            {getQuestion('blockers')?.label || 'Any blockers or impediments?'}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={getQuestion('blockers')?.placeholder}
                              className="min-h-[80px]"
                              data-testid="input-blockers"
                            />
                          </FormControl>
                          {adapter.uiConfig.showExamples && getQuestion('blockers')?.helpText && (
                            <FormDescription>{getQuestion('blockers')?.helpText}</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end pt-2">
                      <Button type="submit" data-testid="button-submit-standup">
                        Submit Update
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Standup submitted!</span>
                  </div>
                  
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Yesterday</p>
                      <p className="text-sm">{form.getValues('yesterday')}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Today</p>
                      <p className="text-sm">{form.getValues('today')}</p>
                    </div>
                    {form.getValues('blockers') && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">Blockers</p>
                          <p className="text-sm">{form.getValues('blockers')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {submitted && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedbackMutation.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Team is responding...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamFeedback.map((feedback, i) => (
                      <div key={i} className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn("text-white text-xs", feedback.from.color)}>
                            {feedback.from.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{feedback.from.name}</span>
                            <Badge variant="outline" className="text-xs">{feedback.from.role}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{feedback.message}</p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4">
                      <Button 
                        onClick={handleCompleteStandup}
                        disabled={completeStandupMutation.isPending}
                        className="w-full"
                        data-testid="button-continue-to-board"
                      >
                        Continue to Sprint Board
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {adapter.uiConfig.showProgressIndicator && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Sprint Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Story Points</span>
                    <span className="font-medium">{completedPoints}/{totalPoints}</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {progressPercent}% complete
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {adapter.uiConfig.showTeamContext && inProgressTickets.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Currently Working On
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inProgressTickets.map(ticket => (
                    <div key={ticket.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">{ticket.ticketKey}</Badge>
                        <Badge variant="secondary" className="text-xs">{ticket.storyPoints} pts</Badge>
                      </div>
                      <p className="text-sm mt-1 line-clamp-2">{ticket.title}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {adapter.uiConfig.showTeamContext && level === 'intern' && suggestedTicket && inProgressTickets.length === 0 && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Lightbulb className="h-4 w-4" />
                  Suggested Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Consider working on this ticket today:
                </p>
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">{suggestedTicket.ticketKey}</Badge>
                    <Badge variant="secondary" className="text-xs">{suggestedTicket.storyPoints} pts</Badge>
                  </div>
                  <p className="text-sm mt-1">{suggestedTicket.title}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {adapter.uiConfig.showExamples && (
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Lightbulb className="h-4 w-4" />
                  Standup Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    Keep updates concise - aim for 2-3 sentences each
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    Reference specific tickets when possible
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    Don't hesitate to mention blockers - the team is here to help!
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
