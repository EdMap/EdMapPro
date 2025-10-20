import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  MessageSquare, 
  CheckSquare, 
  Users, 
  Send,
  Coffee,
  Code,
  X
} from "lucide-react";

interface WorkspaceSessionProps {
  session: any;
  onComplete: () => void;
}

export default function WorkspaceSession({ session, onComplete }: WorkspaceSessionProps) {
  const [message, setMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("team-chat");
  const [isOnboarding, setIsOnboarding] = useState(session.configuration.sprintPhase === 'onboarding');
  
  const config = session.configuration;
  const teamMembers = config.teamMembers || [];

  // Fetch tasks
  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['/api/workspace', session.id, 'tasks'],
    enabled: !!session.id,
  });

  // Fetch interactions (chat messages)
  const { data: interactions = [], refetch: refetchInteractions } = useQuery({
    queryKey: ['/api/workspace', session.id, 'interactions'],
    enabled: !!session.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/workspace/${session.id}/action`, {
        type: 'send-message',
        channel: activeChannel,
        data: { content }
      });
      return response.json();
    },
    onSuccess: () => {
      refetchInteractions();
      setMessage("");
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: number; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/workspace/tasks/${taskId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      refetchTasks();
    },
  });

  // Complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/sessions/${session.id}`, {
        configuration: { ...config, sprintPhase: 'sprint' }
      });
      return response.json();
    },
    onSuccess: () => {
      setIsOnboarding(false);
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${session.id}`] });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleTaskToggle = (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'in-progress' : 'completed';
    updateTaskMutation.mutate({ taskId, updates: { status: newStatus } });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getChannelName = (channel: string) => {
    const names: Record<string, string> = {
      'team-chat': '# team-chat',
      'standup': '# daily-standup',
      'code-review': '# code-reviews',
      'general': '# general'
    };
    return names[channel] || channel;
  };

  // Onboarding view
  if (isOnboarding) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Welcome to {config.projectName}!</CardTitle>
                  <CardDescription className="mt-2">
                    Get to know your team and understand the project goals
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onComplete} data-testid="button-close-session">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Your Role</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-blue-900">{config.activeRole}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    You'll be working on this project as a {config.activeRole}. Collaborate with your team to deliver high-quality work.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Meet Your Team</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamMembers.map((member: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4" data-testid={`team-member-${idx}`}>
                      <div className="flex items-center space-x-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-purple-100 text-purple-700">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.role}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{member.personality}</p>
                      <div className="flex flex-wrap gap-1">
                        {member.expertise?.slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">🎯 Project Objective</h4>
                <p className="text-gray-700">
                  Work with your team to complete the {config.projectName} project. 
                  You'll communicate through team chat, attend standups, and collaborate on tasks.
                </p>
              </div>

              <Button 
                onClick={() => completeOnboardingMutation.mutate()}
                disabled={completeOnboardingMutation.isPending}
                className="w-full"
                data-testid="button-start-working"
              >
                {completeOnboardingMutation.isPending ? 'Starting...' : 'Start Working with Team'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main workspace view
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{config.projectName}</h2>
            <p className="text-gray-600">Your role: {config.activeRole}</p>
          </div>
          <Button variant="outline" onClick={onComplete} data-testid="button-end-session">
            End Session
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Team & Tasks */}
          <div className="space-y-6">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Users className="h-4 w-4 mr-2" />
                  Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.map((member: any, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-gray-500 truncate">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(tasks as any[]).length === 0 ? (
                  <p className="text-sm text-gray-500">No tasks yet. Start chatting with your team!</p>
                ) : (
                  <div className="space-y-2">
                    {(tasks as any[]).map((task: any) => (
                      <div key={task.id} className="flex items-start space-x-2 p-2 border rounded" data-testid={`task-${task.id}`}>
                        <Checkbox
                          checked={task.status === 'completed'}
                          onCheckedChange={() => handleTaskToggle(task.id, task.status)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content - Chat */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-base">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {getChannelName(activeChannel)}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={activeChannel === 'team-chat' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveChannel('team-chat')}
                      data-testid="channel-team-chat"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                    <Button
                      variant={activeChannel === 'standup' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveChannel('standup')}
                      data-testid="channel-standup"
                    >
                      <Coffee className="h-4 w-4 mr-1" />
                      Standup
                    </Button>
                    <Button
                      variant={activeChannel === 'code-review' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveChannel('code-review')}
                      data-testid="channel-code-review"
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Reviews
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {(interactions as any[])
                    .filter((int: any) => int.channel === activeChannel)
                    .length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(interactions as any[])
                        .filter((int: any) => int.channel === activeChannel)
                        .map((interaction: any) => (
                          <div key={interaction.id} className="flex items-start space-x-3" data-testid={`message-${interaction.id}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={
                                interaction.sender === 'User' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }>
                                {getInitials(interaction.sender)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-baseline space-x-2">
                                <span className="font-semibold text-sm">{interaction.sender}</span>
                                <span className="text-xs text-gray-500">{interaction.senderRole}</span>
                                <span className="text-xs text-gray-400">
                                  {new Date(interaction.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{interaction.content}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Message input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      placeholder={`Message ${getChannelName(activeChannel)}...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sendMessageMutation.isPending}
                      data-testid="input-message"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
