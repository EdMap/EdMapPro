import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  Target,
  Users,
  FileText,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Calendar,
  BookOpen,
  Coffee,
  ArrowLeft,
  Sparkles,
  Store,
  CreditCard,
  Globe,
  Bug,
  GitBranch,
  Code,
  Lightbulb,
  ArrowRight,
  Monitor,
  Rocket
} from "lucide-react";

interface InternOnboardingSessionProps {
  session: any;
  project: any;
  onComplete: () => void;
}

type ViewMode = 'overview' | 'team-intro' | 'documentation' | 'comprehension-check';

interface TeamMember {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  availability: string;
  bio?: string;
}

export default function InternOnboardingSession({ session, project, onComplete }: InternOnboardingSessionProps) {
  const [currentDay, setCurrentDay] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [message, setMessage] = useState("");
  const [introProgress, setIntroProgress] = useState<Record<string, boolean>>({});
  const [docsRead, setDocsRead] = useState(false);
  const [comprehensionComplete, setComprehensionComplete] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState<string | null>(null);
  
  const [docSectionsRead, setDocSectionsRead] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showDay2Preview, setShowDay2Preview] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<string>('product');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const requirements = project.requirements || {};
  const dailyStructure = requirements.dailyStructure || [];
  const teamMembers: TeamMember[] = project.teamStructure || [];
  const scenarioScript = project.scenarioScript || {};
  const projectInfo = requirements.project || {};

  const currentDayData = dailyStructure.find((d: any) => d.day === currentDay) || dailyStructure[0];
  const dayProgress = calculateDayProgress();

  function calculateDayProgress() {
    if (currentDay !== 1) return 0;
    
    const totalIntros = teamMembers.length;
    const completedIntros = Object.values(introProgress).filter(Boolean).length;
    const introWeight = 50;
    const docsWeight = 30;
    const comprehensionWeight = 20;
    
    let progress = 0;
    progress += (completedIntros / totalIntros) * introWeight;
    if (docsRead) progress += docsWeight;
    if (comprehensionComplete) progress += comprehensionWeight;
    
    return Math.round(progress);
  }

  const { data: interactions, isLoading: interactionsLoading } = useQuery({
    queryKey: ['/api/workspace', session.id, 'interactions'],
    queryFn: () => fetch(`/api/workspace/${session.id}/interactions`).then(res => res.json()),
    refetchInterval: 2000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const channel = selectedMember ? `dm-${selectedMember.name}` : 'team-chat';
      
      if (selectedMember) {
        setTypingIndicator(selectedMember.name);
      }
      
      const response = await apiRequest("POST", `/api/workspace/${session.id}/action`, {
        type: 'send-message',
        channel,
        data: { content: userMessage }
      });
      return response.json();
    },
    onSuccess: () => {
      setTypingIndicator(null);
      queryClient.invalidateQueries({ queryKey: ['/api/workspace', session.id, 'interactions'] });
      setMessage("");
      
      if (selectedMember && !introProgress[selectedMember.name]) {
        setIntroProgress(prev => ({ ...prev, [selectedMember.name]: true }));
      }
    },
    onError: () => {
      setTypingIndicator(null);
    }
  });

  useEffect(() => {
    if (viewMode === 'overview' && scenarioScript.onboarding) {
      const timers: NodeJS.Timeout[] = [];
      let cumulativeDelay = 0;
      
      scenarioScript.onboarding.forEach((event: any) => {
        const baseDelay = 2000;
        const randomDelay = Math.random() * 3000;
        cumulativeDelay += baseDelay + randomDelay;
        
        const timer = setTimeout(async () => {
          try {
            await apiRequest("POST", `/api/workspace/${session.id}/interactions`, {
              sessionId: session.id,
              channel: 'team-chat',
              sender: event.from,
              senderRole: teamMembers.find((m: TeamMember) => m.name === event.from)?.role || 'Team Member',
              content: event.message
            });
            queryClient.invalidateQueries({ queryKey: ['/api/workspace', session.id, 'interactions'] });
          } catch (error) {
            console.error('Failed to send auto message:', error);
          }
        }, cumulativeDelay);
        timers.push(timer);
      });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [viewMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactions]);

  function handleSendMessage() {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  }

  function startTeamIntro(member: TeamMember) {
    setSelectedMember(member);
    setViewMode('team-intro');
  }

  function getFilteredInteractions() {
    if (!Array.isArray(interactions)) return [];
    
    if (viewMode === 'team-intro' && selectedMember) {
      return interactions.filter((i: any) => 
        i.channel === `dm-${selectedMember.name}` || 
        (i.sender === selectedMember.name && i.channel === 'dm-You')
      );
    }
    
    if (viewMode === 'comprehension-check') {
      return interactions.filter((i: any) => 
        i.channel === 'dm-Sarah' || 
        (i.sender === 'Sarah' && i.channel === 'dm-You')
      );
    }
    
    return interactions.filter((i: any) => i.channel === 'team-chat');
  }

  const filteredInteractions = getFilteredInteractions();

  function renderOverview() {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">
                  Welcome to {projectInfo.name || 'NovaPay'}!
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Day {currentDay}: {currentDayData?.theme || 'Welcome aboard'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800">
              {projectInfo.description || 'Your first week as a software engineering intern starts now. Take your time getting to know the team and understanding the project.'}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Today's Activities
          </h3>
          
          <div className="grid gap-3">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                Object.keys(introProgress).length > 0 ? 'border-green-200 bg-green-50' : ''
              }`}
              onClick={() => setViewMode('team-intro')}
              data-testid="card-team-intros"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Meet the Team</h4>
                      <p className="text-sm text-gray-600">
                        1:1 introductions with your teammates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {Object.values(introProgress).filter(Boolean).length}/{teamMembers.length}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                docsRead ? 'border-green-200 bg-green-50' : ''
              }`}
              onClick={() => setViewMode('documentation')}
              data-testid="card-documentation"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Read Onboarding Docs</h4>
                      <p className="text-sm text-gray-600">
                        Project README and team guidelines
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {docsRead && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                comprehensionComplete ? 'border-green-200 bg-green-50' : ''
              } ${!docsRead ? 'opacity-60' : ''}`}
              onClick={() => docsRead && setViewMode('comprehension-check')}
              data-testid="card-comprehension-check"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Comprehension Check</h4>
                      <p className="text-sm text-gray-600">
                        Chat with Sarah about what you learned
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!docsRead && (
                      <Badge variant="outline" className="text-xs">
                        Read docs first
                      </Badge>
                    )}
                    {comprehensionComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {currentDayData?.overnightEvent && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Coming tomorrow:</span>
                <span>{currentDayData.overnightEvent}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderTeamIntroView() {
    if (selectedMember) {
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedMember(null)}
              data-testid="button-back-to-team-list"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-purple-100 text-purple-700">
                  {selectedMember.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{selectedMember.name}</p>
                <p className="text-xs text-gray-600">{selectedMember.role}</p>
              </div>
            </div>
            {introProgress[selectedMember.name] && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Introduced
              </Badge>
            )}
          </div>

          {selectedMember.bio && (
            <Card className="mb-4 bg-gray-50">
              <CardContent className="p-3 text-sm text-gray-700">
                {selectedMember.bio}
              </CardContent>
            </Card>
          )}

          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {filteredInteractions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Coffee className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Say hello to {selectedMember.name}!</p>
                  <p className="text-sm">Introduce yourself and ask about their role.</p>
                </div>
              )}
              {filteredInteractions.map((interaction: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex ${interaction.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${idx}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      interaction.sender === 'You'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    {interaction.sender !== 'You' && (
                      <p className="text-xs font-medium text-purple-600 mb-1">
                        {interaction.sender}
                      </p>
                    )}
                    <p className={interaction.sender === 'You' ? 'text-white' : 'text-gray-800'}>
                      {interaction.content}
                    </p>
                  </div>
                </div>
              ))}
              {typingIndicator && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <p className="text-sm text-gray-500">{typingIndicator} is typing...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message ${selectedMember.name}...`}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
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
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Your Team</h3>
          <Badge variant="outline">
            {Object.values(introProgress).filter(Boolean).length}/{teamMembers.length} introduced
          </Badge>
        </div>
        
        <div className="grid gap-3">
          {teamMembers.map((member: TeamMember, idx: number) => (
            <Card 
              key={idx}
              className={`cursor-pointer transition-all hover:shadow-md ${
                introProgress[member.name] ? 'border-green-200' : ''
              }`}
              onClick={() => startTeamIntro(member)}
              data-testid={`team-member-card-${idx}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        {introProgress[member.name] && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{member.role}</p>
                      <p className="text-xs text-gray-500 italic">{member.personality}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {member.expertise?.slice(0, 2).map((skill: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function toggleSection(section: string, open: boolean) {
    setExpandedSections(prev => ({ ...prev, [section]: open }));
    if (open) {
      setDocSectionsRead(prev => ({ ...prev, [section]: true }));
    }
  }

  const allSectionsRead = Boolean(
    docSectionsRead['product'] && 
    docSectionsRead['users'] && 
    docSectionsRead['bug'] && 
    docSectionsRead['setup']
  );

  function handleFinishDocs() {
    if (!allSectionsRead) return;
    setDocsRead(true);
    setShowDay2Preview(true);
  }

  function renderDocumentation() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Day 1 Onboarding Docs
          </h3>
          <Badge variant={allSectionsRead ? "default" : "outline"} className={allSectionsRead ? "bg-green-600" : ""}>
            {Object.keys(docSectionsRead).length}/4 sections
          </Badge>
        </div>

        <Tabs value={activeDocTab} onValueChange={setActiveDocTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="product" className="flex items-center gap-2" data-testid="tab-product">
              <Store className="h-4 w-4" />
              Product & Users
              {docSectionsRead['product'] && docSectionsRead['users'] && (
                <CheckCircle2 className="h-3 w-3 text-green-600 ml-1" />
              )}
            </TabsTrigger>
            <TabsTrigger value="mission" className="flex items-center gap-2" data-testid="tab-mission">
              <Target className="h-4 w-4" />
              Your Mission
              {docSectionsRead['bug'] && docSectionsRead['setup'] && (
                <CheckCircle2 className="h-3 w-3 text-green-600 ml-1" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">TL;DR</p>
                    <p className="text-sm text-blue-800">
                      Merchant Dashboard helps small business owners track their money. You'll be fixing a timezone bug in the Transactions page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Collapsible open={expandedSections['product']} onOpenChange={(open) => toggleSection('product', open)}>
              <Card>
                <CollapsibleTrigger className="w-full" data-testid="section-product">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Store className="h-4 w-4 text-purple-600" />
                        What is Merchant Dashboard?
                        {docSectionsRead['product'] && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      {expandedSections['product'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <p className="text-gray-700">
                      <strong>Merchant Dashboard</strong> is the admin panel where NovaPay's business customers manage their payment operations. Think of it as their "mission control" for money.
                    </p>
                    
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Transactions</p>
                          <p className="text-sm text-gray-600">View all customer payments, refunds, and chargebacks in real-time</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Payouts</p>
                          <p className="text-sm text-gray-600">See when money hits their bank account (usually every 2 business days)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Settings</p>
                          <p className="text-sm text-gray-600">Update bank details, business info, and notification preferences</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-sm text-gray-500">Tech:</span>
                      {['React', 'Node.js', 'PostgreSQL', 'TypeScript'].map((tech, idx) => (
                        <Badge key={idx} variant="secondary">{tech}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={expandedSections['users']} onOpenChange={(open) => toggleSection('users', open)}>
              <Card>
                <CollapsibleTrigger className="w-full" data-testid="section-users">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        Who Uses It?
                        {docSectionsRead['users'] && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      {expandedSections['users'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 bg-amber-100">
                            <AvatarFallback className="text-amber-700 text-lg">M</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-amber-900">Meet Maria - Coffee Shop Owner</p>
                            <p className="text-sm text-amber-800 mt-1">
                              Maria runs "Bean There" in Austin, TX. Every morning she checks her dashboard to see yesterday's sales, verify tips were processed correctly, and confirm her weekly payout is on schedule.
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">Small Business</Badge>
                              <Badge variant="outline" className="text-xs">50-100 transactions/day</Badge>
                              <Badge variant="outline" className="text-xs">CST Timezone</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div>
                      <p className="font-medium text-gray-900 mb-2">Maria's Daily Workflow:</p>
                      <ol className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">1</span>
                          Opens dashboard, checks total sales from yesterday
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">2</span>
                          Filters transactions by payment type (card vs cash)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">3</span>
                          Checks if Friday's payout arrived in her bank
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">4</span>
                          Downloads weekly report for her accountant
                        </li>
                      </ol>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800">
                        <strong>The Problem:</strong> Maria is in Austin (CST) but transactions show in UTC. A sale at 8pm Monday shows as 2am Tuesday - confusing her daily reconciliation!
                      </p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </TabsContent>

          <TabsContent value="mission" className="space-y-4 mt-4">
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Your Mission</p>
                    <p className="text-sm text-orange-800">
                      Fix the timezone bug so Maria sees transactions in her local time, not server time. You'll work on this starting Day 2.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Collapsible open={expandedSections['bug']} onOpenChange={(open) => toggleSection('bug', open)}>
              <Card>
                <CollapsibleTrigger className="w-full" data-testid="section-bug">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bug className="h-4 w-4 text-red-600" />
                        The Timezone Bug
                        {docSectionsRead['bug'] && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      {expandedSections['bug'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs font-medium text-red-600 mb-1">CURRENT (Bug)</p>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-8 w-8 text-red-400" />
                          <div>
                            <p className="font-mono text-sm">Feb 15, 02:30 AM</p>
                            <p className="text-xs text-red-600">Shows UTC time</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs font-medium text-green-600 mb-1">EXPECTED (Fixed)</p>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-8 w-8 text-green-400" />
                          <div>
                            <p className="font-mono text-sm">Feb 14, 08:30 PM</p>
                            <p className="text-xs text-green-600">Shows merchant's local time</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900 mb-2">What's Happening:</p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">1.</span>
                          <span>Transaction timestamps are stored in UTC (correct)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">2.</span>
                          <span>Frontend displays them as-is without conversion (bug)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">3.</span>
                          <span>Merchant's timezone preference is ignored</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900 mb-2">Files You'll Touch:</p>
                      <div className="font-mono text-xs space-y-1 text-blue-800">
                        <p>client/src/components/TransactionList.tsx</p>
                        <p>client/src/utils/dateFormatters.ts</p>
                        <p>shared/types/merchant.ts</p>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium text-green-900 mb-1">Success Criteria:</p>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Transactions display in merchant's configured timezone</li>
                        <li>• Date filters work correctly with local dates</li>
                        <li>• Existing tests pass + new timezone tests added</li>
                      </ul>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Collapsible open={expandedSections['setup']} onOpenChange={(open) => toggleSection('setup', open)}>
              <Card>
                <CollapsibleTrigger className="w-full" data-testid="section-setup">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-purple-600" />
                        How We Work
                        {docSectionsRead['setup'] && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </CardTitle>
                      {expandedSections['setup'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <p className="font-medium text-gray-900 mb-3">Development Workflow:</p>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>1</span> Pick ticket
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>2</span> Branch
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>3</span> Code
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>4</span> PR
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>5</span> Review
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                          <span>6</span> Merge
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400">
                      <pre className="whitespace-pre-wrap">{`# Your first commands tomorrow:
git checkout -b fix/timezone-display
npm install
npm run dev

# When ready to submit:
git add .
git commit -m "Fix timezone display in transactions"
git push origin fix/timezone-display`}</pre>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900 mb-2">Who to Ask:</p>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">S</AvatarFallback>
                          </Avatar>
                          <span><strong>Sarah</strong> - Code questions, PR reviews</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-pink-100 text-pink-700">P</AvatarFallback>
                          </Avatar>
                          <span><strong>Priya</strong> - Requirements, user context</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-green-100 text-green-700">M</AvatarFallback>
                          </Avatar>
                          <span><strong>Marcus</strong> - Architecture, tricky bugs</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-orange-100 text-orange-700">A</AvatarFallback>
                          </Avatar>
                          <span><strong>Alex</strong> - Testing, QA process</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="font-medium text-purple-900 mb-2">Team Norms:</p>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• <strong>Standup at 10am</strong> - Quick sync on progress</li>
                        <li>• <strong>Ask early</strong> - Stuck for 15 min? Ask for help</li>
                        <li>• <strong>Reviews = learning</strong> - Feedback is about code, not you</li>
                        <li>• <strong>Document as you go</strong> - Comments save future headaches</li>
                      </ul>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </TabsContent>
        </Tabs>

        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Reading progress</span>
            <span>{Object.keys(docSectionsRead).length} of 4 sections completed</span>
          </div>
          <Progress value={(Object.keys(docSectionsRead).length / 4) * 100} className="h-2" />
          
          <Button 
            className="w-full"
            onClick={handleFinishDocs}
            disabled={!allSectionsRead}
            data-testid="button-finish-reading"
          >
            {allSectionsRead ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                I've Read Everything - Show Me Day 2 Preview
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Read all 4 sections to continue
              </>
            )}
          </Button>
        </div>

        <Dialog open={showDay2Preview} onOpenChange={setShowDay2Preview}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-orange-500" />
                Ready for Day 2!
              </DialogTitle>
              <DialogDescription>
                Here's what you'll be working on tomorrow.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Bug className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">Your First Ticket</p>
                      <p className="text-sm text-orange-800 mt-1">
                        Fix timezone display in TransactionList so merchants see times in their local timezone, not UTC.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <p className="font-medium text-gray-900">Tomorrow's Goals:</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-400" />
                    Set up your development environment
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-400" />
                    Reproduce the timezone bug locally
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-400" />
                    Implement the fix in dateFormatters.ts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-400" />
                    Create your first Pull Request
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Pro tip:</strong> If you get stuck, message Sarah or check the codebase for similar date handling patterns.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => {
                setShowDay2Preview(false);
                setViewMode('overview');
              }} data-testid="button-got-it">
                Got it! Back to Day 1 Overview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  function renderComprehensionCheck() {
    const sarah = teamMembers.find(m => m.name === 'Sarah') || teamMembers[0];
    
    return (
      <div className="h-full flex flex-col">
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-700">S</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-blue-900">Comprehension Check with Sarah</p>
                <p className="text-sm text-blue-700">
                  Sarah will ask you some questions about what you've read. Answer naturally - this is a conversation, not a test!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {filteredInteractions.length === 0 && (
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <p className="text-xs font-medium text-purple-600 mb-1">Sarah</p>
                <p className="text-gray-800">
                  Hey! I see you've been reading through the docs. Before we get you started on anything, I just want to make sure we're on the same page. What's your understanding of what our Merchant Dashboard does?
                </p>
              </div>
            )}
            {filteredInteractions.map((interaction: any, idx: number) => (
              <div
                key={idx}
                className={`flex ${interaction.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                data-testid={`comprehension-message-${idx}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    interaction.sender === 'You'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  {interaction.sender !== 'You' && (
                    <p className="text-xs font-medium text-purple-600 mb-1">
                      {interaction.sender}
                    </p>
                  )}
                  <p className={interaction.sender === 'You' ? 'text-white' : 'text-gray-800'}>
                    {interaction.content}
                  </p>
                </div>
              </div>
            ))}
            {typingIndicator && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-500">{typingIndicator} is typing...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your response..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              data-testid="input-comprehension-message"
            />
            <Button 
              onClick={() => {
                setSelectedMember(sarah);
                handleSendMessage();
              }}
              disabled={!message.trim() || sendMessageMutation.isPending}
              data-testid="button-send-comprehension-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {filteredInteractions.length >= 4 && (
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => {
                setComprehensionComplete(true);
                setViewMode('overview');
              }}
              data-testid="button-complete-comprehension"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Comprehension Check
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-session-title">
                {project.name}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Your first week as a software engineering intern
              </p>
            </div>
            <Button
              onClick={onComplete}
              variant="outline"
              size="sm"
              data-testid="button-exit-session"
            >
              Exit Simulation
            </Button>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Day {currentDay} of 5</span>
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Today's Progress</span>
                <span className="font-medium">{dayProgress}%</span>
              </div>
              <Progress value={dayProgress} className="h-2" />
            </div>
            {dayProgress >= 80 && currentDay < 5 && (
              <Button 
                size="sm"
                onClick={() => setCurrentDay(currentDay + 1)}
                data-testid="button-next-day"
              >
                Continue to Day {currentDay + 1}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-screen-xl mx-auto px-6 py-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4 overflow-y-auto">
              <Card data-testid="card-day-info">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Day {currentDay}: {currentDayData?.theme}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentDayData?.activities?.map((activity: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 ${
                          (idx === 0 && Object.keys(introProgress).length > 0) ||
                          (idx === 1 && docsRead) ||
                          (idx === 2 && comprehensionComplete)
                            ? 'text-green-600'
                            : 'text-gray-300'
                        }`} />
                        <span className="text-gray-700">{activity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-learning-objectives">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requirements.learningObjectives?.slice(0, 3).map((obj: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {viewMode !== 'overview' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setViewMode('overview');
                    setSelectedMember(null);
                  }}
                  data-testid="button-back-to-overview"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Overview
                </Button>
              )}
            </div>

            <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardContent className="flex-1 overflow-y-auto p-6">
                  {viewMode === 'overview' && renderOverview()}
                  {viewMode === 'team-intro' && renderTeamIntroView()}
                  {viewMode === 'documentation' && renderDocumentation()}
                  {viewMode === 'comprehension-check' && renderComprehensionCheck()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
