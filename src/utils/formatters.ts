import type { FeedStatus } from '../shared/types';

export function formatCurrency(value: number, currency: 'BRL' | 'USD' = 'BRL'): string {
  if (!Number.isFinite(value)) return '—';
  const prefix = currency === 'BRL' ? 'R$' : 'US$';
  return `${prefix} ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompactCap(millions: number, currency: 'BRL' | 'USD' = 'BRL'): string {
  if (!Number.isFinite(millions) || millions === 0) return 'N/D';
  const prefix = currency === 'BRL' ? 'R$' : 'US$';
  if (millions >= 1_000_000) {
    return `${prefix} ${(millions / 1_000_000).toFixed(2)} tri`;
  }
  if (millions >= 1_000) {
    return `${prefix} ${(millions / 1_000).toFixed(1)} bi`;
  }
  return `${prefix} ${millions.toFixed(0)} mi`;
}

export function formatPct(value: number | null | undefined, signed = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatFeedStatusLabel(status: FeedStatus): string {
  switch (status) {
    case 'real_time':
      return 'Tempo Real';
    case 'delayed_15m':
      return 'Atraso 15 min';
    case 'eod_closing':
      return 'Fechamento';
    case 'official_bcb':
      return 'Oficial BCB';
    case 'reference_snapshot':
    default:
      return 'Fechamento de Referência';
  }
}

export function formatTimestampBRT(iso: string): string {
  try {
    const dt = new Date(iso);
    return dt.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
