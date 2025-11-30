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
}

const DEFAULT_STYLE: PersonaStyle = {
  bgColor: 'bg-blue-100',
  iconColor: 'text-blue-600',
  messageBg: 'bg-blue-50',
  name: 'Interviewer',
  displayRole: '',
};

const ROLE_STYLES: Record<string, Omit<PersonaStyle, 'name' | 'displayRole'>> = {
  tech_lead: {
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    messageBg: 'bg-purple-50',
  },
  peer_engineer: {
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600',
    messageBg: 'bg-teal-50',
  },
  product_partner: {
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    messageBg: 'bg-orange-50',
  },
  engineering_manager: {
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    messageBg: 'bg-indigo-50',
  },
};

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
  };

  return {
    ...roleStyle,
    name: persona.name,
    displayRole: persona.displayRole,
  };
}
