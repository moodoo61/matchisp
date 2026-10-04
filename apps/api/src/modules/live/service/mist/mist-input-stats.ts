import type { MistApiResponse, MistInputStats } from './mist-types';

const CLIENT_FIELDS = [
  'stream',
  'protocol',
  'conntime',
  'down',
  'downbps',
] as const;

function asNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * يحّول استجابة clients (Current inputs) إلى خريطة حسب اسم الستريم.
 * نفس مصدر واجهة Mist: clients + protocols:INPUT
 */
export function parseInputStats(
  raw: MistApiResponse['clients'],
): Map<string, MistInputStats> {
  const map = new Map<string, MistInputStats>();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return map;

  const fields = Array.isArray(raw.fields) ? raw.fields : [...CLIENT_FIELDS];
  const rows = Array.isArray(raw.data) ? raw.data : [];
  const idx = (name: string) => fields.indexOf(name);

  const iStream = idx('stream');
  const iProtocol = idx('protocol');
  const iConn = idx('conntime');
  const iDown = idx('down');
  const iDownbps = idx('downbps');
  if (iStream < 0 || iConn < 0) return map;

  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const stream = String(row[iStream] ?? '').trim();
    if (!stream) continue;
    const protocol = String(row[iProtocol] ?? '');
    if (protocol && !protocol.startsWith('INPUT')) continue;

    const stats: MistInputStats = {
      stream,
      conntime: asNumber(row[iConn]),
      down: iDown >= 0 ? asNumber(row[iDown]) : 0,
      downbps: iDownbps >= 0 ? asNumber(row[iDownbps]) : 0,
    };

    const prev = map.get(stream);
    // إن تعددت المدخلات: الأطول اتصالاً
    if (!prev || stats.conntime >= prev.conntime) {
      map.set(stream, stats);
    }
  }
  return map;
}

export const INPUT_CLIENT_REQUEST = {
  protocols: ['INPUT'],
  fields: [...CLIENT_FIELDS],
  /** مثل واجهة Mist — أدق من «الآن» مباشرة */
  time: -3,
};
