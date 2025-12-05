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
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Sun,
  Clock,
  Target,
  AlertTriangle,
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
import { getSprintExecutionAdapter } from "@shared/adapters";
import type { Role, Level } from "@shared/adapters";
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

const standupFormSchema = z.object({
  yesterday: z.string().min(10, "Please describe what you worked on yesterday (at least 10 characters)"),
  today: z.string().min(10, "Please describe what you plan to work on today (at least 10 characters)"),
  blockers: z.string().optional(),
});

type StandupFormData = z.infer<typeof standupFormSchema>;

interface TeamFeedback {
  from: string;
  role: string;
  message: string;
  color: string;
}

const TEAM_PERSONAS = {
  priya: { name: "Priya", role: "Product Manager", initials: "PK", color: "bg-indigo-500" },
  marcus: { name: "Marcus", role: "Senior Developer", initials: "MC", color: "bg-amber-500" },
  alex: { name: "Alex", role: "QA Engineer", initials: "AW", color: "bg-teal-500" },
  sarah: { name: "Sarah", role: "Tech Lead", initials: "ST", color: "bg-purple-500" },
};

function getPlaceholders(level: string) {
  if (level === 'intern') {
    return {
      yesterday: "Example: Yesterday I reviewed the TICKET-101 requirements and set up my feature branch. I also looked at the existing codebase to understand the patterns being used.",
      today: "Example: Today I plan to implement the main logic for TICKET-101 and write initial unit tests. If I have time, I'll start on the UI components.",
      blockers: "Example: I'm not sure how to properly test the date formatting function. Could use guidance on the testing patterns we use.",
    };
  }
  return {
    yesterday: "What did you accomplish?",
    today: "What are you planning to work on?",
    blockers: "Any impediments or blockers?",
  };
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
  const [teamFeedback, setTeamFeedback] = useState<TeamFeedback[]>([]);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  const adapter = useMemo(() => {
    return getSprintExecutionAdapter(role as Role, level as Level);
  }, [role, level]);

  const placeholders = useMemo(() => getPlaceholders(level), [level]);

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

  const generateFeedback = async (data: StandupFormData) => {
    setIsGeneratingFeedback(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const feedback: TeamFeedback[] = [];
    
    feedback.push({
      from: TEAM_PERSONAS.priya.name,
      role: TEAM_PERSONAS.priya.role,
      message: `Thanks for the update! ${data.today.includes('TICKET') || data.today.includes('ticket') ? "Good focus on the tickets." : "Make sure to tie your work back to specific tickets."} Let me know if priorities need to shift.`,
      color: TEAM_PERSONAS.priya.color,
    });

    if (role === 'developer' || role === 'qa') {
      feedback.push({
        from: TEAM_PERSONAS.marcus.name,
        role: TEAM_PERSONAS.marcus.role,
        message: level === 'intern' 
          ? "Good progress! Remember to commit frequently and push your changes. Happy to pair if you need help with any tricky parts."
          : "Solid update. Let me know if you hit any technical roadblocks.",
        color: TEAM_PERSONAS.marcus.color,
      });
    }

    if (data.blockers && data.blockers.trim().length > 0) {
      feedback.push({
        from: TEAM_PERSONAS.sarah.name,
        role: TEAM_PERSONAS.sarah.role,
        message: `I noticed you mentioned a blocker. Let's sync after standup to see how we can unblock you. ${level === 'intern' ? "Don't hesitate to ask for help - that's what the team is here for!" : ""}`,
        color: TEAM_PERSONAS.sarah.color,
      });
    }

    if (ticketsByStatus.in_review.length > 0) {
      feedback.push({
        from: TEAM_PERSONAS.alex.name,
        role: TEAM_PERSONAS.alex.role,
        message: `I see there are ${ticketsByStatus.in_review.length} item(s) in review. I'll prioritize looking at those today.`,
        color: TEAM_PERSONAS.alex.color,
      });
    }

    setTeamFeedback(feedback);
    setIsGeneratingFeedback(false);
  };

  const onSubmit = async (data: StandupFormData) => {
    setSubmitted(true);
    await generateFeedback(data);
    
    toast({
      title: "Standup submitted!",
      description: "Your daily update has been recorded.",
    });
  };

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
                            What did you work on yesterday?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={placeholders.yesterday}
                              className="min-h-[100px]"
                              data-testid="input-yesterday"
                            />
                          </FormControl>
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
                            What will you work on today?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={placeholders.today}
                              className="min-h-[100px]"
                              data-testid="input-today"
                            />
                          </FormControl>
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
                            Any blockers or impediments?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={placeholders.blockers}
                              className="min-h-[80px]"
                              data-testid="input-blockers"
                            />
                          </FormControl>
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
                {isGeneratingFeedback ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Team is responding...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamFeedback.map((feedback, i) => (
                      <div key={i} className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn("text-white text-xs", feedback.color)}>
                            {feedback.from[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{feedback.from}</span>
                            <Badge variant="outline" className="text-xs">{feedback.role}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{feedback.message}</p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4">
                      <Button 
                        onClick={onComplete} 
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

          {inProgressTickets.length > 0 && (
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

          {level === 'intern' && suggestedTicket && inProgressTickets.length === 0 && (
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

          {adapter.uiControls.showMentorHints && (
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
