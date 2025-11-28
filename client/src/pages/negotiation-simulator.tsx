import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatScore, getScoreColor } from "@/lib/utils";
import NegotiationSession from "@/components/simulation/negotiation-session";
import { 
  DollarSign, TrendingUp, Handshake, Play, Building2, Briefcase, 
  Target, CheckCircle2, MapPin, ArrowRight, ChevronLeft
} from "lucide-react";
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
  stages: any[];
}

const scenarios = [
  {
    id: "salary",
    title: "Salary Negotiation",
    description: "Negotiate your salary with HR or hiring manager",
    icon: DollarSign,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400"
  },
  {
    id: "promotion", 
    title: "Promotion Discussion",
    description: "Discuss career advancement with your manager",
    icon: TrendingUp,
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400"
  },
  {
    id: "offer",
    title: "Job Offer Terms",
    description: "Negotiate complete offer package terms",
    icon: Handshake,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400"
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

// Offer Selection Card Component
function OfferCard({ 
  application, 
  isSelected, 
  onSelect 
}: { 
  application: ApplicationWithOffer; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  const offer = application.offerDetails!;
  
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all",
        isSelected 
          ? "border-primary bg-primary/5 dark:bg-primary/10" 
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      )}
      data-testid={`offer-card-${application.id}`}
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-primary shrink-0">
          {application.job.company.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {application.job.title}
            </h3>
            {isSelected && (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {application.job.company.name} • {application.job.location}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Base Salary</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(offer.baseSalary)}
              </p>
            </div>
            {offer.signingBonus && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Signing</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(offer.signingBonus)}
                </p>
              </div>
            )}
            {offer.equity && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Equity</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(offer.equity.amount)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// Offer Selection Step
function OfferSelectionStep({ 
  offers, 
  selectedOfferId,
  onSelectOffer,
  onContinue,
  onPracticeMode
}: { 
  offers: ApplicationWithOffer[];
  selectedOfferId: number | null;
  onSelectOffer: (id: number) => void;
  onContinue: () => void;
  onPracticeMode: () => void;
}) {
  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Negotiation Simulator
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Select an offer to practice negotiating, or practice with a custom scenario.
          </p>
        </div>

        {offers.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-green-600" />
                Your Offers
              </CardTitle>
              <CardDescription>
                Choose an offer to practice negotiating for better terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  application={offer}
                  isSelected={selectedOfferId === offer.id}
                  onSelect={() => onSelectOffer(offer.id)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-4">
          {offers.length > 0 && (
            <Button
              size="lg"
              onClick={onContinue}
              disabled={!selectedOfferId}
              className="flex-1"
              data-testid="button-continue-with-offer"
            >
              Negotiate This Offer
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          <Button
            size="lg"
            variant={offers.length > 0 ? "outline" : "default"}
            onClick={onPracticeMode}
            className={offers.length === 0 ? "flex-1" : ""}
            data-testid="button-practice-mode"
          >
            {offers.length > 0 ? "Practice Mode Instead" : "Start Practice Session"}
          </Button>
        </div>

        {offers.length === 0 && (
          <Card className="mt-6 bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No Offers Yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Complete your interview stages in the Job Journey to receive offers. 
                In the meantime, you can practice negotiation with custom scenarios.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Selected Offer Summary (shown in configuration step)
function SelectedOfferSummary({ 
  application,
  onChangeOffer 
}: { 
  application: ApplicationWithOffer;
  onChangeOffer: () => void;
}) {
  const offer = application.offerDetails!;
  
  return (
    <Card className="mb-6 border border-gray-200 dark:border-gray-700 overflow-hidden">
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary text-primary" data-testid="badge-journey-mode">
              Journey Mode
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onChangeOffer}
              className="text-gray-500 hover:text-gray-700"
              data-testid="button-change-offer"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Change
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current Base Offer</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white" data-testid="text-current-offer">
                {formatCurrency(offer.baseSalary)}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Suggested target:</span>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(Math.round(offer.baseSalary * 1.15))}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">(+15%)</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {offer.signingBonus && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Signing</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(offer.signingBonus)}
                </p>
              </div>
            )}
            {offer.annualBonus && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Bonus</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {offer.annualBonus.targetPercent}%
                </p>
              </div>
            )}
            {offer.equity && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">Equity</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(offer.equity.amount)}
                </p>
              </div>
            )}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {offer.startDate}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NegotiationSimulator() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const applicationIdFromUrl = searchParams.get('applicationId');
  
  // Step management: 'select' | 'configure' | 'session'
  const [step, setStep] = useState<'select' | 'configure' | 'session'>(
    applicationIdFromUrl ? 'configure' : 'select'
  );
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(
    applicationIdFromUrl ? parseInt(applicationIdFromUrl) : null
  );
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [selectedScenario, setSelectedScenario] = useState("salary");
  const [targetAmount, setTargetAmount] = useState("120000");
  const [companyRange, setCompanyRange] = useState("$90k - $110k");
  const [counterpartStyle, setCounterpartStyle] = useState("collaborative");

  const { data: user } = useQuery<{ id: number }>({
    queryKey: ["/api/user"],
  });

  // Dedicated query for direct applicationId links (works even before allApplications loads)
  const { data: directApplication, isLoading: isLoadingDirect } = useQuery<ApplicationWithOffer>({
    queryKey: [applicationIdFromUrl ? `/api/applications/${applicationIdFromUrl}` : null],
    enabled: !!applicationIdFromUrl,
  });

  // Fetch all applications to find offers for the selection step
  const { data: allApplications = [], isLoading: isLoadingApplications } = useQuery<ApplicationWithOffer[]>({
    queryKey: [user?.id ? `/api/users/${user.id}/applications` : null],
    enabled: !!user?.id,
  });

  // Filter to only applications with offers
  const applicationsWithOffers = allApplications.filter(
    app => app.status === 'offer' && app.offerDetails
  );

  // Get selected application - prioritize direct query for URL-based selection
  const selectedApplication = selectedApplicationId 
    ? (directApplication?.id === selectedApplicationId 
        ? directApplication 
        : applicationsWithOffers.find(app => app.id === selectedApplicationId))
    : null;

  // Update config when application is selected
  useEffect(() => {
    if (selectedApplication?.offerDetails) {
      setSelectedScenario("offer");
      setTargetAmount(String(Math.round(selectedApplication.offerDetails.baseSalary * 1.15)));
      const currentOffer = formatCurrency(selectedApplication.offerDetails.baseSalary);
      setCompanyRange(`${currentOffer} (current offer)`);
    }
  }, [selectedApplication]);

  // Sync URL when selection changes (persist selection across refreshes)
  useEffect(() => {
    if (step === 'configure' && selectedApplicationId && !applicationIdFromUrl) {
      navigate(`/negotiation?applicationId=${selectedApplicationId}`, { replace: true });
    }
  }, [step, selectedApplicationId, applicationIdFromUrl, navigate]);

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
      setStep('session');
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
      counterpartStyle,
      applicationId: selectedApplicationId,
    };

    createSessionMutation.mutate({
      userId: user.id,
      type: 'negotiation',
      status: 'active',
      configuration,
      messages: []
    });
  };

  const handleSelectOffer = (id: number) => {
    setSelectedApplicationId(id);
  };

  const handleContinueWithOffer = () => {
    if (selectedApplicationId) {
      setStep('configure');
    }
  };

  const handlePracticeMode = () => {
    setSelectedApplicationId(null);
    setSelectedScenario("salary");
    setTargetAmount("120000");
    setCompanyRange("$90k - $110k");
    setStep('configure');
  };

  const handleChangeOffer = () => {
    setStep('select');
    setSelectedApplicationId(null);
    navigate('/negotiation', { replace: true });
  };

  // Show active session
  if (currentSession || step === 'session') {
    return (
      <NegotiationSession 
        session={currentSession}
        onComplete={() => {
          setCurrentSession(null);
          setStep('select');
          setSelectedApplicationId(null);
          navigate('/negotiation', { replace: true });
          queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/sessions`] });
        }}
      />
    );
  }

  // Loading state - show for direct link loading or applications loading in selection step
  const isLoading = (step === 'configure' && applicationIdFromUrl && isLoadingDirect) 
    || (step === 'select' && isLoadingApplications);
  
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Offer Selection Step
  if (step === 'select') {
    return (
      <OfferSelectionStep
        offers={applicationsWithOffers}
        selectedOfferId={selectedApplicationId}
        onSelectOffer={handleSelectOffer}
        onContinue={handleContinueWithOffer}
        onPracticeMode={handlePracticeMode}
      />
    );
  }

  // Configuration Step
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button for practice mode */}
        {!selectedApplication && (
          <button
            onClick={() => setStep('select')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
            data-testid="button-back-to-selection"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to offer selection
          </button>
        )}

        {/* Selected Offer Summary */}
        {selectedApplication && (
          <SelectedOfferSummary 
            application={selectedApplication}
            onChangeOffer={handleChangeOffer}
          />
        )}
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedApplication ? "Configure Negotiation" : "Practice Negotiation"}
              </CardTitle>
              {!selectedApplication && (
                <Badge variant="outline" className="border-purple-400 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20" data-testid="badge-practice-mode">
                  Practice Mode
                </Badge>
              )}
            </div>
            <CardDescription>
              {selectedApplication 
                ? "Customize your negotiation parameters before starting"
                : "Build your negotiation skills with sample scenarios — no real stakes"
              }
            </CardDescription>
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
                        "cursor-pointer p-4 rounded-lg border-2 transition-all",
                        selectedScenario === scenario.id 
                          ? "border-primary bg-primary/5" 
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                      onClick={() => setSelectedScenario(scenario.id)}
                      data-testid={`scenario-${scenario.id}`}
                    >
                      <div className={`w-12 h-12 ${scenario.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                        <Icon className={`${scenario.iconColor} h-6 w-6`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{scenario.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{scenario.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Negotiation Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Target</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    className="pl-8"
                    placeholder="120000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    data-testid="input-target-amount"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company's Likely Range</Label>
                <Input
                  className="mt-2"
                  placeholder="$90k - $110k"
                  value={companyRange}
                  onChange={(e) => setCompanyRange(e.target.value)}
                  data-testid="input-company-range"
                />
              </div>
            </div>

            {/* Counterpart Style */}
            <div className="mb-8">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Counterpart Style</Label>
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
                    data-testid={`style-${style.id}`}
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
                data-testid="button-start-negotiation"
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
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Previous Negotiations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {negotiationSessions.map((session: any) => (
                  <div key={session.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Handshake className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                            {session.configuration?.scenario} Negotiation
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
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
                            <p className="text-xs text-gray-500 dark:text-gray-400">
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
