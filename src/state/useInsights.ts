import { useEffect, useState, useCallback } from 'react';
import { fetchPlannerInsights, type PlannerInsightsOverview } from '@/services/insightsApi';
import { useAuth } from '@/state/AuthContext';

interface UseInsightsResult {
  data: PlannerInsightsOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useInsights = (): UseInsightsResult => {
  const { token } = useAuth();
  const [data, setData] = useState<PlannerInsightsOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const insights = await fetchPlannerInsights(token);
      setData(insights);
    } catch (insightsError) {
      const message = insightsError instanceof Error ? insightsError.message : 'Não foi possível carregar os insights';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
};
