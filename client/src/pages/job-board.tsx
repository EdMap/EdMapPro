import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search, MapPin, DollarSign, Briefcase, Building2, Users, Clock, 
  ChevronRight, Sparkles, BookOpen, Filter, X, CheckCircle, ArrowRight,
  Target, Lightbulb, GraduationCap
} from "lucide-react";

interface Company {
  id: number;
  name: string;
  logo: string | null;
  industry: string;
  size: string;
  description: string;
  culture: string;
  values: string[];
  benefits: string[];
  interviewStyle: string;
}

interface JobPosting {
  id: number;
  companyId: number;
  title: string;
  role: string;
  seniority: string;
  department: string;
  location: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  highlightedTerms: string[];
  interviewStages: number;
  isActive: boolean;
  postedAt: string;
  company: Company;
}

interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
  category: string | null;
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return "Competitive";
  const formatNum = (n: number) => {
    if (n >= 1000) return `$${Math.round(n / 1000)}k`;
    return `$${n}`;
  };
  if (min && max) return `${formatNum(min)} - ${formatNum(max)}`;
  if (min) return `From ${formatNum(min)}`;
  return `Up to ${formatNum(max!)}`;
}

function getSeniorityColor(seniority: string): string {
  switch (seniority) {
    case "junior": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "mid": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "senior": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
    case "lead": return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

function getCompanySizeLabel(size: string): string {
  switch (size) {
    case "startup": return "1-50 employees";
    case "mid-size": return "50-500 employees";
    case "enterprise": return "500+ employees";
    default: return size;
  }
}

function HighlightedText({ 
  text, 
  terms, 
  glossary,
  onTermClick 
}: { 
  text: string; 
  terms: string[]; 
  glossary: GlossaryTerm[];
  onTermClick: (term: GlossaryTerm) => void;
}) {
  if (!terms.length) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => {
        const matchedTerm = terms.find(t => t.toLowerCase() === part.toLowerCase());
        if (matchedTerm) {
          const glossaryEntry = glossary.find(g => g.term.toLowerCase() === matchedTerm.toLowerCase());
          if (glossaryEntry) {
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onTermClick(glossaryEntry)}
                    className="text-primary font-medium underline decoration-dotted underline-offset-4 hover:decoration-solid cursor-pointer"
                    data-testid={`term-${matchedTerm.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {part}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{glossaryEntry.definition}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          return (
            <span key={i} className="text-primary font-medium">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function JobCard({ 
  job, 
  glossary,
  onSelect,
  onTermClick,
  isSelected 
}: { 
  job: JobPosting; 
  glossary: GlossaryTerm[];
  onSelect: () => void;
  onTermClick: (term: GlossaryTerm) => void;
  isSelected: boolean;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary shadow-md' : ''
      }`}
      onClick={onSelect}
      data-testid={`job-card-${job.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-2xl shrink-0">
            {job.company.logo || '🏢'}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {job.company.name}
                </p>
              </div>
              <Badge className={`shrink-0 ${getSeniorityColor(job.seniority)}`}>
                {job.seniority}
              </Badge>
            </div>
            
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {formatSalary(job.salaryMin, job.salaryMax)}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {job.interviewStages} stages
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              <HighlightedText 
                text={job.description} 
                terms={job.highlightedTerms}
                glossary={glossary}
                onTermClick={onTermClick}
              />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function JobDetails({ 
  job, 
  glossary,
  onApply,
  onTermClick,
  isApplying
}: { 
  job: JobPosting; 
  glossary: GlossaryTerm[];
  onApply: () => void;
  onTermClick: (term: GlossaryTerm) => void;
  isApplying: boolean;
}) {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-start gap-4 mb-6">
        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-3xl shrink-0">
          {job.company.logo || '🏢'}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {job.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {job.company.name}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={getSeniorityColor(job.seniority)}>
              {job.seniority}
            </Badge>
            <span className="text-sm text-gray-500">
              {job.department}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{job.location}</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{formatSalary(job.salaryMin, job.salaryMax)}</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{getCompanySizeLabel(job.company.size)}</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{job.employmentType}</span>
        </div>
      </div>

      <Button 
        className="w-full mb-6" 
        size="lg"
        onClick={onApply}
        disabled={isApplying}
        data-testid="button-apply"
      >
        {isApplying ? "Applying..." : "Apply Now"} 
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <div className="space-y-6">
        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            About the Role
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <HighlightedText 
              text={job.description} 
              terms={job.highlightedTerms}
              glossary={glossary}
              onTermClick={onTermClick}
            />
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Responsibilities
          </h3>
          <ul className="space-y-2">
            {job.responsibilities.map((resp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <HighlightedText 
                  text={resp} 
                  terms={job.highlightedTerms}
                  glossary={glossary}
                  onTermClick={onTermClick}
                />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Requirements
          </h3>
          <ul className="space-y-2">
            {job.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <HighlightedText 
                  text={req} 
                  terms={job.highlightedTerms}
                  glossary={glossary}
                  onTermClick={onTermClick}
                />
              </li>
            ))}
          </ul>
        </section>

        {job.niceToHave && job.niceToHave.length > 0 && (
          <section>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Nice to Have
            </h3>
            <ul className="space-y-2">
              {job.niceToHave.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Sparkles className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <HighlightedText 
                    text={item} 
                    terms={job.highlightedTerms}
                    glossary={glossary}
                    onTermClick={onTermClick}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            About {job.company.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {job.company.description}
          </p>
          
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Culture</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {job.company.culture}
              </p>
            </div>
            
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Values</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {job.company.values.map((value, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Benefits</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {job.company.benefits.map((benefit, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Interview Process
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This role has <span className="font-semibold text-primary">{job.interviewStages} interview stages</span>. 
            {job.company.interviewStyle === 'rigorous' && " Expect a thorough evaluation process focused on technical depth."}
            {job.company.interviewStyle === 'balanced' && " The process balances technical assessment with cultural fit."}
            {job.company.interviewStyle === 'casual' && " The interview focuses on conversation and practical problem-solving."}
          </p>
        </section>
      </div>
    </div>
  );
}

function TermDefinitionModal({ 
  term, 
  onClose 
}: { 
  term: GlossaryTerm | null; 
  onClose: () => void;
}) {
  if (!term) return null;
  
  return (
    <Dialog open={!!term} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {term.term}
          </DialogTitle>
          {term.category && (
            <Badge variant="outline" className="w-fit">
              {term.category}
            </Badge>
          )}
        </DialogHeader>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          {term.definition}
        </p>
        <DialogFooter>
          <Button onClick={onClose} data-testid="button-close-term">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function JobBoard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const { data: jobs, isLoading: jobsLoading } = useQuery<JobPosting[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: glossary = [] } = useQuery<GlossaryTerm[]>({
    queryKey: ['/api/glossary'],
  });

  const { data: user } = useQuery<{ id: number }>({
    queryKey: ['/api/user'],
  });

  const applyMutation = useMutation({
    mutationFn: async (data: { userId: number; jobPostingId: number; coverLetter?: string }) => {
      const response = await apiRequest('POST', '/api/applications', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Application submitted!",
        description: "Your application has been received. Check your journey to track progress.",
      });
      setShowApplyDialog(false);
      setCoverLetter("");
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/applications`] });
      }
      navigate(`/journey`);
    },
    onError: () => {
      toast({
        title: "Application failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    
    return jobs.filter(job => {
      const matchesSearch = searchQuery === "" || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = !roleFilter || job.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [jobs, searchQuery, roleFilter]);

  const roles = useMemo(() => {
    if (!jobs) return [];
    return Array.from(new Set(jobs.map(j => j.role)));
  }, [jobs]);

  const handleApply = () => {
    if (!user || !selectedJob) return;
    
    applyMutation.mutate({
      userId: user.id,
      jobPostingId: selectedJob.id,
      coverLetter: coverLetter || undefined,
    });
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Board</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Discover opportunities and start your journey. Click highlighted terms to learn more.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search jobs, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <div className="flex gap-2">
            <Button
              variant={roleFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(null)}
              data-testid="filter-all"
            >
              All
            </Button>
            {roles.map(role => (
              <Button
                key={role}
                variant={roleFilter === role ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter(role)}
                data-testid={`filter-${role}`}
              >
                {role.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-220px)]">
        <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {jobsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">No jobs found</h3>
                <p className="text-sm text-gray-500">
                  {searchQuery || roleFilter 
                    ? "Try adjusting your search or filters" 
                    : "Check back soon for new opportunities"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                glossary={glossary}
                onSelect={() => setSelectedJob(job)}
                onTermClick={setSelectedTerm}
                isSelected={selectedJob?.id === job.id}
              />
            ))
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border shadow-sm overflow-hidden" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {selectedJob ? (
            <JobDetails
              job={selectedJob}
              glossary={glossary}
              onApply={() => setShowApplyDialog(true)}
              onTermClick={setSelectedTerm}
              isApplying={applyMutation.isPending}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Briefcase className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Select a job to view details
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Click on any job posting to see the full description, requirements, and company information.
              </p>
            </div>
          )}
        </div>
      </div>

      <TermDefinitionModal 
        term={selectedTerm} 
        onClose={() => setSelectedTerm(null)} 
      />

      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply to {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              at {selectedJob?.company.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                Cover Letter (optional)
              </label>
              <Textarea
                placeholder="Tell them why you're interested in this role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                data-testid="input-cover-letter"
              />
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                What happens next?
              </h4>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-xs shrink-0">1</span>
                  Your application will be submitted
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 text-white text-xs shrink-0">2</span>
                  Track your progress in the Journey dashboard
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 text-white text-xs shrink-0">3</span>
                  Complete {selectedJob?.interviewStages} interview stages
                </li>
              </ol>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)} data-testid="button-cancel-apply">
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={applyMutation.isPending} data-testid="button-submit-application">
              {applyMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
