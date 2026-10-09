/** بناء معامل Mist ?video=عرضxارتفاع لجودات TS */

export type TsQualityFromMist = {
  width: number;
  height?: number | null;
  label: string;
};

export type TsQualityOption = {
  index: number;
  label: string;
  width: number;
  height: number | null;
};

/** فهرس الجودة المتوسطة في قائمة مرتّبة من الأعلى للأقل */
export function tsMediumQualityIndex(count: number): number {
  if (count <= 0) return -1;
  return Math.floor((count - 1) / 2);
}

/** يحوّل قائمة Mist إلى مستويات قائمة الجودة (بدون تلقائي) */
export function mistTsQualitiesToOptions(
  qualities: TsQualityFromMist[] | null | undefined,
): TsQualityOption[] {
  if (!qualities?.length) return [];
  const seen = new Set<number>();
  const out: TsQualityOption[] = [];
  for (const row of qualities) {
    const width = Math.round(Number(row.width));
    if (!Number.isFinite(width) || width <= 0 || seen.has(width)) continue;
    seen.add(width);
    const heightRaw = row.height == null ? null : Math.round(Number(row.height));
    const height =
      heightRaw != null && Number.isFinite(heightRaw) && heightRaw > 0
        ? heightRaw
        : null;
    out.push({
      index: out.length,
      label: row.label?.trim() || (height ? `${height}p` : `${width}`),
      width,
      height,
    });
  }
  return out;
}

/**
 * Mist يتطلّب ?video=عرضxارتفاع لاختيار مسار واحد.
 * ?video=عرض وحده يعيد صوتاً بلا فيديو؛ وبدون المعامل تصل عدة مسارات فيديو
 * فيفشل mpegts.js (صوت + شاشة سوداء).
 */
export function applyTsVideoTrack(
  url: string,
  track: { width: number; height: number | null } | null,
): string {
  const raw = url.trim();
  if (!raw) return '';
  try {
    const absolute = /^https?:\/\//i.test(raw);
    const parsed = new URL(raw, 'http://local.invalid');
    if (
      !track ||
      !Number.isFinite(track.width) ||
      track.width <= 0 ||
      track.height == null ||
      !Number.isFinite(track.height) ||
      track.height <= 0
    ) {
      parsed.searchParams.delete('video');
    } else {
      parsed.searchParams.set(
        'video',
        `${Math.round(track.width)}x${Math.round(track.height)}`,
      );
    }
    if (absolute) return parsed.toString();
    const qs = parsed.searchParams.toString();
    return `${parsed.pathname}${qs ? `?${qs}` : ''}`;
  } catch {
    return raw;
  }
}

/** @deprecated استخدم applyTsVideoTrack */
export function applyTsVideoWidth(
  url: string,
  width: number | null,
): string {
  if (width == null) return applyTsVideoTrack(url, null);
  return applyTsVideoTrack(url, { width, height: null });
}

export function tsQualityTrack(
  options: TsQualityOption[],
  level: number,
): { width: number; height: number | null } | null {
  if (level < 0) return null;
  const row = options.find((item) => item.index === level);
  if (!row) return null;
  return { width: row.width, height: row.height };
}

export function tsQualityWidth(
  options: TsQualityOption[],
  level: number,
): number | null {
  return tsQualityTrack(options, level)?.width ?? null;
}
