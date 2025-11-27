import type { OfferDetails, JobPosting, Company, ApplicationStage } from "@shared/schema";

interface OfferGeneratorParams {
  jobPosting: JobPosting;
  company: Company;
  stages: ApplicationStage[];
  candidateName: string;
}

export function generateJobOffer(params: OfferGeneratorParams): OfferDetails {
  const { jobPosting, company, stages } = params;
  
  const completedStages = stages.filter(s => s.status === 'completed' || s.status === 'passed');
  const avgScore = completedStages.length > 0
    ? Math.round(completedStages.reduce((sum, s) => sum + (s.score || 75), 0) / completedStages.length)
    : 75;
  
  const salaryMin = jobPosting.salaryMin || 100000;
  const salaryMax = jobPosting.salaryMax || 180000;
  const salaryRange = salaryMax - salaryMin;
  
  const performanceMultiplier = (avgScore - 60) / 40;
  const baseSalary = Math.round(salaryMin + (salaryRange * 0.3) + (salaryRange * 0.4 * Math.max(0, Math.min(1, performanceMultiplier))));
  
  const companySize = company.size || 'mid-size';
  const hasEquity = companySize === 'startup' || companySize === 'mid-size';
  const hasSigningBonus = avgScore >= 85 || companySize === 'enterprise';
  
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 21);
  
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + 7);
  
  const signatoryNames: Record<string, { name: string; title: string }> = {
    'QuantumSphere Innovations': { name: 'Sarah Chen', title: 'VP of Talent' },
    'CyberVortex Technologies': { name: 'Michael Torres', title: 'Head of People Operations' },
    'NanoByte Dynamics': { name: 'Dr. Emily Watson', title: 'Chief People Officer' },
    'FinanceFlow Systems': { name: 'David Miller', title: 'Director of Human Resources' },
    'CloudNexus': { name: 'Jennifer Park', title: 'VP of People & Culture' },
    'DataViz Pro': { name: 'Amanda Rodriguez', title: 'Chief People Officer' },
  };
  
  const signatory = signatoryNames[company.name] || { name: 'HR Team', title: 'Human Resources' };
  
  const reportingToOptions: Record<string, string> = {
    'developer': 'Engineering Manager',
    'pm': 'Director of Product',
    'designer': 'Design Lead',
    'data-scientist': 'Head of Data Science',
    'devops': 'Platform Engineering Manager',
    'qa': 'QA Manager',
  };
  
  const reportingTo = reportingToOptions[jobPosting.role] || 'Hiring Manager';
  
  const teamSizeByRole: Record<string, number> = {
    'developer': 8,
    'pm': 5,
    'designer': 4,
    'data-scientist': 6,
    'devops': 5,
    'qa': 4,
  };
  
  const teamSize = teamSizeByRole[jobPosting.role] || 6;
  
  const offer: OfferDetails = {
    baseSalary,
    salaryFrequency: 'annual',
    
    signingBonus: hasSigningBonus ? Math.round(baseSalary * 0.1) : undefined,
    
    annualBonus: {
      targetPercent: companySize === 'enterprise' ? 20 : companySize === 'mid-size' ? 15 : 10,
      description: 'Based on individual and company performance, paid annually',
    },
    
    equity: hasEquity ? {
      type: companySize === 'startup' ? 'stock_options' : 'rsu',
      amount: companySize === 'startup' 
        ? Math.round(baseSalary * 0.5) 
        : Math.round(baseSalary * 0.25),
      vestingSchedule: '4-year vesting with 1-year cliff',
      cliffMonths: 12,
      totalVestingMonths: 48,
    } : undefined,
    
    benefits: {
      healthInsurance: companySize === 'startup' 
        ? 'Comprehensive medical coverage (80% employer paid)' 
        : 'Premium PPO medical, including family coverage (100% employer paid for employee)',
      dentalVision: true,
      retirement401k: {
        available: true,
        matchPercent: companySize === 'enterprise' ? 6 : 4,
        maxMatch: companySize === 'enterprise' ? 12000 : 8000,
      },
      pto: {
        days: companySize === 'startup' ? 0 : companySize === 'enterprise' ? 25 : 20,
        type: companySize === 'startup' ? 'unlimited' : 'accrued',
      },
      remote: jobPosting.location.toLowerCase().includes('remote') 
        ? 'full' 
        : jobPosting.location.toLowerCase().includes('hybrid') 
          ? 'hybrid' 
          : 'onsite',
      otherBenefits: generateOtherBenefits(companySize, company),
    },
    
    startDate: formatDate(startDate),
    responseDeadline: formatDate(deadline),
    reportingTo,
    teamSize,
    
    offerDate: formatDate(today),
    offerLetterSignatory: signatory.name,
    offerLetterSignatoryTitle: signatory.title,
  };
  
  return offer;
}

function generateOtherBenefits(companySize: string, company: Company): string[] {
  const baseBenefits = [
    'Life and disability insurance',
    'Employee Assistance Program (EAP)',
  ];
  
  const midSizeBenefits = [
    ...baseBenefits,
    'Professional development budget ($2,000/year)',
    'Home office stipend ($500)',
    'Wellness program',
  ];
  
  const enterpriseBenefits = [
    ...midSizeBenefits,
    'Commuter benefits',
    'Tuition reimbursement',
    'Parental leave (16 weeks)',
    'Employee stock purchase plan',
  ];
  
  const startupBenefits = [
    ...baseBenefits,
    'Flexible work hours',
    'Learning & development budget ($1,500/year)',
    'Team offsites and events',
    'Latest MacBook Pro',
  ];
  
  if (companySize === 'enterprise') return enterpriseBenefits;
  if (companySize === 'startup') return startupBenefits;
  return midSizeBenefits;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function calculateTotalCompensation(offer: OfferDetails): {
  base: number;
  bonus: number;
  equity: number;
  signing: number;
  total: number;
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
    total: base + bonus + equity,
    totalFirstYear: base + bonus + equity + signing,
  };
}
