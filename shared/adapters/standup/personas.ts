/**
 * Team Personas for Daily Standup
 */

import type { StandupPersona } from './types';

export const STANDUP_PERSONAS: Record<string, StandupPersona> = {
  sarah: {
    id: 'sarah',
    name: 'Sarah',
    role: 'Tech Lead',
    initials: 'ST',
    color: 'bg-purple-500',
    avatarSeed: 'sarah-tech-lead',
  },
  marcus: {
    id: 'marcus',
    name: 'Marcus',
    role: 'Senior Developer',
    initials: 'MC',
    color: 'bg-amber-500',
    avatarSeed: 'marcus-senior-dev',
  },
  priya: {
    id: 'priya',
    name: 'Priya',
    role: 'Product Manager',
    initials: 'PK',
    color: 'bg-indigo-500',
    avatarSeed: 'priya-product-mgr',
  },
  alex: {
    id: 'alex',
    name: 'Alex',
    role: 'QA Engineer',
    initials: 'AW',
    color: 'bg-teal-500',
    avatarSeed: 'alex-qa-engineer',
  },
};

export function getPersonaById(id: string): StandupPersona {
  return STANDUP_PERSONAS[id] || STANDUP_PERSONAS.sarah;
}

export function getRespondingPersonas(facilitatorId: string): StandupPersona[] {
  return Object.values(STANDUP_PERSONAS).filter(p => p.id !== facilitatorId);
}
