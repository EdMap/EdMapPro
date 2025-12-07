import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  GitMerge, 
  GitBranch, 
  GitCommit, 
  GitPullRequest,
  ArrowRight,
  Code,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketCompletionConfig } from "@shared/adapters/execution/types";

interface TicketCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TicketCompletionConfig;
  ticketKey: string;
  ticketTitle: string;
  branchName: string;
  commitCount: number;
  onBackToBoard: () => void;
  onReviewCode?: () => void;
}

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  return (
    <div 
      className={cn(
        "absolute w-2 h-2 rounded-full animate-bounce",
        color
      )}
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 30}%`,
        animationDelay: `${delay}ms`,
        animationDuration: '1.5s',
      }}
    />
  );
}

function Confetti() {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <ConfettiParticle 
          key={i} 
          delay={i * 100} 
          color={colors[i % colors.length]} 
        />
      ))}
    </div>
  );
}

export function TicketCompletionModal({
  isOpen,
  onClose,
  config,
  ticketKey,
  ticketTitle,
  branchName,
  commitCount,
  onBackToBoard,
  onReviewCode,
}: TicketCompletionModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && config.celebrationStyle === 'confetti') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, config.celebrationStyle]);

  const handlePrimaryAction = () => {
    if (config.nextActionOptions.primary === 'back-to-board') {
      onBackToBoard();
    }
    onClose();
  };

  const handleSecondaryAction = () => {
    if (config.nextActionOptions.secondary === 'review-code' && onReviewCode) {
      onReviewCode();
    }
    onClose();
  };

  const getPrimaryButtonText = () => {
    switch (config.nextActionOptions.primary) {
      case 'back-to-board': return 'Back to Sprint Board';
      case 'next-ticket': return 'Start Next Ticket';
      case 'start-retro': return 'Start Sprint Retro';
      default: return 'Continue';
    }
  };

  const getSecondaryButtonText = () => {
    switch (config.nextActionOptions.secondary) {
      case 'review-code': return 'Review Code';
      case 'view-diff': return 'View Diff';
      case 'skip': return 'Skip';
      default: return null;
    }
  };

  if (config.celebrationStyle === 'minimal') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md" aria-describedby="completion-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {config.celebrationMessages.title}
            </DialogTitle>
            <DialogDescription id="completion-description">
              {config.celebrationMessages.subtitle}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handlePrimaryAction} data-testid="button-complete-primary">
              {getPrimaryButtonText()}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden" aria-describedby="completion-description">
        {showConfetti && <Confetti />}
        
        <DialogHeader className="text-center relative z-10">
          <div className="mx-auto mb-4 p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit">
            {config.celebrationStyle === 'confetti' ? (
              <PartyPopper className="h-10 w-10 text-green-600 dark:text-green-400" />
            ) : (
              <GitMerge className="h-10 w-10 text-green-600 dark:text-green-400" />
            )}
          </div>
          <DialogTitle className="text-2xl">
            {config.celebrationMessages.title}
          </DialogTitle>
          <DialogDescription id="completion-description" className="text-base mt-2">
            {config.celebrationMessages.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                {ticketKey}
              </Badge>
              <span className="text-sm font-medium truncate">{ticketTitle}</span>
            </div>

            {config.showProgressRecap && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">What you accomplished:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <GitBranch className="h-4 w-4" />
                    <span>Created branch</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Code className="h-4 w-4" />
                    <span>Wrote code</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <GitCommit className="h-4 w-4" />
                    <span>{commitCount} commit{commitCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <GitPullRequest className="h-4 w-4" />
                    <span>PR reviewed & merged</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {config.showLearningHighlights && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {config.celebrationMessages.encouragement}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 relative z-10">
          {config.nextActionOptions.secondary && getSecondaryButtonText() && (
            <Button 
              variant="outline" 
              onClick={handleSecondaryAction}
              data-testid="button-complete-secondary"
            >
              {getSecondaryButtonText()}
            </Button>
          )}
          <Button 
            onClick={handlePrimaryAction}
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-complete-primary"
          >
            {getPrimaryButtonText()}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
