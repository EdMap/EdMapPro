import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type {
  ProgressionPath,
  ProjectTemplate,
  UserJourney,
  JourneyArc,
  Sprint,
  SprintActivity,
  CompetencySnapshot,
  JourneyState,
  ReadinessScore,
} from "@shared/schema";

export interface ExitEligibility {
  canExit: boolean;
  reasons: {
    minSprintsMet: boolean;
    readinessThresholdMet: boolean;
    maxSprintsReached: boolean;
    userCanChoose: boolean;
  };
  recommendation: 'continue' | 'ready' | 'suggest_exit';
  message: string;
}

export interface JourneyWithState {
  journey: UserJourney | null;
  state: JourneyState | null;
}

export interface SprintWithActivities {
  sprint: Sprint | null;
  activities: SprintActivity[];
}

export interface DeltaResult {
  competencySlug: string;
  previousBand: string;
  newBand: string;
  bandChanged: boolean;
  previousConfidence: number;
  newConfidence: number;
  evidenceCount: number;
}

export interface ActivityCompletionResult {
  activity: SprintActivity;
  deltas: DeltaResult[];
}

export interface SprintCompletionResult {
  arc: JourneyArc;
  sprint: Sprint;
  snapshot: CompetencySnapshot;
  exitEligibility: ExitEligibility;
  nextAction: 'start_new_sprint' | 'proceed_to_graduation' | 'continue_sprint';
}

export interface ProgressionSummary {
  journey: UserJourney;
  readiness: ReadinessScore;
  exitEligibility: ExitEligibility;
  snapshots: CompetencySnapshot[];
  arcs: JourneyArc[];
}

export function useProgressionPaths(filters?: { role?: string; entryLevel?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.role) queryParams.set('role', filters.role);
  if (filters?.entryLevel) queryParams.set('entryLevel', filters.entryLevel);
  const queryString = queryParams.toString();
  
  return useQuery<ProgressionPath[]>({
    queryKey: ['/api/progression-paths', filters?.role, filters?.entryLevel],
    queryFn: async () => {
      const url = queryString ? `/api/progression-paths?${queryString}` : '/api/progression-paths';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch progression paths');
      return response.json();
    }
  });
}

export function useProgressionPath(slug: string | null) {
  return useQuery<ProgressionPath>({
    queryKey: ['/api/progression-paths', slug],
    enabled: !!slug,
    queryFn: async () => {
      const response = await fetch(`/api/progression-paths/${slug}`);
      if (!response.ok) throw new Error('Failed to fetch progression path');
      return response.json();
    }
  });
}

export function useProjectTemplates(filters?: { language?: string; industry?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.language) queryParams.set('language', filters.language);
  if (filters?.industry) queryParams.set('industry', filters.industry);
  const queryString = queryParams.toString();
  
  return useQuery<ProjectTemplate[]>({
    queryKey: ['/api/project-templates', filters?.language, filters?.industry],
    queryFn: async () => {
      const url = queryString ? `/api/project-templates?${queryString}` : '/api/project-templates';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch project templates');
      return response.json();
    }
  });
}

export function useProjectTemplate(slug: string | null) {
  return useQuery<ProjectTemplate>({
    queryKey: ['/api/project-templates', slug],
    enabled: !!slug,
    queryFn: async () => {
      const response = await fetch(`/api/project-templates/${slug}`);
      if (!response.ok) throw new Error('Failed to fetch project template');
      return response.json();
    }
  });
}

export function useUserJourney(userId: number | null) {
  return useQuery<JourneyWithState>({
    queryKey: ['/api/user', userId, 'journey'],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}/journey`);
      if (!response.ok) throw new Error('Failed to fetch user journey');
      return response.json();
    }
  });
}

export function useUserJourneys(userId: number | null) {
  return useQuery<UserJourney[]>({
    queryKey: ['/api/user', userId, 'journeys'],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}/journeys`);
      if (!response.ok) throw new Error('Failed to fetch user journeys');
      return response.json();
    }
  });
}

export function useJourney(journeyId: number | null) {
  return useQuery<JourneyWithState>({
    queryKey: ['/api/journey', journeyId],
    enabled: !!journeyId,
    queryFn: async () => {
      const response = await fetch(`/api/journey/${journeyId}`);
      if (!response.ok) throw new Error('Failed to fetch journey');
      return response.json();
    }
  });
}

export function useJourneyArcs(journeyId: number | null) {
  return useQuery<JourneyArc[]>({
    queryKey: ['/api/journey', journeyId, 'arcs'],
    enabled: !!journeyId,
    queryFn: async () => {
      const response = await fetch(`/api/journey/${journeyId}/arcs`);
      if (!response.ok) throw new Error('Failed to fetch journey arcs');
      return response.json();
    }
  });
}

export function useCurrentSprint(journeyId: number | null) {
  return useQuery<SprintWithActivities>({
    queryKey: ['/api/journey', journeyId, 'current-sprint'],
    enabled: !!journeyId,
    queryFn: async () => {
      const response = await fetch(`/api/journey/${journeyId}/current-sprint`);
      if (!response.ok) throw new Error('Failed to fetch current sprint');
      return response.json();
    }
  });
}

export function useSprint(sprintId: number | null) {
  return useQuery<SprintWithActivities>({
    queryKey: ['/api/sprint', sprintId],
    enabled: !!sprintId,
    queryFn: async () => {
      const response = await fetch(`/api/sprint/${sprintId}`);
      if (!response.ok) throw new Error('Failed to fetch sprint');
      return response.json();
    }
  });
}

export function useSprintActivities(sprintId: number | null, day?: number) {
  const queryParams = day !== undefined ? `?day=${day}` : '';
  
  return useQuery<SprintActivity[]>({
    queryKey: ['/api/sprint', sprintId, 'activities', day],
    enabled: !!sprintId,
    queryFn: async () => {
      const response = await fetch(`/api/sprint/${sprintId}/activities${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch sprint activities');
      return response.json();
    }
  });
}

export function useExitEligibility(journeyId: number | null) {
  return useQuery<ExitEligibility>({
    queryKey: ['/api/journey', journeyId, 'exit-eligibility'],
    enabled: !!journeyId,
    queryFn: async () => {
      const response = await fetch(`/api/journey/${journeyId}/exit-eligibility`);
      if (!response.ok) throw new Error('Failed to fetch exit eligibility');
      return response.json();
    }
  });
}

export function useProgressionSummary(journeyId: number | null) {
  return useQuery<ProgressionSummary>({
    queryKey: ['/api/journey', journeyId, 'summary'],
    enabled: !!journeyId,
    queryFn: async () => {
      const response = await fetch(`/api/journey/${journeyId}/summary`);
      if (!response.ok) throw new Error('Failed to fetch progression summary');
      return response.json();
    }
  });
}

export function useCompetencySnapshots(journeyId: number | null) {
  return useQuery<CompetencySnapshot[]>({
    queryKey: ['/api/journey', journeyId, 'snapshots'],
    enabled: !!journeyId,
    queryFn: async () => {
      const response = await fetch(`/api/journey/${journeyId}/snapshots`);
      if (!response.ok) throw new Error('Failed to fetch competency snapshots');
      return response.json();
    }
  });
}

export function useUserReadiness(userId: number | null) {
  return useQuery<ReadinessScore>({
    queryKey: ['/api/user', userId, 'readiness'],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}/readiness`);
      if (!response.ok) throw new Error('Failed to fetch user readiness');
      return response.json();
    }
  });
}

export function useStartJourney() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      userId: number;
      progressionPathSlug: string;
      projectTemplateSlug: string;
      jobApplicationId?: number;
    }) => {
      const response = await apiRequest(
        'POST',
        `/api/user/${data.userId}/journey/start`,
        {
          progressionPathSlug: data.progressionPathSlug,
          projectTemplateSlug: data.projectTemplateSlug,
          jobApplicationId: data.jobApplicationId
        }
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user', variables.userId, 'journey'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', variables.userId, 'journeys'] });
    }
  });
}

export function useCompleteActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      journeyId: number;
      activityId: number;
      userResponse: unknown;
      evaluation: { score?: number; feedback?: string; competencies?: string[] };
    }) => {
      const response = await apiRequest(
        'POST',
        `/api/journey/${data.journeyId}/complete-activity`,
        {
          activityId: data.activityId,
          userResponse: data.userResponse,
          evaluation: data.evaluation
        }
      );
      return response.json() as Promise<ActivityCompletionResult>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey', variables.journeyId] });
      queryClient.invalidateQueries({ queryKey: ['/api/journey', variables.journeyId, 'current-sprint'] });
    }
  });
}

export function useCompleteSprint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (journeyId: number) => {
      const response = await apiRequest(
        'POST',
        `/api/journey/${journeyId}/complete-sprint`,
        {}
      );
      return response.json() as Promise<SprintCompletionResult>;
    },
    onSuccess: (_, journeyId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey', journeyId] });
      queryClient.invalidateQueries({ queryKey: ['/api/journey', journeyId, 'arcs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journey', journeyId, 'current-sprint'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journey', journeyId, 'exit-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journey', journeyId, 'snapshots'] });
    }
  });
}

export function useGraduateJourney() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      journeyId: number;
      exitTrigger: 'user_choice' | 'readiness_threshold' | 'max_sprints';
    }) => {
      const response = await apiRequest(
        'POST',
        `/api/journey/${data.journeyId}/graduate`,
        { exitTrigger: data.exitTrigger }
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/journey', variables.journeyId] });
    }
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      activityId: number;
      updates: Partial<SprintActivity>;
      sprintId?: number;
    }) => {
      const response = await apiRequest(
        'PATCH',
        `/api/activity/${data.activityId}`,
        data.updates
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      if (variables.sprintId) {
        queryClient.invalidateQueries({ queryKey: ['/api/sprint', variables.sprintId] });
        queryClient.invalidateQueries({ queryKey: ['/api/sprint', variables.sprintId, 'activities'] });
      }
    }
  });
}

export function useRecordCompetencyDelta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      userId: number;
      journeyId: number;
      competencySlug: string;
      source: 'workspace' | 'interview';
      evidenceType: string;
      score?: number;
      activityId?: number;
    }) => {
      const response = await apiRequest(
        'POST',
        `/api/user/${data.userId}/competency-delta`,
        {
          journeyId: data.journeyId,
          competencySlug: data.competencySlug,
          source: data.source,
          evidenceType: data.evidenceType,
          score: data.score,
          activityId: data.activityId
        }
      );
      return response.json() as Promise<DeltaResult>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user', variables.userId, 'readiness'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journey', variables.journeyId] });
    }
  });
}
