/** استخراج مسارات الفيديو (عرض) من استجابة Mist streams / active_streams */

export type MistVideoTrackSize = {
  width: number;
  height: number | null;
};

type TrackLike = {
  type?: unknown;
  width?: unknown;
  height?: unknown;
  codec?: unknown;
};

function asPositiveInt(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function pushTrack(
  into: Map<number, MistVideoTrackSize>,
  width: number,
  height: number | null,
) {
  const prev = into.get(width);
  if (!prev || (height && !prev.height)) {
    into.set(width, { width, height });
  }
}

function collectFromTracks(
  tracks: unknown,
  into: Map<number, MistVideoTrackSize>,
) {
  if (!tracks || typeof tracks !== 'object') return;
  for (const raw of Object.values(tracks as Record<string, TrackLike>)) {
    if (!raw || typeof raw !== 'object') continue;
    const type = String(raw.type ?? '').toLowerCase();
    if (type && type !== 'video') continue;
    const width = asPositiveInt(raw.width);
    if (!width) continue;
    pushTrack(into, width, asPositiveInt(raw.height));
  }
}

/**
 * في active_streams longform تظهر المسارات داخل health
 * كمفاتيح video_H264_… تحتوي width/height
 */
function collectFromHealth(
  health: unknown,
  into: Map<number, MistVideoTrackSize>,
) {
  if (!health || typeof health !== 'object' || Array.isArray(health)) return;
  for (const [key, raw] of Object.entries(
    health as Record<string, TrackLike>,
  )) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const width = asPositiveInt(raw.width);
    if (!width) continue;
    const looksVideo =
      key.startsWith('video_') ||
      String(raw.type ?? '').toLowerCase() === 'video' ||
      asPositiveInt(raw.height) != null;
    if (!looksVideo) continue;
    pushTrack(into, width, asPositiveInt(raw.height));
  }
}

/**
 * يجمع عروض مسارات الفيديو لكل ستريم من:
 * - streams[name].meta.tracks
 * - active_streams longform → health / tracks / meta.tracks
 */
export function parseStreamVideoTracks(
  streams: unknown,
  activeStreams: unknown,
): Map<string, MistVideoTrackSize[]> {
  const byStream = new Map<string, Map<number, MistVideoTrackSize>>();

  const ensure = (name: string) => {
    let map = byStream.get(name);
    if (!map) {
      map = new Map();
      byStream.set(name, map);
    }
    return map;
  };

  if (streams && typeof streams === 'object') {
    for (const [name, row] of Object.entries(
      streams as Record<string, { meta?: { tracks?: unknown } }>,
    )) {
      if (name === 'incomplete list' || !row) continue;
      collectFromTracks(row.meta?.tracks, ensure(name));
    }
  }

  if (
    activeStreams &&
    typeof activeStreams === 'object' &&
    !Array.isArray(activeStreams)
  ) {
    for (const [name, row] of Object.entries(
      activeStreams as Record<
        string,
        { tracks?: unknown; meta?: { tracks?: unknown }; health?: unknown }
      >,
    )) {
      if (name === 'incomplete list' || !row || typeof row !== 'object') {
        continue;
      }
      collectFromTracks(row.tracks, ensure(name));
      collectFromTracks(row.meta?.tracks, ensure(name));
      collectFromHealth(row.health, ensure(name));
    }
  }

  const out = new Map<string, MistVideoTrackSize[]>();
  for (const [name, map] of byStream) {
    const list = [...map.values()].sort((a, b) => b.width - a.width);
    if (list.length) out.set(name, list);
  }
  return out;
}

export function mistVideoTrackLabel(track: MistVideoTrackSize): string {
  if (track.height && track.height > 0) return `${track.height}p`;
  return `${track.width}`;
}
