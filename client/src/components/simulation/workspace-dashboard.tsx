import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Award, 
  Code, 
  Briefcase, 
  Palette, 
  TestTube, 
  Server,
  CheckCircle2,
  PlayCircle,
  Users,
  Target
} from "lucide-react";

interface WorkspaceDashboardProps {
  userId: number;
  onResumeSession?: (session: any) => void;
  onStartNew?: () => void;
}

export default function WorkspaceDashboard({ userId, onResumeSession, onStartNew }: WorkspaceDashboardProps) {
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/user', userId, 'sessions'],
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/user', userId, 'progress'],
  });

  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  const progressArray = Array.isArray(progress) ? progress : [];
  
  const workspaceSessions = sessionsArray.filter((s: any) => s.type === 'workspace');
  const activeSessions = workspaceSessions.filter((s: any) => s.status === 'active');
  const completedSessions = workspaceSessions.filter((s: any) => s.status === 'completed');
  const workspaceProgress = progressArray.find((p: any) => p.simulationType === 'workspace');

  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, any> = {
      'Developer': Code,
      'Product Manager': Briefcase,
      'Designer': Palette,
      'QA Engineer': TestTube,
      'DevOps Engineer': Server
    };
    return icons[roleName] || Code;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'paused': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateCompletionRate = () => {
    if (!workspaceProgress) return 0;
    const total = workspaceProgress.totalSessions || 0;
    const completed = workspaceProgress.completedSessions || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (sessionsLoading || progressLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="metric-total-sessions">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Sessions</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {workspaceProgress?.totalSessions || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-completed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Completed</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {workspaceProgress?.completedSessions || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-avg-score">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Avg Score</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {workspaceProgress?.averageScore || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-time-spent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Time Spent</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {workspaceProgress?.timeSpent || 0}
                  <span className="text-lg text-gray-600 ml-1">min</span>
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sessions - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="card-active-sessions">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Active Sessions</CardTitle>
                  <CardDescription>Continue your ongoing workspace simulations</CardDescription>
                </div>
                <Button 
                  onClick={onStartNew}
                  size="sm"
                  data-testid="button-start-new"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <div className="text-center py-8" data-testid="empty-active-sessions">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No active sessions</p>
                  <p className="text-sm text-gray-500 mt-1">Start a new workspace simulation to begin practicing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((session: any) => (
                    <div 
                      key={session.id}
                      className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
                      data-testid={`session-active-${session.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {session.configuration?.projectName || 'Workspace Project'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(session.status)}>
                              {session.status}
                            </Badge>
                            {session.configuration?.activeRole && (() => {
                              const Icon = getRoleIcon(session.configuration.activeRole);
                              return (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Icon className="h-3 w-3 mr-1" />
                                  <span>{session.configuration.activeRole}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onResumeSession?.(session)}
                          data-testid={`button-resume-${session.id}`}
                        >
                          Resume
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{session.configuration?.teamMembers?.length || 0} team members</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Started {new Date(session.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-recent-sessions">
            <CardHeader>
              <CardTitle className="text-xl">Recent Completions</CardTitle>
              <CardDescription>Your recently completed workspace simulations</CardDescription>
            </CardHeader>
            <CardContent>
              {completedSessions.length === 0 ? (
                <div className="text-center py-8" data-testid="empty-completed-sessions">
                  <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No completed sessions yet</p>
                  <p className="text-sm text-gray-500 mt-1">Complete your first simulation to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedSessions.slice(0, 5).map((session: any) => (
                    <div 
                      key={session.id}
                      className="border-b last:border-b-0 pb-3 last:pb-0"
                      data-testid={`session-completed-${session.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {session.configuration?.projectName || 'Workspace Project'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {session.configuration?.activeRole && (() => {
                              const Icon = getRoleIcon(session.configuration.activeRole);
                              return (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Icon className="h-3 w-3 mr-1" />
                                  <span>{session.configuration.activeRole}</span>
                                </div>
                              );
                            })()}
                            <span className="text-sm text-gray-500">
                              • {new Date(session.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          <Card data-testid="card-completion-rate">
            <CardHeader>
              <CardTitle className="text-lg">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - calculateCompletionRate() / 100)}`}
                      className="text-blue-600 transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{calculateCompletionRate()}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  {workspaceProgress?.completedSessions || 0} of {workspaceProgress?.totalSessions || 0} sessions completed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-performance-metrics">
            <CardHeader>
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div data-testid="metric-collaboration">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Collaboration</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {workspaceProgress?.metrics?.collaboration || 0}/100
                  </span>
                </div>
                <Progress value={workspaceProgress?.metrics?.collaboration || 0} className="h-2" />
              </div>

              <div data-testid="metric-communication">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Communication</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {workspaceProgress?.metrics?.communication || 0}/100
                  </span>
                </div>
                <Progress value={workspaceProgress?.metrics?.communication || 0} className="h-2" />
              </div>

              <div data-testid="metric-delivery">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Delivery</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {workspaceProgress?.metrics?.delivery || 0}/100
                  </span>
                </div>
                <Progress value={workspaceProgress?.metrics?.delivery || 0} className="h-2" />
              </div>

              <div data-testid="metric-technical">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Technical Skills</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {workspaceProgress?.metrics?.technical || 0}/100
                  </span>
                </div>
                <Progress value={workspaceProgress?.metrics?.technical || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-quick-stats">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Projects</span>
                <span className="text-lg font-semibold text-gray-900">{activeSessions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Completions</span>
                <span className="text-lg font-semibold text-gray-900">
                  {workspaceProgress?.completedSessions || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Streak</span>
                <span className="text-lg font-semibold text-gray-900">
                  {workspaceProgress?.streak || 0} days
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
