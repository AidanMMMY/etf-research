import client from './client';
import type { Pool, PoolCreate, PoolUpdate, PoolWeight, PoolAnalytics, PoolSnapshot } from '@/types/pool';

export const poolApi = {
  list: () => client.get<Pool[]>('/pools'),
  get: (id: number) => client.get<Pool>(`/pools/${id}`),
  create: (data: PoolCreate) => client.post<Pool>('/pools', data),
  update: (id: number, data: PoolUpdate) => client.put<Pool>(`/pools/${id}`, data),
  delete: (id: number) => client.delete(`/pools/${id}`),
  addMember: (id: number, etf_code: string) =>
    client.post<Pool>(`/pools/${id}/members`, { etf_code }),
  removeMember: (id: number, etf_code: string) =>
    client.delete<Pool>(`/pools/${id}/members/${etf_code}`),
  weights: (id: number) => client.get<PoolWeight[]>(`/pools/${id}/weights`),
  updateWeight: (id: number, etf_code: string, target_weight: number) =>
    client.put<PoolWeight>(`/pools/${id}/weights/${etf_code}`, { target_weight }),
  suggestWeights: (id: number, algorithm: string, template_id?: number) =>
    client.post<PoolWeight[]>(`/pools/${id}/weights/suggest`, { algorithm, template_id }),
  analytics: (id: number) => client.get<PoolAnalytics>(`/pools/${id}/analytics`),
  correlation: (id: number) => client.get<{ codes: string[]; matrix: number[][] }>(`/pools/${id}/correlation`),
  snapshots: (id: number, limit?: number) =>
    client.get<PoolSnapshot[]>(`/pools/${id}/snapshots`, { params: { limit } }),
  createSnapshot: (id: number) => client.post<PoolSnapshot>(`/pools/${id}/snapshots`),
};
