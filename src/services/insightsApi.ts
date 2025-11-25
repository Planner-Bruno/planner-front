import { API_BASE_URL } from '@/config/api';

export interface TaskInsights {
  total: number;
  backlog: number;
  in_progress: number;
  done: number;
  overdue: number;
  due_today: number;
}

export interface GoalInsights {
  total: number;
  completed: number;
  active: number;
}

export interface EventInsights {
  total: number;
  upcoming_7d: number;
  today: number;
}

export interface PlannerInsightsOverview {
  tasks: TaskInsights;
  goals: GoalInsights;
  events: EventInsights;
  notes: number;
}

const insightsEndpoint = `${API_BASE_URL}/planner/insights/overview`;

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
});

export const fetchPlannerInsights = async (token: string): Promise<PlannerInsightsOverview> => {
  const response = await fetch(insightsEndpoint, {
    method: 'GET',
    headers: authHeaders(token)
  });

  if (response.status === 401) {
    throw new Error('Sessão expirada, faça login novamente');
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || 'Não foi possível carregar os insights');
  }

  return (await response.json()) as PlannerInsightsOverview;
};
