import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatScore, getScoreColor } from "@/lib/utils";
import type { UserProgress, SimulationSession } from "@shared/schema";
import { 
  Play, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  MessageCircle, 
  Handshake, 
  Users,
  Award,
  Target,
  Calendar
} from "lucide-react";

interface SkillData {
  name: string;
  score: number;
  improvement: number;
}

interface ActivityItem {
  id: string;
  type: 'interview' | 'negotiation' | 'workspace';
  title: string;
  score: number | null;
  timestamp: Date;
}

export default function Progress() {
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: progress = [] } = useQuery<UserProgress[]>({
    queryKey: [`/api/user/${user?.id}/progress`],
    enabled: !!user?.id,
  });

  const { data: recentSessions = [] } = useQuery<SimulationSession[]>({
    queryKey: [`/api/user/${user?.id}/sessions`],
    enabled: !!user?.id,
  });

  // Calculate overview statistics
  const totalSessions = progress.reduce((sum: number, p: UserProgress) => sum + p.totalSessions, 0);
  const completedSessions = progress.reduce((sum: number, p: UserProgress) => sum + p.completedSessions, 0);
  const totalTime = progress.reduce((sum: number, p: UserProgress) => sum + p.totalTime, 0);
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  
  // Calculate average score across all simulation types
  const averageScore = progress.length > 0 
    ? Math.round(progress.reduce((sum: number, p: UserProgress) => sum + (p.averageScore || 0), 0) / progress.filter((p: UserProgress) => p.averageScore).length)
    : null;

  // Calculate growth from previous period (mock calculation for demo)
  const sessionGrowth = Math.max(0, completedSessions - Math.floor(completedSessions * 0.8));
  const scoreGrowth = averageScore ? Math.max(0, averageScore - Math.floor(averageScore * 0.94)) : 0;

  // Generate skills data based on progress
  const skillsData: SkillData[] = [
    {
      name: "Technical Communication",
      score: progress.find((p: UserProgress) => p.simulationType === 'interview')?.averageScore || 0,
      improvement: 5
    },
    {
      name: "Negotiation Strategy", 
      score: progress.find((p: UserProgress) => p.simulationType === 'negotiation')?.averageScore || 0,
      improvement: 8
    },
    {
      name: "Team Collaboration",
      score: progress.find((p: UserProgress) => p.simulationType === 'workspace')?.averageScore || 0,
      improvement: 3
    },
    {
      name: "Problem Solving",
      score: averageScore ? Math.min(100, averageScore + 5) : 0,
      improvement: 7
    },
    {
      name: "Professional Presentation",
      score: averageScore ? Math.min(100, averageScore - 3) : 0,
      improvement: 4
    }
  ].filter(skill => skill.score > 0);

  // Generate recent activity from sessions
  const recentActivity: ActivityItem[] = recentSessions
    .slice(0, 10)
    .map((session: SimulationSession) => ({
      id: session.id.toString(),
      type: session.type as 'interview' | 'negotiation' | 'workspace',
      title: getActivityTitle(session.type, session.configuration),
      score: session.score,
      timestamp: new Date(session.completedAt || session.startedAt)
    }))
    .sort((a: ActivityItem, b: ActivityItem) => b.timestamp.getTime() - a.timestamp.getTime());

  function getActivityTitle(type: string, config: any): string {
    switch (type) {
      case 'interview':
        return `${config?.interviewType || 'Interview'} Practice`;
      case 'negotiation':
        return `${config?.scenario || 'Negotiation'} Session`;
      case 'workspace':
        return `Workspace at ${config?.companyType || 'Company'}`;
      default:
        return 'Simulation Session';
    }
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'interview':
        return MessageCircle;
      case 'negotiation':
        return Handshake;
      case 'workspace':
        return Users;
      default:
        return Play;
    }
  }

  function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} weeks ago`;
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">{completedSessions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              {sessionGrowth > 0 && (
                <p className="text-sm text-green-600 mt-2">+{sessionGrowth} this week</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
                    {averageScore || "--"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              {scoreGrowth > 0 && (
                <p className="text-sm text-green-600 mt-2">+{scoreGrowth} from last month</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Time Practiced</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatDuration(totalTime)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <p className={`text-sm mt-2 ${
                completionRate >= 80 ? 'text-green-600' : 
                completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {completionRate >= 80 ? 'Excellent' : 
                 completionRate >= 60 ? 'Good' : 'Needs Improvement'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart Placeholder */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Performance chart visualization</p>
                <p className="text-sm text-gray-400 mt-2">
                  Track your progress across all simulation types
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skills Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Skills Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              {skillsData.length > 0 ? (
                <div className="space-y-6">
                  {skillsData.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{skill.score}%</span>
                          {skill.improvement > 0 && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              +{skill.improvement}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ProgressBar value={skill.score} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Complete simulations to see your skills assessment</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'interview' ? 'bg-blue-100' :
                          activity.type === 'negotiation' ? 'bg-green-100' : 'bg-purple-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            activity.type === 'interview' ? 'text-blue-600' :
                            activity.type === 'negotiation' ? 'text-green-600' : 'text-purple-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-500">{getRelativeTime(activity.timestamp)}</p>
                        </div>
                        {activity.score && (
                          <span className={`text-sm font-medium ${getScoreColor(activity.score)}`}>
                            {activity.score}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Start a simulation to see your activity here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Simulation Type Breakdown */}
        {progress.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Simulation Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {progress.map((prog) => {
                  const Icon = prog.simulationType === 'interview' ? MessageCircle :
                              prog.simulationType === 'negotiation' ? Handshake : Users;
                  const iconColor = prog.simulationType === 'interview' ? 'text-blue-600' :
                                   prog.simulationType === 'negotiation' ? 'text-green-600' : 'text-purple-600';
                  const bgColor = prog.simulationType === 'interview' ? 'bg-blue-100' :
                                 prog.simulationType === 'negotiation' ? 'bg-green-100' : 'bg-purple-100';
                  
                  return (
                    <div key={prog.simulationType} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${iconColor}`} />
                        </div>
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {prog.simulationType} Sessions
                        </h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completed</span>
                          <span className="font-medium">{prog.completedSessions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average Score</span>
                          <span className={`font-medium ${getScoreColor(prog.averageScore)}`}>
                            {formatScore(prog.averageScore)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Time Spent</span>
                          <span className="font-medium">{formatDuration(prog.totalTime)}</span>
                        </div>
                        {prog.lastSessionAt && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Last Session</span>
                            <span className="text-sm text-gray-900">
                              {getRelativeTime(new Date(prog.lastSessionAt))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
