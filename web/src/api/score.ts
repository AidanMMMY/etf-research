import client from './client';
import type { ETFScoreListResponse, ETFScore, ScoreTemplate } from '@/types/score';

export const scoreApi = {
  list: (params?: { template_id?: number; market?: string; category?: string; trade_date?: string; limit?: number }) =>
    client.get<ETFScoreListResponse>('/scores', { params }),
  get: (code: string, params?: { template_id?: number; trade_date?: string }) =>
    client.get<ETFScore>(`/scores/${code}`, { params }),
  templates: () => client.get<ScoreTemplate[]>('/scores/templates'),
  createTemplate: (data: Omit<ScoreTemplate, 'id' | 'created_at'>) =>
    client.post<ScoreTemplate>('/scores/templates', data),
  updateTemplate: (id: number, data: Partial<ScoreTemplate>) =>
    client.put<ScoreTemplate>(`/scores/templates/${id}`, data),
  deleteTemplate: (id: number) => client.delete(`/scores/templates/${id}`),
};
