import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  Target, 
  TrendingUp,
  Users,
  Play,
  ArrowRight,
  Trophy,
  BarChart3,
  Rocket,
  Zap,
} from "lucide-react";
import { useJourneyDashboard, type MasteryBand } from "@/hooks/use-sprint-workflow";

function getBandColor(band: MasteryBand): string {
  switch (band) {
    case 'explorer': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'contributor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'junior_ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getBandLabel(band: MasteryBand): string {
  switch (band) {
    case 'explorer': return 'Explorer';
    case 'contributor': return 'Contributor';
    case 'junior_ready': return 'Junior Ready';
    default: return band;
  }
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function JourneyDashboard() {
  const params = useParams<{ journeyId: string }>();
  const journeyId = params.journeyId ? parseInt(params.journeyId) : null;
  
  const { data: dashboard, isLoading, error } = useJourneyDashboard(journeyId);

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-6" data-testid="journey-dashboard-loading">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="container max-w-7xl mx-auto p-6" data-testid="journey-dashboard-error">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Journey</CardTitle>
            <CardDescription>
              {error?.message || 'Journey not found. Please check the URL and try again.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { journey, currentArc, currentSprint, readinessScore, competencyScores, timeline, canGraduate, estimatedSprintsRemaining } = dashboard;

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6" data-testid="journey-dashboard">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-journey-title">
            Your Journey Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress toward becoming Junior Ready
          </p>
        </div>
        
        {canGraduate && (
          <Link href={`/journey/${journeyId}/graduate`}>
            <Button size="lg" className="gap-2" data-testid="button-graduate">
              <Trophy className="h-5 w-5" />
              Graduate Now
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="card-readiness">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold" data-testid="text-readiness-score">{readinessScore}%</span>
              <span className="text-sm text-muted-foreground mb-1">of 85% target</span>
            </div>
            <Progress value={readinessScore} max={100} className="mt-3 h-2" />
            {readinessScore >= 85 ? (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                You've reached the graduation threshold!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                ~{estimatedSprintsRemaining} sprint(s) to reach 85%
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-sprint-progress">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Sprint Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold" data-testid="text-sprints-completed">
                {journey.completedSprints}
              </span>
              <span className="text-sm text-muted-foreground mb-1">sprints completed</span>
            </div>
            {currentSprint ? (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Current: Day {currentSprint.currentDay}/10</span>
                  <span className="text-muted-foreground">
                    {currentSprint.ticketStats.done}/{currentSprint.tickets.length} tickets
                  </span>
                </div>
                <Progress 
                  value={(currentSprint.currentDay / 10) * 100} 
                  className="h-2" 
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">
                No active sprint
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-current-arc">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Current Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold capitalize" data-testid="text-arc-type">
                {currentArc?.arcType || 'Not started'}
              </span>
            </div>
            {currentArc && (
              <>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentArc.arcType === 'onboarding' ? 'Getting set up' : `Sprint ${currentArc.arcOrder - 1}`}
                </p>
                <Badge 
                  variant="outline" 
                  className="mt-3"
                  data-testid="badge-arc-status"
                >
                  {currentArc.status}
                </Badge>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {currentSprint && (
        <Card data-testid="card-active-sprint">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Active Sprint
                </CardTitle>
                <CardDescription className="mt-1">
                  {currentSprint.sprint.theme} - {currentSprint.sprint.goal}
                </CardDescription>
              </div>
              <Link href={`/journey/${journeyId}/sprint/${currentSprint.sprint.id}`}>
                <Button className="gap-2" data-testid="button-enter-sprint">
                  <Play className="h-4 w-4" />
                  Enter Sprint
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Todo</p>
                <p className="text-2xl font-semibold" data-testid="text-tickets-todo">
                  {currentSprint.ticketStats.todo}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-semibold text-blue-600" data-testid="text-tickets-in-progress">
                  {currentSprint.ticketStats.inProgress}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">In Review</p>
                <p className="text-2xl font-semibold text-amber-600" data-testid="text-tickets-in-review">
                  {currentSprint.ticketStats.inReview}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Done</p>
                <p className="text-2xl font-semibold text-green-600" data-testid="text-tickets-done">
                  {currentSprint.ticketStats.done}
                </p>
              </div>
            </div>
            
            {currentSprint.upcomingCeremonies.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Upcoming Ceremonies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentSprint.upcomingCeremonies.slice(0, 3).map(ceremony => (
                      <Link 
                        key={ceremony.id} 
                        href={`/journey/${journeyId}/sprint/${currentSprint.sprint.id}/ceremony/${ceremony.id}`}
                      >
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-secondary/80"
                          data-testid={`badge-ceremony-${ceremony.id}`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {ceremony.ceremonyType}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-competencies">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Competency Progress
            </CardTitle>
            <CardDescription>
              Your skill levels across key competencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(competencyScores).map(([slug, { score, band }]) => (
                <div key={slug} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {slug.replace(/_/g, ' ')}
                    </span>
                    <Badge 
                      className={getBandColor(band)}
                      data-testid={`badge-competency-${slug}`}
                    >
                      {getBandLabel(band)}
                    </Badge>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
              {Object.keys(competencyScores).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete activities to track competency progress
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-timeline">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Journey Timeline
            </CardTitle>
            <CardDescription>
              Your path from start to graduation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeline.arcs.map((arc, arcIndex) => (
                <div 
                  key={arc.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    arcIndex === timeline.currentPosition.arcIndex
                      ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                      : arc.status === 'completed'
                      ? 'bg-green-50 dark:bg-green-950'
                      : 'bg-muted/50'
                  }`}
                  data-testid={`timeline-arc-${arc.id}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    arc.status === 'completed'
                      ? 'bg-green-500 text-white'
                      : arc.status === 'in_progress'
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {arc.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : arc.arcType === 'onboarding' ? (
                      <Rocket className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">{arc.arcOrder - 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {arc.arcType === 'onboarding' ? 'Onboarding' : `Sprint ${arc.arcOrder - 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {arc.sprints.length > 0 && arc.sprints[0].theme}
                    </p>
                  </div>
                  {arcIndex === timeline.currentPosition.arcIndex && (
                    <Badge variant="outline" className="text-blue-600">
                      Current
                    </Badge>
                  )}
                </div>
              ))}
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border-2 border-dashed">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Graduation</p>
                  <p className="text-xs text-muted-foreground">
                    {canGraduate ? 'Ready to graduate!' : `${estimatedSprintsRemaining} sprint(s) away`}
                  </p>
                </div>
                {canGraduate && (
                  <Badge className="bg-green-500">Ready!</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50" data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {currentSprint && (
              <>
                <Link href={`/journey/${journeyId}/sprint/${currentSprint.sprint.id}`}>
                  <Button variant="outline" className="gap-2" data-testid="button-view-kanban">
                    <GitBranch className="h-4 w-4" />
                    View Kanban Board
                  </Button>
                </Link>
                <Link href={`/journey/${journeyId}/sprint/${currentSprint.sprint.id}/standup`}>
                  <Button variant="outline" className="gap-2" data-testid="button-daily-standup">
                    <Users className="h-4 w-4" />
                    Daily Standup
                  </Button>
                </Link>
              </>
            )}
            <Link href={`/journey/${journeyId}/portfolio`}>
              <Button variant="outline" className="gap-2" data-testid="button-view-portfolio">
                <BarChart3 className="h-4 w-4" />
                View Portfolio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
