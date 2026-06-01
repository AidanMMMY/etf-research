import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poolApi } from '@/api';

export function usePoolList() {
  return useQuery({
    queryKey: ['pools'],
    queryFn: () => poolApi.list().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function usePoolDetail(id: number) {
  return useQuery({
    queryKey: ['pool', id],
    queryFn: () => poolApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePoolWeights(id: number) {
  return useQuery({
    queryKey: ['pool-weights', id],
    queryFn: () => poolApi.weights(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePoolAnalytics(id: number) {
  return useQuery({
    queryKey: ['pool-analytics', id],
    queryFn: () => poolApi.analytics(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePoolCorrelation(id: number) {
  return useQuery({
    queryKey: ['pool-correlation', id],
    queryFn: () => poolApi.correlation(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useUpdateWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poolId, code, weight }: { poolId: number; code: string; weight: number }) =>
      poolApi.updateWeight(poolId, code, weight),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pool-weights', vars.poolId] });
      qc.invalidateQueries({ queryKey: ['pool-analytics', vars.poolId] });
    },
  });
}
