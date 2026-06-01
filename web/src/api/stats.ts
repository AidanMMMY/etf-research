import client from './client';

export interface StatsOverview {
  etf_count: number;
  category_count: number;
  market_count: number;
  indicator_count: number;
  score_count: number;
  template_count: number;
  latest_indicator_date: string | null;
  latest_score_date: string | null;
}

export const statsApi = {
  overview: () => client.get<StatsOverview>('/stats/overview'),
};
