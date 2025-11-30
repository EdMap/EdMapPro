export interface TeamPersona {
  id: string;
  name: string;
  role: string;
  displayRole: string;
}

export interface PersonaStyle {
  bgColor: string;
  iconColor: string;
  messageBg: string;
  name: string;
  displayRole: string;
  borderColor: string;
  accentColor: string;
  ringColor: string;
  textColor: string;
  initials: string;
}

const DEFAULT_STYLE: PersonaStyle = {
  bgColor: 'bg-blue-100',
  iconColor: 'text-blue-600',
  messageBg: 'bg-blue-50',
  name: 'Interviewer',
  displayRole: '',
  borderColor: 'border-blue-300',
  accentColor: 'bg-blue-500',
  ringColor: 'ring-blue-400',
  textColor: 'text-blue-700',
  initials: 'AI',
};

interface RoleStyleConfig {
  bgColor: string;
  iconColor: string;
  messageBg: string;
  borderColor: string;
  accentColor: string;
  ringColor: string;
  textColor: string;
}

const ROLE_STYLES: Record<string, RoleStyleConfig> = {
  tech_lead: {
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    messageBg: 'bg-purple-50',
    borderColor: 'border-purple-300',
    accentColor: 'bg-purple-500',
    ringColor: 'ring-purple-400',
    textColor: 'text-purple-700',
  },
  peer_engineer: {
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600',
    messageBg: 'bg-teal-50',
    borderColor: 'border-teal-300',
    accentColor: 'bg-teal-500',
    ringColor: 'ring-teal-400',
    textColor: 'text-teal-700',
  },
  product_partner: {
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    messageBg: 'bg-orange-50',
    borderColor: 'border-orange-300',
    accentColor: 'bg-orange-500',
    ringColor: 'ring-orange-400',
    textColor: 'text-orange-700',
  },
  engineering_manager: {
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    messageBg: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    accentColor: 'bg-indigo-500',
    ringColor: 'ring-indigo-400',
    textColor: 'text-indigo-700',
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getPersonaStyle(
  personaId: string | undefined | null,
  isTeamInterview: boolean,
  teamPersonas: TeamPersona[]
): PersonaStyle {
  if (!personaId || !isTeamInterview || teamPersonas.length === 0) {
    return DEFAULT_STYLE;
  }

  const persona = teamPersonas.find(p => p.id === personaId);
  if (!persona) {
    return DEFAULT_STYLE;
  }

  const roleStyle = ROLE_STYLES[persona.role] || {
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    messageBg: 'bg-blue-50',
    borderColor: 'border-blue-300',
    accentColor: 'bg-blue-500',
    ringColor: 'ring-blue-400',
    textColor: 'text-blue-700',
  };

  return {
    ...roleStyle,
    name: persona.name,
    displayRole: persona.displayRole,
    initials: getInitials(persona.name),
  };
}

export function getPersonaById(personaId: string, teamPersonas: TeamPersona[]): TeamPersona | undefined {
  return teamPersonas.find(p => p.id === personaId);
}

export function getAllPersonaStyles(teamPersonas: TeamPersona[]): Array<PersonaStyle & { id: string }> {
  return teamPersonas.map(persona => ({
    id: persona.id,
    ...getPersonaStyle(persona.id, true, teamPersonas),
  }));
}
