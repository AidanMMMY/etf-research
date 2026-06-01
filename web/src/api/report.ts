import client from './client';
import type { ReportMetadata, ReportGenerateRequest, ReportStatus } from '@/types/report';

export const reportApi = {
  list: (params?: { report_type?: string; pool_id?: number; limit?: number }) =>
    client.get<ReportMetadata[]>('/reports', { params }),
  generate: (data: ReportGenerateRequest) =>
    client.post<ReportMetadata>('/reports/generate', data),
  status: (id: number) =>
    client.get<ReportStatus>(`/reports/${id}/status`),
  downloadUrl: (id: number) => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${base}/reports/${id}/download`;
  },
};
