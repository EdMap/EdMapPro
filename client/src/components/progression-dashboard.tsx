import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  useProgressionSummary, 
  useExitEligibility, 
  useCurrentSprint,
  useGraduateJourney,
  type ExitEligibility
} from "@/hooks/use-progression";
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Target, 
  Award,
  ChevronRight,
  Zap,
  AlertCircle,
  Loader2,
  GraduationCap
} from "lucide-react";
import type { ReadinessScore, MasteryBand } from "@shared/schema";

type CompetencyBreakdown = ReadinessScore['competencyBreakdown'][number];

interface ProgressionDashboardProps {
  journeyId: number;
  userId: number;
  onStartActivity?: () => void;
  onViewSnapshots?: () => void;
  compact?: boolean;
}

function getBandColor(band: MasteryBand | string): string {
  switch (band) {
    case 'explorer':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'contributor':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'junior_ready':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getBandLabel(band: MasteryBand | string): string {
  switch (band) {
    case 'explorer':
      return 'Explorer';
    case 'contributor':
      return 'Contributor';
    case 'junior_ready':
      return 'Junior Ready';
    default:
      return band;
  }
}

function getReadinessColor(score: number): string {
  if (score >= 85) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-gray-600';
}

function ReadinessScoreCard({ readiness }: { readiness: ReadinessScore }) {
  return (
    <Card data-testid="card-readiness-score">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Overall Readiness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-3">
          <span className={`text-4xl font-bold ${getReadinessColor(readiness.overallScore)}`}>
            {readiness.overallScore}%
          </span>
          <span className="text-gray-500 text-sm mb-1">of Junior Ready</span>
        </div>
        <Progress 
          value={readiness.overallScore} 
          className="h-2 mb-3"
          data-testid="progress-readiness"
        />
        <div className="flex flex-wrap gap-2">
          {readiness.strengths?.slice(0, 3).map((strength, i) => (
            <Badge key={i} variant="secondary" className="bg-green-50 text-green-700 text-xs">
              {strength}
            </Badge>
          ))}
        </div>
        {readiness.gaps && readiness.gaps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {readiness.gaps.slice(0, 2).map((gap, i) => (
              <Badge key={i} variant="outline" className="text-amber-700 border-amber-200 text-xs">
                Focus: {gap}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SprintProgressCard({ 
  journeyId,
  completedSprints,
  currentSprintNumber 
}: { 
  journeyId: number;
  completedSprints: number;
  currentSprintNumber: number;
}) {
  const { data: sprintData, isLoading } = useCurrentSprint(journeyId);
  
  if (isLoading) {
    return (
      <Card data-testid="card-sprint-progress">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const activitiesCompleted = sprintData?.activities?.filter(a => a.status === 'completed').length || 0;
  const totalActivities = sprintData?.activities?.length || 0;
  const progressPercent = totalActivities > 0 ? Math.round((activitiesCompleted / totalActivities) * 100) : 0;

  return (
    <Card data-testid="card-sprint-progress">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Sprint {currentSprintNumber} Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-4xl font-bold text-gray-900">{activitiesCompleted}</span>
          <span className="text-gray-500 text-sm mb-1">of {totalActivities} activities</span>
        </div>
        <Progress 
          value={progressPercent} 
          className="h-2 mb-3"
          data-testid="progress-sprint-activities"
        />
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{completedSprints} sprints completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExitEligibilityCard({ 
  eligibility,
  onGraduate,
  isGraduating
}: { 
  eligibility: ExitEligibility;
  onGraduate: () => void;
  isGraduating: boolean;
}) {
  const getStatusIcon = () => {
    if (eligibility.recommendation === 'ready') {
      return <Award className="h-5 w-5 text-green-500" />;
    }
    if (eligibility.recommendation === 'suggest_exit') {
      return <GraduationCap className="h-5 w-5 text-blue-500" />;
    }
    return <Clock className="h-5 w-5 text-amber-500" />;
  };

  const getStatusBadge = () => {
    if (eligibility.recommendation === 'ready') {
      return <Badge className="bg-green-100 text-green-800">Ready to Graduate</Badge>;
    }
    if (eligibility.recommendation === 'suggest_exit') {
      return <Badge className="bg-blue-100 text-blue-800">Graduation Recommended</Badge>;
    }
    return <Badge variant="secondary">In Progress</Badge>;
  };

  return (
    <Card data-testid="card-exit-eligibility">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            {getStatusIcon()}
            Graduation Status
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-4">{eligibility.message}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className={`flex items-center gap-2 text-xs ${
            eligibility.reasons.minSprintsMet ? 'text-green-600' : 'text-gray-400'
          }`}>
            {eligibility.reasons.minSprintsMet ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            Minimum sprints
          </div>
          <div className={`flex items-center gap-2 text-xs ${
            eligibility.reasons.readinessThresholdMet ? 'text-green-600' : 'text-gray-400'
          }`}>
            {eligibility.reasons.readinessThresholdMet ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            Readiness threshold
          </div>
        </div>

        {eligibility.canExit && (
          <Button 
            className="w-full"
            onClick={onGraduate}
            disabled={isGraduating}
            data-testid="button-graduate"
          >
            {isGraduating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <GraduationCap className="h-4 w-4 mr-2" />
                Graduate Now
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CompetencyBreakdownCard({ breakdown }: { breakdown: CompetencyBreakdown[] }) {
  return (
    <Card data-testid="card-competency-breakdown">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Competency Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {breakdown.slice(0, 5).map((comp) => (
            <div key={comp.slug} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {comp.slug.replace(/-/g, ' ')}
                </span>
                <Badge className={`text-xs ${getBandColor(comp.band)}`}>
                  {getBandLabel(comp.band)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={comp.confidence} 
                  className="h-1.5 flex-1"
                  data-testid={`progress-competency-${comp.slug}`}
                />
                <span className="text-xs text-gray-500 w-8">{comp.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
        {breakdown.length > 5 && (
          <p className="text-xs text-gray-500 mt-3">
            +{breakdown.length - 5} more competencies
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ProgressionDashboard({ 
  journeyId, 
  userId,
  onStartActivity,
  onViewSnapshots,
  compact = false 
}: ProgressionDashboardProps) {
  const { data: summary, isLoading: summaryLoading } = useProgressionSummary(journeyId);
  const { data: eligibility, isLoading: eligibilityLoading } = useExitEligibility(journeyId);
  
  const graduateMutation = useGraduateJourney();

  const handleGraduate = () => {
    const trigger = eligibility?.reasons.readinessThresholdMet 
      ? 'readiness_threshold' 
      : eligibility?.reasons.maxSprintsReached 
        ? 'max_sprints' 
        : 'user_choice';
    
    graduateMutation.mutate({ journeyId, exitTrigger: trigger });
  };

  if (summaryLoading || eligibilityLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!summary || !eligibility) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No journey data available
        </CardContent>
      </Card>
    );
  }

  const { journey, readiness } = summary;

  if (compact) {
    return (
      <Card data-testid="card-progression-compact">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-400" />
                <span className={`font-bold ${getReadinessColor(readiness.overallScore)}`}>
                  {readiness.overallScore}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Sprint {journey.currentSprintNumber}
                </span>
              </div>
            </div>
            {onStartActivity && (
              <Button size="sm" onClick={onStartActivity} data-testid="button-continue-activity">
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="container-progression-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReadinessScoreCard readiness={readiness} />
        <SprintProgressCard 
          journeyId={journeyId}
          completedSprints={journey.completedSprints}
          currentSprintNumber={journey.currentSprintNumber}
        />
        <ExitEligibilityCard 
          eligibility={eligibility}
          onGraduate={handleGraduate}
          isGraduating={graduateMutation.isPending}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompetencyBreakdownCard breakdown={readiness.competencyBreakdown} />
        
        <Card data-testid="card-journey-stats">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Journey Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{journey.completedSprints}</p>
                <p className="text-xs text-gray-500">Sprints Completed</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{journey.currentSprintNumber}</p>
                <p className="text-xs text-gray-500">Current Sprint</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{summary.arcs.length}</p>
                <p className="text-xs text-gray-500">Total Arcs</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{summary.snapshots.length}</p>
                <p className="text-xs text-gray-500">Checkpoints</p>
              </div>
            </div>
            
            {onViewSnapshots && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={onViewSnapshots}
                data-testid="button-view-snapshots"
              >
                View Progress History
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ProgressionDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
