import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  getPersonaStyle, 
  getAllPersonaStyles, 
  type TeamPersona, 
  type PersonaStyle 
} from "@/lib/persona-styles";
import { Clock, Users, MessageCircle, Briefcase } from "lucide-react";

interface InterviewPanelHeaderProps {
  jobTitle?: string;
  companyName?: string;
  difficulty: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  elapsedMinutes: number;
  isTeamInterview: boolean;
  teamPersonas: TeamPersona[];
  activePersonaId: string | null;
}

export function InterviewPanelHeader({
  jobTitle,
  companyName,
  difficulty,
  currentQuestionIndex,
  totalQuestions,
  elapsedMinutes,
  isTeamInterview,
  teamPersonas,
  activePersonaId,
}: InterviewPanelHeaderProps) {
  const personaStyles = getAllPersonaStyles(teamPersonas);
  
  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'intern': return 'bg-green-100 text-green-700 border-green-200';
      case 'junior': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'mid': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'senior': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'lead': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {companyName && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {companyName}
              </span>
            </div>
          )}
          {jobTitle && (
            <>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {jobTitle}
              </span>
            </>
          )}
          <Badge 
            variant="outline" 
            className={cn("text-xs capitalize shrink-0", getLevelBadgeColor(difficulty))}
          >
            {difficulty} level
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">{currentQuestionIndex + 1}</span>
            <span className="text-gray-400">/</span>
            <span>{totalQuestions}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{elapsedMinutes}m</span>
          </div>
        </div>
      </div>

      {isTeamInterview && teamPersonas.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Interview Panel
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {personaStyles.map((style) => {
              const isActive = style.id === activePersonaId;
              return (
                <div
                  key={style.id}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200",
                    isActive 
                      ? `${style.bgColor} ${style.borderColor} border-2 shadow-sm` 
                      : "bg-gray-50 dark:bg-gray-800 border border-transparent hover:bg-gray-100"
                  )}
                  data-testid={`persona-chip-${style.id}`}
                >
                  {isActive && (
                    <span className={cn(
                      "absolute -top-1 -right-1 h-3 w-3 rounded-full animate-pulse",
                      style.accentColor
                    )} />
                  )}
                  <Avatar className={cn("h-6 w-6", style.bgColor)}>
                    <AvatarFallback className={cn("text-xs font-semibold", style.textColor)}>
                      {style.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "text-sm font-medium",
                    isActive ? style.textColor : "text-gray-600 dark:text-gray-400"
                  )}>
                    {style.name}
                  </span>
                  {isActive && (
                    <span className="text-xs text-gray-500">
                      (speaking)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface PersonaRosterProps {
  teamPersonas: TeamPersona[];
  activePersonaId: string | null;
  isTyping?: boolean;
  className?: string;
}

export function PersonaRoster({
  teamPersonas,
  activePersonaId,
  isTyping = false,
  className,
}: PersonaRosterProps) {
  const personaStyles = getAllPersonaStyles(teamPersonas);

  if (teamPersonas.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 w-56 shrink-0",
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Interview Panel
        </h3>
      </div>
      
      <div className="space-y-2">
        {personaStyles.map((style) => {
          const isActive = style.id === activePersonaId;
          const isSpeaking = isActive && isTyping;
          
          return (
            <div
              key={style.id}
              className={cn(
                "relative p-3 rounded-lg transition-all duration-200",
                isActive 
                  ? `${style.messageBg} ${style.borderColor} border-2` 
                  : "bg-gray-50 dark:bg-gray-800 border border-transparent"
              )}
              data-testid={`roster-persona-${style.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className={cn("h-10 w-10", style.bgColor)}>
                    <AvatarFallback className={cn("font-semibold", style.textColor)}>
                      {style.initials}
                    </AvatarFallback>
                  </Avatar>
                  {isActive && (
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                      isSpeaking ? "animate-pulse" : "",
                      style.accentColor
                    )} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isActive ? style.textColor : "text-gray-700 dark:text-gray-300"
                  )}>
                    {style.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {style.displayRole}
                  </p>
                </div>
              </div>
              
              {isSpeaking && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>typing...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HandoffBannerProps {
  fromPersona: PersonaStyle;
  toPersona: PersonaStyle;
}

export function HandoffBanner({ fromPersona, toPersona }: HandoffBannerProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg my-3">
      <div className="flex items-center gap-1.5">
        <Avatar className={cn("h-5 w-5", fromPersona.bgColor)}>
          <AvatarFallback className={cn("text-[10px] font-semibold", fromPersona.textColor)}>
            {fromPersona.initials}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-gray-500">{fromPersona.name}</span>
      </div>
      <span className="text-gray-400">→</span>
      <div className="flex items-center gap-1.5">
        <Avatar className={cn("h-5 w-5", toPersona.bgColor)}>
          <AvatarFallback className={cn("text-[10px] font-semibold", toPersona.textColor)}>
            {toPersona.initials}
          </AvatarFallback>
        </Avatar>
        <span className={cn("text-xs font-medium", toPersona.textColor)}>{toPersona.name}</span>
      </div>
      <span className="text-xs text-gray-500 ml-1">is taking over</span>
    </div>
  );
}

interface PersonaTypingIndicatorProps {
  persona: PersonaStyle;
  message?: string;
}

export function PersonaTypingIndicator({ persona, message = "is typing" }: PersonaTypingIndicatorProps) {
  return (
    <div className="flex items-start space-x-3">
      <Avatar className={cn("h-10 w-10", persona.bgColor)}>
        <AvatarFallback className={cn("font-semibold", persona.textColor)}>
          {persona.initials}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        "rounded-lg p-4 border-l-4",
        persona.messageBg,
        persona.borderColor.replace('border-', 'border-l-')
      )}>
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("text-sm font-semibold", persona.textColor)}>
            {persona.name}
          </span>
          {persona.displayRole && (
            <span className="text-xs text-gray-500">
              ({persona.displayRole})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className={cn("w-2 h-2 rounded-full animate-bounce", persona.accentColor)} style={{ animationDelay: '0ms' }} />
            <span className={cn("w-2 h-2 rounded-full animate-bounce", persona.accentColor)} style={{ animationDelay: '150ms' }} />
            <span className={cn("w-2 h-2 rounded-full animate-bounce", persona.accentColor)} style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-500">{message}...</span>
        </div>
      </div>
    </div>
  );
}

interface EnhancedMessageBubbleProps {
  role: 'interviewer' | 'candidate';
  content: string;
  personaStyle?: PersonaStyle | null;
  isTeamInterview: boolean;
  evaluation?: any;
  showPersonaHeader?: boolean;
}

export function EnhancedMessageBubble({
  role,
  content,
  personaStyle,
  isTeamInterview,
  evaluation,
  showPersonaHeader = true,
}: EnhancedMessageBubbleProps) {
  const isInterviewer = role === 'interviewer';
  
  if (!isInterviewer) {
    return (
      <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
        <Avatar className="h-10 w-10 bg-green-100">
          <AvatarFallback className="text-green-600 font-semibold">You</AvatarFallback>
        </Avatar>
        <div className="max-w-[70%]">
          <div className="bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-gray-100 rounded-lg p-4">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
          {evaluation && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={evaluation.score >= 7 ? "default" : evaluation.score >= 5 ? "secondary" : "destructive"}>
                  Score: {evaluation.score}/10
                </Badge>
              </div>
              {evaluation.feedback && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{evaluation.feedback}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const style = personaStyle || {
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    messageBg: 'bg-blue-50',
    borderColor: 'border-blue-300',
    accentColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    name: 'Interviewer',
    displayRole: '',
    initials: 'AI',
    ringColor: 'ring-blue-400',
  };

  return (
    <div className="flex items-start space-x-3">
      <Avatar className={cn("h-10 w-10", style.bgColor)}>
        <AvatarFallback className={cn("font-semibold", style.textColor)}>
          {isTeamInterview && personaStyle ? style.initials : 'AI'}
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[70%]">
        <div className={cn(
          "rounded-lg p-4 text-gray-900 dark:text-gray-100",
          isTeamInterview ? `border-l-4 ${style.borderColor.replace('border-', 'border-l-')}` : "",
          style.messageBg
        )}>
          {isTeamInterview && showPersonaHeader && personaStyle && personaStyle.name !== 'Interviewer' && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200/50">
              <span className={cn("text-sm font-semibold", style.textColor)}>
                {style.name}
              </span>
              {style.displayRole && (
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", style.borderColor)}>
                  {style.displayRole}
                </Badge>
              )}
            </div>
          )}
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  );
}
