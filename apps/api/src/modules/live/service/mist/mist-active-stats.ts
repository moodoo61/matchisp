import type { MistActiveStreamStats, MistApiResponse } from './mist-types';

const STAT_FIELDS = ['viewers', 'clients', 'inputs', 'outputs'] as const;

function asNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** يحوّل استجابة active_streams ذات الحقول إلى خريطة إحصاءات */
export function parseActiveStreamStats(
  raw: MistApiResponse['active_streams'],
): Map<string, MistActiveStreamStats> {
  const map = new Map<string, MistActiveStreamStats>();
  if (!raw || Array.isArray(raw) || typeof raw !== 'object') return map;

  for (const [name, value] of Object.entries(raw)) {
    if (name === 'incomplete list') continue;
    if (Array.isArray(value)) {
      map.set(name, {
        name,
        viewers: asNumber(value[0]),
        clients: asNumber(value[1]),
        inputs: asNumber(value[2]),
        outputs: asNumber(value[3]),
      });
      continue;
    }
    if (value && typeof value === 'object') {
      const row = value as Record<string, number>;
      map.set(name, {
        name,
        viewers: asNumber(row.viewers),
        clients: asNumber(row.clients),
        inputs: asNumber(row.inputs),
        outputs: asNumber(row.outputs),
      });
    }
  }
  return map;
}

export const ACTIVE_STREAM_STAT_FIELDS = [...STAT_FIELDS];
