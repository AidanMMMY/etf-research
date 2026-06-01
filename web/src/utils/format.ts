import dayjs from 'dayjs';

export function formatPercent(value?: number | null, digits = 2): string {
  if (value === undefined || value === null) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatNumber(value?: number | null, digits = 2): string {
  if (value === undefined || value === null) return '-';
  return value.toFixed(digits);
}

export function formatAmount(value?: number | null): string {
  if (value === undefined || value === null) return '-';
  if (value >= 1e8) return `${(value / 1e8).toFixed(1)}亿`;
  if (value >= 1e4) return `${(value / 1e4).toFixed(1)}万`;
  return value.toFixed(0);
}

export function formatDate(date?: string | null, fmt = 'YYYY-MM-DD'): string {
  if (!date) return '-';
  return dayjs(date).format(fmt);
}

export function formatDateTime(date?: string | null): string {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}
