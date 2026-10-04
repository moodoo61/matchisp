/** تنسيق مدة Mist مثل UI.format.duration — HH:MM:SS (ثوانٍ) */
export function formatMistDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return '—';
  const total = Math.floor(seconds);
  const hr = Math.floor(total / 3600);
  const min = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hr)}:${pad(min)}:${pad(sec)}`;
}

function formatMistNumber(num: number): string {
  if (!Number.isFinite(num) || num === 0) return String(num);
  const sig = 3;
  const mult = 10 ** (sig - Math.floor(Math.log(Math.abs(num)) / Math.LN10) - 1);
  return String(Math.round(num * mult) / mult);
}

/** مثل UI.format.bytes — أساس 1024 */
export function formatMistBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return '—';
  if (bytes <= 0) return '0byte';
  const units = ['byte', 'Kibyte', 'Mibyte', 'Gibyte', 'Tibyte'];
  const exp = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exp;
  let unit = units[exp];
  if (exp === 0 && value !== 1) unit += 's';
  return `${formatMistNumber(value)}${unit}`;
}

/** مثل UI.format.bits(downbps*8, true) — أساس 1000 */
export function formatMistBitrate(downBps: number | null | undefined): string {
  if (downBps == null || !Number.isFinite(downBps)) return '—';
  const bits = downBps * 8;
  if (bits <= 0) return '0bit/s';
  const units = ['bit', 'kbit', 'Mbit', 'Gbit', 'Tbit'];
  const exp = Math.min(
    Math.floor(Math.log(bits) / Math.log(1000)),
    units.length - 1,
  );
  const value = bits / 1000 ** exp;
  let unit = units[exp];
  if (exp === 0 && value !== 1) unit += 's';
  return `${formatMistNumber(value)}${unit}/s`;
}
