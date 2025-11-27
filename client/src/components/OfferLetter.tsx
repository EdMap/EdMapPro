import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, Calendar, DollarSign, Briefcase, Heart, Users, 
  Clock, Gift, ArrowRight, CheckCircle2, Sparkles, FileText,
  Medal, MessageSquare, X, Check
} from "lucide-react";
import type { OfferDetails } from "@shared/schema";

interface Company {
  id: number;
  name: string;
  logo: string | null;
  industry: string;
}

interface JobPosting {
  title: string;
  role: string;
  location: string;
  department?: string;
}

interface OfferLetterProps {
  offer: OfferDetails;
  company: Company;
  job: JobPosting;
  candidateName: string;
  onProceedToNegotiation: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateTotalComp(offer: OfferDetails): {
  base: number;
  bonus: number;
  equity: number;
  signing: number;
  totalAnnual: number;
  totalFirstYear: number;
} {
  const base = offer.baseSalary;
  const bonus = offer.annualBonus 
    ? Math.round(base * (offer.annualBonus.targetPercent / 100))
    : 0;
  const equity = offer.equity 
    ? Math.round(offer.equity.amount / 4)
    : 0;
  const signing = offer.signingBonus || 0;
  
  return {
    base,
    bonus,
    equity,
    signing,
    totalAnnual: base + bonus + equity,
    totalFirstYear: base + bonus + equity + signing,
  };
}

export function OfferLetter({ offer, company, job, candidateName, onProceedToNegotiation }: OfferLetterProps) {
  const comp = calculateTotalComp(offer);
  
  return (
    <div className="space-y-6">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20" data-testid="badge-offer-pending">
              <Clock className="h-3 w-3 mr-1" />
              Pending Response
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Respond by <span className="font-medium text-gray-700 dark:text-gray-300">{offer.responseDeadline}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-gray-600 dark:text-gray-400"
              data-testid="button-ask-questions"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Ask Questions
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              data-testid="button-decline"
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
            <Button 
              onClick={onProceedToNegotiation}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-proceed-negotiation"
            >
              <FileText className="h-4 w-4 mr-1" />
              Negotiate
            </Button>
            <Button 
              variant="default" 
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-accept"
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
          </div>
        </div>
      </div>

      {/* Company Masthead */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl font-bold text-primary border border-gray-200 dark:border-gray-700">
            {company.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">Official Offer Letter • {company.industry}</p>
          </div>
        </div>
      </div>

      {/* Quick Snapshot Row */}
      <Card className="border-2 border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Offer Snapshot
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {job.title} • {job.location}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div data-testid="snapshot-base-salary">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Base Salary</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-base-salary">
                {formatCurrency(offer.baseSalary)}
              </p>
            </div>
            <div data-testid="snapshot-signing-bonus">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Signing Bonus</p>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300" data-testid="text-signing-bonus">
                {offer.signingBonus ? formatCurrency(offer.signingBonus) : "—"}
              </p>
            </div>
            <div data-testid="snapshot-start-date">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Start Date</p>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300" data-testid="text-start-date">
                {offer.startDate}
              </p>
            </div>
            <div data-testid="snapshot-deadline">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Respond By</p>
              <p className="text-xl font-semibold text-amber-600 dark:text-amber-400" data-testid="text-deadline">
                {offer.responseDeadline}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Offer Card */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6 space-y-8">
          {/* Salutation */}
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Dear {candidateName},
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              On behalf of {company.name}, I am pleased to offer you the position of <strong>{job.title}</strong> in 
              our {job.location} location. Based on your impressive interview performance and qualifications, we believe 
              you will be an excellent addition to our team.
            </p>
          </div>
          
          {/* Compensation Package */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Compensation Package
            </h3>
            
            <div className="space-y-4">
              {/* Total Comp Summary - Now at the top with emphasis */}
              <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-5 text-white">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">First Year Total</p>
                    <p className="text-3xl font-bold text-green-400" data-testid="text-first-year-total">
                      {formatCurrency(comp.totalFirstYear)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Including signing bonus</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Annual (Ongoing)</p>
                    <p className="text-2xl font-semibold text-white">{formatCurrency(comp.totalAnnual)}</p>
                    <p className="text-xs text-gray-400 mt-1">Base + bonus + equity</p>
                  </div>
                </div>
              </div>

              {/* Component Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Base</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(comp.base)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{offer.salaryFrequency}</p>
                </div>

                {offer.signingBonus && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-purple-500" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Signing</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(offer.signingBonus)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">One-time</p>
                  </div>
                )}

                {offer.annualBonus && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Medal className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Bonus</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid="text-annual-bonus">
                      {offer.annualBonus.targetPercent}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ~{formatCurrency(comp.bonus)}/yr
                    </p>
                  </div>
                )}

                {offer.equity && offer.equity.type !== 'none' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {offer.equity.type === 'stock_options' ? 'Options' : 'RSUs'}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid="text-equity">
                      {formatCurrency(offer.equity.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {offer.equity.vestingSchedule}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Benefits & Perks */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Benefits & Perks
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Health Insurance</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{offer.benefits.healthInsurance}</p>
                </div>
              </div>
              
              {offer.benefits.dentalVision && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Dental & Vision</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Full coverage included</p>
                  </div>
                </div>
              )}
              
              {offer.benefits.retirement401k.available && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">401(k) Retirement</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {offer.benefits.retirement401k.matchPercent}% employer match (up to {formatCurrency(offer.benefits.retirement401k.maxMatch || 0)})
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Paid Time Off</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {offer.benefits.pto.type === 'unlimited' 
                      ? 'Unlimited PTO policy' 
                      : `${offer.benefits.pto.days} days per year`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Work Location</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {offer.benefits.remote === 'full' 
                      ? 'Fully remote' 
                      : offer.benefits.remote === 'hybrid' 
                        ? 'Hybrid (flexible)' 
                        : 'On-site'}
                  </p>
                </div>
              </div>
              
              {offer.benefits.otherBenefits.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Position Details */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              Position Details
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Start Date</p>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{offer.startDate}</p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reports To</p>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{offer.reportingTo}</p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Team Size</p>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{offer.teamSize} people</p>
              </div>
            </div>
          </div>
          
          {/* Closing */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Please confirm your acceptance of this offer by the deadline noted above. This offer is contingent upon 
              successful completion of a background check and verification of your right to work in the United States.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
              We are excited about the possibility of you joining our team and look forward to your response.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="font-medium text-gray-900 dark:text-white">{offer.offerLetterSignatory}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{offer.offerLetterSignatoryTitle}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{company.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom CTA for negotiation (supplementary) */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Want to negotiate this offer?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Practice negotiation strategies with our AI simulator before responding.
            </p>
          </div>
          <Button 
            onClick={onProceedToNegotiation}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-negotiate-bottom"
          >
            Practice Negotiation
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
