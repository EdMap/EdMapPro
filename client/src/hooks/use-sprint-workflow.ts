import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type {
  Sprint,
  SprintTicket,
  CeremonyInstance,
  GitSession,
  GitEvent,
  SprintActivity,
  UserJourney,
  JourneyArc,
} from "@shared/schema";

export type TicketStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type CeremonyType = 'standup' | 'planning' | 'review' | 'retro' | 'one_on_one';
export type MasteryBand = 'explorer' | 'contributor' | 'junior_ready';

export interface TicketStats {
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
}

export interface SprintOverview {
  sprint: Sprint;
  tickets: SprintTicket[];
  ceremonies: CeremonyInstance[];
  currentDay: number;
  ticketStats: TicketStats;
  upcomingCeremonies: CeremonyInstance[];
  todayActivities: SprintActivity[];
}

export interface JourneyDashboard {
  journey: UserJourney;
  currentArc: JourneyArc | null;
  currentSprint: SprintOverview | null;
  readinessScore: number;
  competencyScores: Record<string, { score: number; band: MasteryBand }>;
  timeline: {
    arcs: (JourneyArc & { sprints: Sprint[] })[];
    currentPosition: { arcIndex: number; sprintIndex: number };
  };
  canGraduate: boolean;
  estimatedSprintsRemaining: number;
}

export interface GitSessionWithEvents {
  session: GitSession;
  events: GitEvent[];
}

export interface TicketGitState {
  branchCreated?: boolean;
  branchName?: string;
  hasPR?: boolean;
  prTitle?: string;
  prDescription?: string;
  prCreatedAt?: string;
  merged?: boolean;
  mergedAt?: string;
}

export function useJourneyDashboard(journeyId: number | null) {
  return useQuery<JourneyDashboard>({
    queryKey: ['/api/journeys', journeyId, 'dashboard'],
    enabled: !!journeyId,
    queryFn: async () => {
      const response = await fetch(`/api/journeys/${journeyId}/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch journey dashboard');
      return response.json();
    },
    refetchInterval: 30000,
  });
}

export function useJourneySprints(journeyId: number | null) {
  return useQuery<Sprint[]>({
    queryKey: ['/api/journeys', journeyId, 'sprints'],
    enabled: !!journeyId,
    queryFn: async () => {
      const response = await fetch(`/api/journeys/${journeyId}/sprints`);
      if (!response.ok) throw new Error('Failed to fetch sprints');
      return response.json();
    }
  });
}

export function useSprintOverview(sprintId: number | null) {
  return useQuery<SprintOverview>({
    queryKey: ['/api/sprints', sprintId],
    enabled: !!sprintId,
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}`);
      if (!response.ok) throw new Error('Failed to fetch sprint overview');
      return response.json();
    },
    refetchInterval: 10000,
  });
}

export function useUpdateSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sprintId, updates }: { sprintId: number; updates: Partial<Sprint> }) => {
      const response = await apiRequest('PATCH', `/api/sprints/${sprintId}`, updates);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId] });
    }
  });
}

export function useSprintTickets(sprintId: number | null) {
  return useQuery<SprintTicket[]>({
    queryKey: ['/api/sprints', sprintId, 'tickets'],
    enabled: !!sprintId,
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/tickets`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    }
  });
}

export function useTicket(ticketId: number | null) {
  return useQuery<SprintTicket>({
    queryKey: ['/api/tickets', ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (!response.ok) throw new Error('Failed to fetch ticket');
      return response.json();
    }
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sprintId, ticket }: { sprintId: number; ticket: Partial<SprintTicket> }) => {
      const response = await apiRequest('POST', `/api/sprints/${sprintId}/tickets`, ticket);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId, 'tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId] });
    }
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, updates, sprintId }: { ticketId: number; updates: Partial<SprintTicket>; sprintId?: number }) => {
      const response = await apiRequest('PATCH', `/api/tickets/${ticketId}`, updates);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId] });
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId, 'tickets'] });
        queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId] });
      }
    }
  });
}

export interface MoveTicketError {
  message: string;
  gate: 'branch_required' | 'pr_required' | 'merge_required';
}

export function useMoveTicket() {
  const queryClient = useQueryClient();
  
  return useMutation<SprintTicket, MoveTicketError, { ticketId: number; newStatus: TicketStatus; sprintId?: number }>({
    mutationFn: async ({ ticketId, newStatus }) => {
      const response = await apiRequest('PATCH', `/api/tickets/${ticketId}/move`, { newStatus });
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId] });
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId, 'tickets'] });
        queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId] });
      }
    }
  });
}

export function useCeremonies(sprintId: number | null) {
  return useQuery<CeremonyInstance[]>({
    queryKey: ['/api/sprints', sprintId, 'ceremonies'],
    enabled: !!sprintId,
    queryFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/ceremonies`);
      if (!response.ok) throw new Error('Failed to fetch ceremonies');
      return response.json();
    }
  });
}

export function useCeremony(ceremonyId: number | null) {
  return useQuery<CeremonyInstance>({
    queryKey: ['/api/ceremonies', ceremonyId],
    enabled: !!ceremonyId,
    queryFn: async () => {
      const response = await fetch(`/api/ceremonies/${ceremonyId}`);
      if (!response.ok) throw new Error('Failed to fetch ceremony');
      return response.json();
    },
    refetchInterval: 5000,
  });
}

export function useCreateCeremony() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sprintId, ceremony }: { sprintId: number; ceremony: Partial<CeremonyInstance> }) => {
      const response = await apiRequest('POST', `/api/sprints/${sprintId}/ceremonies`, ceremony);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId, 'ceremonies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId] });
    }
  });
}

export function useUpdateCeremony() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ceremonyId, updates, sprintId }: { ceremonyId: number; updates: Partial<CeremonyInstance>; sprintId?: number }) => {
      const response = await apiRequest('PATCH', `/api/ceremonies/${ceremonyId}`, updates);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ceremonies', variables.ceremonyId] });
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId, 'ceremonies'] });
      }
    }
  });
}

export interface CeremonyMessage {
  id: string;
  role: 'user' | 'team';
  sender?: string;
  senderRole?: string;
  content: string;
  timestamp: string;
}

export function useAddCeremonyMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ceremonyId, message, type }: { ceremonyId: number; message: CeremonyMessage; type: 'team' | 'user' }) => {
      const response = await apiRequest('POST', `/api/ceremonies/${ceremonyId}/messages`, { message, type });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ceremonies', variables.ceremonyId] });
    }
  });
}

export function useGitSession(ticketId: number | null) {
  return useQuery<GitSessionWithEvents>({
    queryKey: ['/api/tickets', ticketId, 'git'],
    enabled: !!ticketId,
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}/git`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch git session');
      }
      return response.json();
    }
  });
}

export function useCreateGitSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, repoUrl }: { ticketId: number; repoUrl?: string }) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/git`, { repoUrl });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId, 'git'] });
    }
  });
}

export interface GitCommandResult {
  event: GitEvent;
  session: GitSession;
}

export function useExecuteGitCommand() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, command, args, ticketId }: { sessionId: number; command: string; args?: string[]; ticketId: number }) => {
      const response = await apiRequest('POST', `/api/git/${sessionId}/command`, { command, args });
      return response.json() as Promise<GitCommandResult>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId, 'git'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId] });
    }
  });
}

export function useCreatePR() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, title, description, sprintId }: { ticketId: number; title: string; description: string; sprintId?: number }) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/pr`, { title, description });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId, 'git'] });
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId, 'tickets'] });
      }
    }
  });
}

export function useMergePR() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, sprintId }: { ticketId: number; sprintId?: number }) => {
      const response = await apiRequest('POST', `/api/tickets/${ticketId}/merge`, {});
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId, 'git'] });
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId, 'tickets'] });
        queryClient.invalidateQueries({ queryKey: ['/api/sprints', variables.sprintId] });
      }
    }
  });
}

export function useKanbanState(sprintId: number | null) {
  const ticketsQuery = useSprintTickets(sprintId);
  
  const ticketsByStatus = {
    todo: [] as SprintTicket[],
    in_progress: [] as SprintTicket[],
    in_review: [] as SprintTicket[],
    done: [] as SprintTicket[],
  };
  
  if (ticketsQuery.data) {
    for (const ticket of ticketsQuery.data) {
      const status = ticket.status as TicketStatus;
      if (ticketsByStatus[status]) {
        ticketsByStatus[status].push(ticket);
      }
    }
  }
  
  return {
    ...ticketsQuery,
    ticketsByStatus,
  };
}

export function useSprintProgress(sprintId: number | null) {
  const sprintQuery = useSprintOverview(sprintId);
  
  const progress = {
    totalTickets: 0,
    completedTickets: 0,
    totalStoryPoints: 0,
    completedStoryPoints: 0,
    percentComplete: 0,
  };
  
  if (sprintQuery.data) {
    const { tickets, sprint } = sprintQuery.data;
    progress.totalTickets = tickets.length;
    progress.completedTickets = tickets.filter(t => t.status === 'done').length;
    progress.totalStoryPoints = sprint.storyPointsTarget;
    progress.completedStoryPoints = tickets
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    progress.percentComplete = progress.totalStoryPoints > 0
      ? Math.round((progress.completedStoryPoints / progress.totalStoryPoints) * 100)
      : 0;
  }
  
  return {
    ...sprintQuery,
    progress,
  };
}

export function useTodayCeremonies(sprintId: number | null, currentDay: number) {
  const ceremoniesQuery = useCeremonies(sprintId);
  
  const todayCeremonies = ceremoniesQuery.data?.filter(
    c => c.dayNumber === currentDay
  ) || [];
  
  const pendingCeremonies = todayCeremonies.filter(c => c.status === 'pending');
  const completedCeremonies = todayCeremonies.filter(c => c.status === 'completed');
  
  return {
    ...ceremoniesQuery,
    todayCeremonies,
    pendingCeremonies,
    completedCeremonies,
  };
}
