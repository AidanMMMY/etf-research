import { useQuery } from '@tanstack/react-query';
import { scoreApi } from '@/api';

export function useScores(params?: { template_id?: number; market?: string; category?: string; limit?: number }) {
  return useQuery({
    queryKey: ['scores', params],
    queryFn: () => scoreApi.list(params).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useScoreTemplates() {
  return useQuery({
    queryKey: ['score-templates'],
    queryFn: () => scoreApi.templates().then((r) => r.data),
    staleTime: 300_000,
  });
}

export function useETFScore(code: string, templateId?: number) {
  return useQuery({
    queryKey: ['etf-score', code, templateId],
    queryFn: () => scoreApi.get(code, { template_id: templateId }).then((r) => r.data),
    enabled: !!code,
  });
}
