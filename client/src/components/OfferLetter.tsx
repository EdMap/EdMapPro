import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, Calendar, DollarSign, Briefcase, Heart, Users, 
  Clock, Gift, CheckCircle2, Sparkles,
  Medal, ChevronDown, ChevronUp
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
  onAcceptOffer?: () => void;
  onDeclineOffer?: () => void;
  isLoading?: boolean;
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

export function OfferLetter({ offer, company, job, candidateName, onProceedToNegotiation, onAcceptOffer, onDeclineOffer, isLoading }: OfferLetterProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const comp = calculateTotalComp(offer);
  
  return (
    <Card className="border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Compact Summary Header - Always Visible */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Company & Role Info */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-primary border border-gray-200 dark:border-gray-700 flex-shrink-0">
              {company.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {company.name}
                </h3>
                <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 flex-shrink-0" data-testid="badge-offer-pending">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {job.title} • {job.location}
              </p>
            </div>
          </div>

          {/* Center: Key Compensation Summary */}
          <div className="hidden md:flex items-center gap-6 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Base</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid="text-base-salary">
                {formatCurrency(offer.baseSalary)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">First Year</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-first-year-total">
                {formatCurrency(comp.totalFirstYear)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Respond By</p>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400" data-testid="text-deadline">
                {offer.responseDeadline}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="outline"
              size="sm"
              onClick={onDeclineOffer}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              data-testid="button-decline"
            >
              {isLoading ? 'Processing...' : 'Decline'}
            </Button>
            <Button 
              onClick={onProceedToNegotiation}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white"
              data-testid="button-proceed-negotiation"
            >
              Negotiate Your Offer
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={onAcceptOffer}
              disabled={isLoading}
              className="border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              data-testid="button-accept"
            >
              {isLoading ? 'Processing...' : 'Accept Offer'}
            </Button>
          </div>
        </div>

        {/* Mobile: Compensation Summary */}
        <div className="md:hidden mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Base</p>
            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(offer.baseSalary)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">First Year</p>
            <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(comp.totalFirstYear)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Respond By</p>
            <p className="font-medium text-amber-600 dark:text-amber-400 text-sm">{offer.responseDeadline}</p>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2 border-t border-gray-200 dark:border-gray-700 transition-colors"
          data-testid="button-toggle-details"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide Full Offer Letter
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              View Full Offer Letter
            </>
          )}
        </button>
      </div>

      {/* Expanded Full Offer Letter */}
      {isExpanded && (
        <CardContent className="pt-0 pb-6 px-6 space-y-6 border-t border-gray-200 dark:border-gray-700">
          {/* Salutation */}
          <div className="prose dark:prose-invert max-w-none pt-6">
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
              {/* Total Comp Summary */}
              <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-5 text-white">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">First Year Total</p>
                    <p className="text-3xl font-bold text-green-400">
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
                    <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid="text-signing-bonus">
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
          {offer.benefits && (
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Benefits & Perks
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {offer.benefits.healthInsurance && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Health Insurance</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{offer.benefits.healthInsurance}</p>
                </div>
              </div>
              )}
              
              {offer.benefits.dentalVision && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Dental & Vision</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Full coverage included</p>
                  </div>
                </div>
              )}
              
              {offer.benefits.retirement401k?.available && (
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
              
              {offer.benefits.pto && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Paid Time Off</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {typeof offer.benefits.pto === 'string' 
                      ? offer.benefits.pto
                      : offer.benefits.pto.type === 'unlimited' 
                        ? 'Unlimited PTO policy' 
                        : `${offer.benefits.pto.days} days per year`}
                  </p>
                </div>
              </div>
              )}
              
              {offer.benefits.remote && (
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
              )}
              
              {offer.benefits.otherBenefits?.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
          
          <Separator />
          
          {/* Position Details */}
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              Position Details
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                </div>
                <p className="font-medium text-gray-900 dark:text-white text-sm" data-testid="text-start-date">{offer.startDate}</p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reports To</p>
                </div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{offer.reportingTo}</p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Team Size</p>
                </div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{offer.teamSize} people</p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Deadline</p>
                </div>
                <p className="font-medium text-amber-600 dark:text-amber-400 text-sm">{offer.responseDeadline}</p>
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
      )}
    </Card>
  );
}
