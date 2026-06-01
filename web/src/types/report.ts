export interface ReportMetadata {
  id: number;
  report_type: string;
  report_date: string;
  pool_id?: number;
  template_id?: number;
  status: 'pending' | 'running' | 'done' | 'failed';
  format: 'html' | 'markdown' | 'json';
  file_path?: string;
  file_size?: number;
  error_msg?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export interface ReportGenerateRequest {
  pool_id: number;
  report_type: string;
  format: 'html' | 'markdown' | 'json';
  template_id?: number;
}

export interface ReportStatus {
  id: number;
  status: 'pending' | 'running' | 'done' | 'failed';
  progress?: number;
  error_msg?: string;
}
