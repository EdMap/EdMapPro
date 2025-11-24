import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDuration, formatScore, getScoreColor } from "@/lib/utils";
import { Link } from "wouter";
import { 
  MessageCircle, 
  Users, 
  Handshake, 
  ExternalLink, 
  CheckCircle, 
  TrendingUp, 
  Clock,
  Play
} from "lucide-react";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: progress = [] } = useQuery({
    queryKey: [`/api/user/${user?.id}/progress`],
    enabled: !!user?.id,
  });

  const { data: recentSessions = [] } = useQuery({
    queryKey: [`/api/user/${user?.id}/sessions`],
    enabled: !!user?.id,
  });

  const totalSessions = progress.reduce((sum, p) => sum + p.totalSessions, 0);
  const completedSessions = progress.reduce((sum, p) => sum + p.completedSessions, 0);
  const totalTime = progress.reduce((sum, p) => sum + p.totalTime, 0);
  const averageScore = progress.length > 0 
    ? Math.round(progress.reduce((sum, p) => sum + (p.averageScore || 0), 0) / progress.filter(p => p.averageScore).length)
    : null;

  const simulationCards = [
    {
      title: "Interview Practice",
      description: "Learn to analyze company and job info before the interview",
      icon: MessageCircle,
      href: "/interview",
      number: 1,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      buttonEnabled: true
    },
    {
      title: "Workplace Simulation", 
      description: "Learn to analyze company and job info before the interview",
      icon: Users,
      href: "/workspace",
      number: 3,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      buttonEnabled: false
    },
    {
      title: "Offer Negotiation",
      description: "Learn to analyze company and job info before the interview", 
      icon: Handshake,
      href: "/negotiation",
      number: 2,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      buttonEnabled: false
    }
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="brand-gradient text-white p-8 m-8 rounded-xl">
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16 bg-white bg-opacity-20">
            <AvatarFallback className="text-2xl font-bold text-white bg-transparent">
              {user ? getInitials(user.firstName, user.lastName) : "AA"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome, {user ? user.firstName : "Arsen"}
            </h2>
            <p className="text-blue-100">
              Start your journey by going through the whole process from prepping for the interview to negotiating your offer.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Simulation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {simulationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`${card.iconColor} text-xl h-6 w-6`} />
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      card.buttonEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <span className={`text-sm font-bold ${
                        card.buttonEnabled ? 'text-white' : 'text-gray-600'
                      }`}>
                        {card.number}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{card.description}</p>
                  
                  {card.buttonEnabled ? (
                    <Link href={card.href}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <span>Start simulation</span>
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full bg-gray-100 text-gray-500 cursor-not-allowed">
                      <span>Start simulation</span>
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Progress Overview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{completedSessions}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                      {formatScore(averageScore)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Time Practiced</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatDuration(totalTime)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Sessions</h3>
            <div className="space-y-4">
              {recentSessions.slice(0, 5).map((session: any) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {session.type === 'interview' && <MessageCircle className="h-5 w-5 text-blue-600" />}
                          {session.type === 'negotiation' && <Handshake className="h-5 w-5 text-green-600" />}
                          {session.type === 'workspace' && <Users className="h-5 w-5 text-purple-600" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {session.type} Session
                          </h4>
                          <p className="text-sm text-gray-600">
                            {session.status === 'completed' ? 'Completed' : 'In Progress'} • {formatDuration(session.duration || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {session.score && (
                          <div className="text-right">
                            <p className={`text-sm font-medium ${getScoreColor(session.score)}`}>
                              Score: {formatScore(session.score)}
                            </p>
                          </div>
                        )}
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
