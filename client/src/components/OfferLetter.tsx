import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, Calendar, DollarSign, Briefcase, Heart, Users, 
  Clock, Gift, ArrowRight, CheckCircle2, Sparkles, FileText,
  PartyPopper, Medal
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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
              Congratulations, {candidateName.split(' ')[0]}!
            </h2>
            <p className="text-green-600 dark:text-green-500">
              {company.name} is excited to extend you an offer for the {job.title} position.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-lg bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-2xl font-bold text-primary">
                {company.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Official Offer Letter</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" data-testid="badge-offer-pending">
              Pending Response
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-8">
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
          
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Compensation Package
            </h3>
            
            <div className="grid gap-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Base Salary</span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-base-salary">
                    {formatCurrency(offer.baseSalary)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Paid bi-weekly, {offer.salaryFrequency}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offer.signingBonus && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Signing Bonus</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-signing-bonus">
                      {formatCurrency(offer.signingBonus)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Paid with first paycheck
                    </p>
                  </div>
                )}
                
                {offer.annualBonus && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Medal className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Bonus Target</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-annual-bonus">
                      {offer.annualBonus.targetPercent}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {offer.annualBonus.description}
                    </p>
                  </div>
                )}
                
                {offer.equity && offer.equity.type !== 'none' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {offer.equity.type === 'stock_options' ? 'Stock Options' : 'RSUs'}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="text-equity">
                      {formatCurrency(offer.equity.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {offer.equity.vestingSchedule}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Total Compensation Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Annual (Ongoing)</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(comp.totalAnnual)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">First Year Total</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-first-year-total">
                      {formatCurrency(comp.totalFirstYear)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Benefits & Perks
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Health Insurance</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{offer.benefits.healthInsurance}</p>
                </div>
              </div>
              
              {offer.benefits.dentalVision && (
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Dental & Vision</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Full coverage included</p>
                  </div>
                </div>
              )}
              
              {offer.benefits.retirement401k.available && (
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">401(k) Retirement</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {offer.benefits.retirement401k.matchPercent}% employer match (up to {formatCurrency(offer.benefits.retirement401k.maxMatch || 0)})
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
              
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              Position Details
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Start Date</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm mt-1" data-testid="text-start-date">{offer.startDate}</p>
              </div>
              
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Users className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reports To</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm mt-1">{offer.reportingTo}</p>
              </div>
              
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Building2 className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Team Size</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm mt-1">{offer.teamSize} people</p>
              </div>
              
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Clock className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Response By</p>
                <p className="font-medium text-red-600 dark:text-red-400 text-sm mt-1" data-testid="text-deadline">{offer.responseDeadline}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
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
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
              Ready to negotiate?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Practice your negotiation skills with our AI-powered simulator. You can try different strategies 
              and learn how to maximize your compensation package.
            </p>
          </div>
          <Button 
            onClick={onProceedToNegotiation}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white ml-4"
            data-testid="button-proceed-negotiation"
          >
            <FileText className="h-4 w-4 mr-2" />
            Practice Negotiation
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
