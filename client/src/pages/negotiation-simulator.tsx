import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatScore, getScoreColor } from "@/lib/utils";
import NegotiationSession from "@/components/simulation/negotiation-session";
import { DollarSign, TrendingUp, Handshake, Play, Building2, Briefcase, Target, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OfferDetails } from "@shared/schema";

interface ApplicationWithOffer {
  id: number;
  status: string;
  offerDetails: OfferDetails | null;
  job: {
    title: string;
    role: string;
    location: string;
    company: {
      id: number;
      name: string;
      logo: string | null;
      industry: string;
    };
  };
}

const scenarios = [
  {
    id: "salary",
    title: "Salary Negotiation",
    description: "Negotiate your salary with HR or hiring manager",
    icon: DollarSign,
    bgColor: "bg-green-100",
    iconColor: "text-green-600"
  },
  {
    id: "promotion", 
    title: "Promotion Discussion",
    description: "Discuss career advancement with your manager",
    icon: TrendingUp,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600"
  },
  {
    id: "offer",
    title: "Job Offer Terms",
    description: "Negotiate complete offer package terms",
    icon: Handshake,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600"
  }
];

const counterpartStyles = [
  { id: "collaborative", label: "Collaborative", icon: "👥" },
  { id: "competitive", label: "Competitive", icon: "♟️" },
  { id: "analytical", label: "Analytical", icon: "📊" },
  { id: "relationship", label: "Relationship-focused", icon: "❤️" }
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function NegotiationSimulator() {
  const { toast } = useToast();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const applicationId = searchParams.get('applicationId');
  
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [selectedScenario, setSelectedScenario] = useState("salary");
  const [targetAmount, setTargetAmount] = useState("120000");
  const [companyRange, setCompanyRange] = useState("$90k - $110k");
  const [counterpartStyle, setCounterpartStyle] = useState("collaborative");

  const { data: user } = useQuery<{ id: number }>({
    queryKey: ["/api/user"],
  });

  const { data: application } = useQuery<ApplicationWithOffer>({
    queryKey: [applicationId ? `/api/applications/${applicationId}` : null],
    enabled: !!applicationId,
  });

  useEffect(() => {
    if (application?.offerDetails) {
      setSelectedScenario("offer");
      setTargetAmount(String(Math.round(application.offerDetails.baseSalary * 1.15)));
      const currentOffer = formatCurrency(application.offerDetails.baseSalary);
      setCompanyRange(`${currentOffer} (current offer)`);
    }
  }, [application]);

  const { data: previousSessions = [] } = useQuery<Array<{ id: number; type: string; configuration?: { scenario?: string; targetAmount?: number }; score?: number }>>({
    queryKey: [`/api/user/${user?.id}/sessions`],
    enabled: !!user?.id,
  });

  const negotiationSessions = previousSessions.filter((session: any) => session.type === 'negotiation');

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
        description: "Failed to start negotiation session",
        variant: "destructive",
      });
    },
  });

  const handleStartNegotiation = async () => {
    if (!user) return;

    const configuration = {
      scenario: selectedScenario,
      targetAmount: parseInt(targetAmount),
      companyRange,
      counterpartStyle
    };

    createSessionMutation.mutate({
      userId: user.id,
      type: 'negotiation',
      status: 'active',
      configuration,
      messages: []
    });
  };

  if (currentSession) {
    return (
      <NegotiationSession 
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
        {application?.offerDetails && (
          <Card className="mb-6 border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-lg font-bold text-primary border border-gray-200 dark:border-gray-600">
                    {application.job.company.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {application.job.company.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {application.job.title} • {application.job.location}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-primary text-primary" data-testid="badge-journey-mode">
                  Journey Mode
                </Badge>
              </div>
            </div>
            
            {/* Two-Column Layout */}
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Pay Headline */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current Base Offer</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white" data-testid="text-current-offer">
                      {formatCurrency(application.offerDetails.baseSalary)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Your target:</span>
                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(Math.round(application.offerDetails.baseSalary * 1.15))}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">(+15%)</span>
                  </div>
                </div>
                
                {/* Right Column - Secondary Terms */}
                <div className="grid grid-cols-2 gap-3">
                  {application.offerDetails.signingBonus && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Signing</p>
                      <p className="font-semibold text-gray-900 dark:text-white" data-testid="text-current-signing">
                        {formatCurrency(application.offerDetails.signingBonus)}
                      </p>
                    </div>
                  )}
                  {application.offerDetails.annualBonus && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Bonus</p>
                      <p className="font-semibold text-gray-900 dark:text-white" data-testid="text-current-bonus">
                        {application.offerDetails.annualBonus.targetPercent}%
                      </p>
                    </div>
                  )}
                  {application.offerDetails.equity && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Equity</p>
                      <p className="font-semibold text-gray-900 dark:text-white" data-testid="text-current-equity">
                        {formatCurrency(application.offerDetails.equity.amount)}
                      </p>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {application.offerDetails.startDate}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Link back to offer */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Practice negotiating before responding to your offer.
                </p>
                <a 
                  href="/journey" 
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                  data-testid="link-view-full-offer"
                >
                  View Full Offer
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Negotiation Simulator</CardTitle>
            {application?.offerDetails && (
              <CardDescription>
                Practice negotiating your offer before the real conversation
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-8">
            {/* Scenario Selection */}
            <div className="mb-8">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Choose Negotiation Scenario
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {scenarios.map((scenario) => {
                  const Icon = scenario.icon;
                  return (
                    <div
                      key={scenario.id}
                      className={cn(
                        "scenario-card",
                        selectedScenario === scenario.id && "active"
                      )}
                      onClick={() => setSelectedScenario(scenario.id)}
                    >
                      <div className={`w-12 h-12 ${scenario.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                        <Icon className={`${scenario.iconColor} h-6 w-6`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{scenario.title}</h3>
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Negotiation Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Your Target</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    className="pl-8"
                    placeholder="120000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Company's Likely Range</Label>
                <Input
                  className="mt-2"
                  placeholder="$90k - $110k"
                  value={companyRange}
                  onChange={(e) => setCompanyRange(e.target.value)}
                />
              </div>
            </div>

            {/* Counterpart Style */}
            <div className="mb-8">
              <Label className="text-sm font-medium text-gray-700 mb-2">Counterpart Style</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {counterpartStyles.map((style) => (
                  <Button
                    key={style.id}
                    variant={counterpartStyle === style.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCounterpartStyle(style.id)}
                    className={cn(
                      "flex flex-col items-center space-y-1 h-auto py-3",
                      counterpartStyle === style.id && "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    <span className="text-lg">{style.icon}</span>
                    <span className="text-xs">{style.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Start Negotiation */}
            <div className="flex justify-center">
              <Button 
                size="lg"
                onClick={handleStartNegotiation}
                disabled={createSessionMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="mr-2 h-4 w-4" />
                {createSessionMutation.isPending ? "Starting..." : "Start Negotiation"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Previous Negotiations */}
        {negotiationSessions.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Previous Negotiations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {negotiationSessions.map((session: any) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Handshake className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {session.configuration?.scenario} Negotiation
                          </h4>
                          <p className="text-sm text-gray-600">
                            Target: ${session.configuration?.targetAmount?.toLocaleString()} → Final: {session.score ? 'TBD' : 'In Progress'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {session.score && (
                          <>
                            <p className={`text-sm font-medium ${getScoreColor(session.score)}`}>
                              Success Rate: {session.score}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {session.score >= 80 ? 'Strong performance' : session.score >= 60 ? 'Good result' : 'Needs improvement'}
                            </p>
                          </>
                        )}
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
