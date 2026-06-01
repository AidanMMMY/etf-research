import client from './client';

export const analysisApi = {
  correlation: (codes: string[], window?: number, method?: 'pearson' | 'spearman') =>
    client.get<{ codes: string[]; matrix: number[][] }>('/analysis/correlation', {
      params: { codes, window, method },
    }),
};
