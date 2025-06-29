import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";
import CustomerSupportSession from "@/components/simulation/customer-support-session";
import { 
  Play, 
  Users, 
  Video, 
  MessageCircle,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const companyTypes = [
  "Tech Startup",
  "Enterprise Software", 
  "Consulting Firm",
  "Financial Services",
  "Customer Support"
];

const roles = [
  "Junior Software Engineer",
  "Product Manager",
  "Data Analyst", 
  "UX Designer",
  "Customer Support Specialist"
];

const mockTeamMembers = [
  {
    id: 1,
    name: "John Doe",
    role: "Senior Engineer",
    personality: "Helpful, Direct",
    communication: "Slack, Daily standups",
    initials: "JD"
  },
  {
    id: 2,
    name: "Sarah Chen",
    role: "Product Manager", 
    personality: "Collaborative, Detail-oriented",
    communication: "Email, Weekly 1:1s",
    initials: "SC"
  },
  {
    id: 3,
    name: "Alex Kim",
    role: "UX Designer",
    personality: "Creative, Supportive",
    communication: "Slack, Design reviews",
    initials: "AK"
  }
];

const mockTasks = [
  { id: 1, title: "Set up development environment", status: "in-progress", completed: false },
  { id: 2, title: "Review codebase and architecture", status: "pending", completed: false },
  { id: 3, title: "Attend team standup meeting", status: "pending", completed: false },
  { id: 4, title: "Implement user authentication flow", status: "pending", completed: false }
];

const mockMessages = [
  {
    id: 1,
    sender: "John Doe",
    content: "Hey team! The new mockups are ready. Can everyone review by EOD?",
    timestamp: "10:30 AM",
    initials: "JD"
  },
  {
    id: 2,
    sender: "Sarah Chen", 
    content: "Great! I'll take a look this afternoon and share feedback.",
    timestamp: "10:45 AM",
    initials: "SC"
  }
];

const mockMeetings = [
  {
    id: 1,
    title: "Daily Standup",
    time: "Today, 2:00 PM",
    type: "recurring"
  },
  {
    id: 2,
    title: "Sprint Planning",
    time: "Tomorrow, 10:00 AM", 
    type: "planning"
  }
];

const supportChannels = ["Chat", "Call"];

const supportStages = [
  "Greeting",
  "Problem Diagnosis", 
  "Resolution",
  "Escalation",
  "Closing"
];

const customerPersonas = [
  { id: "angry", name: "Angry Customer", description: "Frustrated and impatient, wants immediate resolution" },
  { id: "polite", name: "Polite Customer", description: "Courteous and understanding, follows instructions well" },
  { id: "confused", name: "Confused Customer", description: "Unclear about their problem, needs guidance" },
  { id: "elderly", name: "Elderly Customer", description: "Not tech-savvy, needs patient explanation" },
  { id: "urgent", name: "Urgent Customer", description: "Has a time-sensitive issue, stressed about deadline" },
  { id: "skeptical", name: "Skeptical Customer", description: "Doubtful about solutions, needs convincing" }
];

const commonProblems = [
  "Unable to access account - forgot password and email not working",
  "Billing issue - charged twice for the same service",
  "Technical problem - app crashes when trying to upload files",
  "Service outage - website has been down for 2 hours",
  "Feature request - wants to cancel subscription but can't find the option",
  "Delivery issue - package was supposed to arrive yesterday but didn't"
];

export default function WorkspaceSimulator() {
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [companyType, setCompanyType] = useState("Tech Startup");
  const [userRole, setUserRole] = useState("Junior Software Engineer");
  const [chatMessage, setChatMessage] = useState("");
  const [tasks, setTasks] = useState(mockTasks);
  
  // Customer Support specific state
  const [supportChannel, setSupportChannel] = useState("Chat");
  const [supportStage, setSupportStage] = useState("Greeting");
  const [selectedPersona, setSelectedPersona] = useState("polite");
  const [customerProblem, setCustomerProblem] = useState("");
  const [duration, setDuration] = useState("15");

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: previousSessions = [] } = useQuery({
    queryKey: [`/api/user/${user?.id}/sessions`],
    enabled: !!user?.id,
  });

  const workspaceSessions = previousSessions.filter((session: any) => session.type === 'workspace');

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest("POST", "/api/sessions", sessionData);
      return response.json();
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/sessions`] });
      toast({
        title: "Workspace Simulation Started",
        description: "Welcome to your virtual workspace!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start workspace simulation",
        variant: "destructive",
      });
    },
  });

  const handleStartSimulation = async () => {
    if (!user) return;

    let configuration;
    
    if (companyType === "Customer Support") {
      configuration = {
        companyType,
        userRole,
        channel: supportChannel,
        stage: supportStage,
        persona: selectedPersona,
        problem: customerProblem || commonProblems[Math.floor(Math.random() * commonProblems.length)],
        duration: parseInt(duration)
      };
    } else {
      configuration = {
        companyType,
        userRole,
        teamMembers: mockTeamMembers,
        project: {
          name: "E-commerce Platform Redesign",
          description: "Redesign the checkout flow to improve conversion rates. You'll be working on the frontend implementation while collaborating with the design and backend teams.",
          tasks: mockTasks
        }
      };
    }

    createSessionMutation.mutate({
      userId: user.id,
      type: 'workspace',
      status: 'active',
      configuration,
      messages: []
    });
  };

  const handleTaskToggle = (taskId: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed, status: !task.completed ? 'completed' : 'in-progress' }
        : task
    ));
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the team.",
    });
    setChatMessage("");
  };

  if (currentSession) {
    // Render Customer Support Simulation
    if (currentSession.configuration.companyType === "Customer Support") {
      return <CustomerSupportSession session={currentSession} onComplete={() => setCurrentSession(null)} />;
    }

    // Render regular workspace simulation
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Workspace Simulation</h2>
              <p className="text-gray-600">Active Session - {currentSession.configuration.companyType}</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setCurrentSession(null)}
            >
              End Simulation
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Current Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {currentSession.configuration.project.name}
                  </h4>
                  <p className="text-gray-700 mb-4">
                    {currentSession.configuration.project.description}
                  </p>
                  
                  <h5 className="font-medium text-gray-900 mb-3">Your Tasks:</h5>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleTaskToggle(task.id)}
                        />
                        <span className={`text-gray-700 ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </span>
                        <Badge variant={
                          task.status === 'completed' ? 'default' :
                          task.status === 'in-progress' ? 'secondary' : 'outline'
                        }>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>Your Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTeamMembers.map((member) => (
                    <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.role}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="mb-1">Personality: {member.personality}</p>
                        <p>Communication: {member.communication}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>#project-redesign</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto bg-gray-50 rounded p-4 mb-4 space-y-3">
                  {mockMessages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                          {message.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm">
                          <strong>{message.sender}</strong> 
                          <span className="text-gray-500 text-xs ml-2">{message.timestamp}</span>
                        </p>
                        <p className="text-sm text-gray-700">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} size="sm">
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Meetings */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <Video className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{meeting.title}</p>
                        <p className="text-sm text-gray-600">{meeting.time}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Workspace Simulator</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {/* Company Setup */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Environment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Company Type</Label>
                  <Select value={companyType} onValueChange={setCompanyType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {companyTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Your Role</Label>
                  <Select value={userRole} onValueChange={setUserRole}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Customer Support Configuration */}
            {companyType === "Customer Support" ? (
              <>
                {/* Support Channel & Stage */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Channel</Label>
                      <Select value={supportChannel} onValueChange={setSupportChannel}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportChannels.map((channel) => (
                            <SelectItem key={channel} value={channel}>
                              <div className="flex items-center space-x-2">
                                {channel === 'Chat' ? <MessageCircle className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                                <span>{channel}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Starting Stage</Label>
                      <Select value={supportStage} onValueChange={setSupportStage}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportStages.map((stage) => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Duration (minutes)</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="20">20 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Customer Persona */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Persona</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerPersonas.map((persona) => (
                      <div 
                        key={persona.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedPersona === persona.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPersona(persona.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                            selectedPersona === persona.id 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`} />
                          <div>
                            <h4 className="font-medium text-gray-900">{persona.name}</h4>
                            <p className="text-sm text-gray-600">{persona.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Problem */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Issue</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Describe the customer's problem (optional)</Label>
                      <Textarea
                        className="mt-2"
                        rows={3}
                        placeholder="Leave blank for a random problem, or describe a specific issue the customer is facing..."
                        value={customerProblem}
                        onChange={(e) => setCustomerProblem(e.target.value)}
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Example Problems:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {commonProblems.slice(0, 4).map((problem, index) => (
                          <button
                            key={index}
                            className="text-left text-sm text-gray-600 hover:text-blue-600 hover:underline"
                            onClick={() => setCustomerProblem(problem)}
                          >
                            {problem}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Team Members Preview */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Team</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockTeamMembers.map((member) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar>
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="mb-1">Personality: {member.personality}</p>
                          <p>Communication: {member.communication}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Project Preview */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Project</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">E-commerce Platform Redesign</h4>
                    <p className="text-gray-700 mb-4">
                      Redesign the checkout flow to improve conversion rates. You'll be working on the frontend implementation while collaborating with the design and backend teams.
                    </p>
                    
                    <h5 className="font-medium text-gray-900 mb-3">Your Tasks:</h5>
                    <div className="space-y-2">
                      {mockTasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-3">
                          <Checkbox disabled />
                          <span className="text-gray-700">{task.title}</span>
                          <Badge variant="secondary">{task.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Start Simulation */}
            <div className="flex justify-center">
              <Button 
                size="lg"
                onClick={handleStartSimulation}
                disabled={createSessionMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Play className="mr-2 h-4 w-4" />
                {createSessionMutation.isPending ? "Starting..." : "Start Workspace Simulation"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Previous Sessions */}
        {workspaceSessions.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Previous Workspace Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspaceSessions.map((session: any) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {session.configuration?.companyType} - {session.configuration?.userRole}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {session.status === 'completed' ? 'Completed' : 'In Progress'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
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
