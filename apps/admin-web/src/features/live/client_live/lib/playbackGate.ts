import type { TsQualityFromMist } from '../types';

/** فترة استطلاع الجودات في الخلفية بعد بدء التشغيل */
export const CHANNEL_WAKE_POLL_MS = 2000;

/** أقصى مدة لاستطلاع الجودات بعد الاختيار */
export const CHANNEL_WAKE_TIMEOUT_MS = 30_000;

/** جودات صالحة لـ Mist ?video=عرضxارتفاع */
export function hasPlayableTsQualities(
  qualities: TsQualityFromMist[] | null | undefined,
): boolean {
  if (!qualities?.length) return false;
  return qualities.some((row) => {
    const width = Number(row.width);
    const height = row.height == null ? NaN : Number(row.height);
    return (
      Number.isFinite(width) &&
      width > 0 &&
      Number.isFinite(height) &&
      height > 0
    );
  });
}

/**
 * أخضر Mist = online === 1 (نشط).
 * @see MistServer streams API: online 0=error, 1=active, 2=inactive
 */
export function isMistStreamOnline(online: 0 | 1 | 2 | null): boolean {
  return online === 1;
}
