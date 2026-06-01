import client from './client';
import type { ETFListResponse, ETFInfo, ETFFilterParams } from '@/types/etf';

export const etfApi = {
  list: (params?: ETFFilterParams) =>
    client.get<ETFListResponse>('/etfs', { params }),
  get: (code: string) => client.get<ETFInfo>(`/etfs/${code}`),
  categories: () => client.get<{ categories: string[] }>('/etfs/categories/list'),
  markets: () => client.get<{ markets: string[] }>('/etfs/markets/list'),
};
