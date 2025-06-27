import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDuration, formatScore, getScoreColor } from "@/lib/utils";
import InterviewSession from "@/components/simulation/interview-session";
import { Play, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const professions = [
  "Software Engineer",
  "Product Manager", 
  "Data Scientist",
  "UX Designer",
  "Marketing Manager"
];

const interviewTypes = [
  "Technical Interview",
  "Behavioral Interview", 
  "System Design",
  "HR/Culture Fit"
];

const difficulties = ["junior", "mid", "senior"];
const personalities = ["friendly", "strict", "casual", "challenging"];

export default function InterviewSimulator() {
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [jobPosting, setJobPosting] = useState("");
  const [profession, setProfession] = useState("Software Engineer");
  const [interviewType, setInterviewType] = useState("Technical Interview");
  const [difficulty, setDifficulty] = useState("junior");
  const [personality, setPersonality] = useState("friendly");
  const [duration, setDuration] = useState("30");

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: previousSessions = [] } = useQuery({
    queryKey: [`/api/user/${user?.id}/sessions`],
    enabled: !!user?.id,
  });

  const interviewSessions = previousSessions.filter((session: any) => session.type === 'interview');

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest("POST", "/api/sessions", sessionData);
      return response.json();
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/sessions`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start interview session",
        variant: "destructive",
      });
    },
  });

  const handleStartInterview = async () => {
    if (!user) return;

    const configuration = {
      profession,
      interviewType,
      difficulty,
      personality,
      duration: parseInt(duration),
      jobPosting: jobPosting.trim() || null
    };

    createSessionMutation.mutate({
      userId: user.id,
      type: 'interview',
      status: 'active',
      configuration,
      messages: []
    });
  };

  if (currentSession) {
    return (
      <InterviewSession 
        session={currentSession}
        onComplete={() => {
          setCurrentSession(null);
          queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/sessions`] });
        }}
      />
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Interview Simulator</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {/* Job Posting Input */}
            <div className="mb-8">
              <Label className="text-sm font-medium text-gray-700 mb-2">
                Job Posting (Optional)
              </Label>
              <Textarea
                className="h-32 resize-none mt-2"
                placeholder="Paste the job posting here to generate targeted interview questions..."
                value={jobPosting}
                onChange={(e) => setJobPosting(e.target.value)}
              />
              <p className="mt-2 text-sm text-gray-500">Leave empty for general interview practice</p>
            </div>

            {/* Interview Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Profession</Label>
                <Select value={profession} onValueChange={setProfession}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {professions.map((prof) => (
                      <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Interview Type</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Difficulty & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Difficulty Level</Label>
                <div className="flex space-x-2 mt-2">
                  {difficulties.map((diff) => (
                    <Button
                      key={diff}
                      variant={difficulty === diff ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDifficulty(diff)}
                      className={cn(
                        "capitalize",
                        difficulty === diff && "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {diff}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Session Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Interviewer Personality */}
            <div className="mb-8">
              <Label className="text-sm font-medium text-gray-700 mb-2">Interviewer Personality</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {personalities.map((pers) => (
                  <Button
                    key={pers}
                    variant={personality === pers ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPersonality(pers)}
                    className={cn(
                      "capitalize",
                      personality === pers && "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {pers}
                  </Button>
                ))}
              </div>
            </div>

            {/* Start Interview Button */}
            <div className="flex justify-center">
              <Button 
                size="lg"
                onClick={handleStartInterview}
                disabled={createSessionMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="mr-2 h-4 w-4" />
                {createSessionMutation.isPending ? "Starting..." : "Start Interview"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Previous Sessions */}
        {interviewSessions.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Previous Interview Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interviewSessions.map((session: any) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MessageCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {session.configuration?.profession} - {session.configuration?.interviewType}
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
                            <p className="text-xs text-gray-500">
                              {session.score >= 80 ? 'Excellent' : session.score >= 60 ? 'Good' : 'Needs Improvement'}
                            </p>
                          </div>
                        )}
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
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
