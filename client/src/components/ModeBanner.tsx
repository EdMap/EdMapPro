import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ModeType = "journey" | "practice";

interface ModeBannerProps {
  mode: ModeType;
  context?: {
    companyName?: string;
    jobTitle?: string;
    stageName?: string;
  };
  variant?: "banner" | "badge" | "inline";
  className?: string;
}

const modeConfig = {
  journey: {
    label: "Journey Mode",
    shortLabel: "Journey",
    description: "This affects your job application progress",
    icon: Briefcase,
    colors: {
      badge: "border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
      banner: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
  },
  practice: {
    label: "Practice Mode",
    shortLabel: "Practice",
    description: "Safe sandbox for building skills — no real stakes",
    icon: GraduationCap,
    colors: {
      badge: "border-purple-400 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
      banner: "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  },
};

export function ModeBanner({ mode, context, variant = "badge", className }: ModeBannerProps) {
  const config = modeConfig[mode];
  const Icon = config.icon;

  // Simple badge variant
  if (variant === "badge") {
    return (
      <Badge 
        variant="outline" 
        className={cn(config.colors.badge, className)}
        data-testid={`badge-${mode}-mode`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  }

  // Inline variant (for headers)
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)} data-testid={`inline-${mode}-mode`}>
        <Badge variant="outline" className={config.colors.badge}>
          <Icon className="h-3 w-3 mr-1" />
          {config.shortLabel}
        </Badge>
        {context?.companyName && (
          <>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {context.companyName}
              {context.jobTitle && ` • ${context.jobTitle}`}
            </span>
          </>
        )}
      </div>
    );
  }

  // Full banner variant
  return (
    <div 
      className={cn(
        "rounded-lg border p-4 mb-6",
        config.colors.banner,
        className
      )}
      data-testid={`banner-${mode}-mode`}
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-2 rounded-lg shrink-0", config.colors.iconBg)}>
          <Icon className={cn("h-5 w-5", config.colors.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn("font-semibold", config.colors.iconColor)}>
              {config.label}
            </h4>
            {context?.stageName && (
              <Badge variant="secondary" className="text-xs">
                {context.stageName}
              </Badge>
            )}
          </div>
          {context?.companyName ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {context.companyName}
              {context.jobTitle && ` — ${context.jobTitle}`}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {config.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModeIndicator({ mode, className }: { mode: ModeType; className?: string }) {
  return <ModeBanner mode={mode} variant="badge" className={className} />;
}
