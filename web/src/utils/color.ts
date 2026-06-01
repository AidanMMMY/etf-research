export function getReturnColor(value?: number | null): string {
  if (value === undefined || value === null) return '#999';
  return value >= 0 ? '#cf1322' : '#3f8600';
}

export function getReturnBgColor(value?: number | null): string {
  if (value === undefined || value === null) return '#f5f5f5';
  return value >= 0 ? '#fff1f0' : '#f6ffed';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#52c41a';
  if (score >= 60) return '#faad14';
  if (score >= 40) return '#fa8c16';
  return '#f5222d';
}
