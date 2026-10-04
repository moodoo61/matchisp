/** نتيجة مسار جودة واحد من master playlist */
export type HlsVariantInfo = {
  /** رابط مطلق لملف الجودة */
  url: string;
  bandwidth: number | null;
  averageBandwidth: number | null;
  resolution: string | null;
  frameRate: number | null;
  name: string | null;
  /** تسمية عرض عربية/مختصرة */
  label: string;
};

export type HlsProbeResult = {
  masterUrl: string;
  /** true إن وُجدت مسارات STREAM-INF متعددة */
  isMaster: boolean;
  variants: HlsVariantInfo[];
};

/**
 * يحلّل محتوى m3u8 ويستخرج مستويات EXT-X-STREAM-INF.
 * إن لم توجد، يُعامل الملف كجودة واحدة (المسار نفسه).
 */
export function parseHlsMasterPlaylist(
  masterUrl: string,
  body: string,
): HlsProbeResult {
  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#EXTM3U'));

  const variants: HlsVariantInfo[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (!line.toUpperCase().startsWith('#EXT-X-STREAM-INF:')) continue;
    const uriLine = lines[i + 1];
    if (!uriLine || uriLine.startsWith('#')) continue;

    const attrs = parseStreamInfAttrs(line.slice('#EXT-X-STREAM-INF:'.length));
    const url = resolvePlaylistUri(masterUrl, uriLine);
    const bandwidth = attrs.bandwidth;
    const averageBandwidth = attrs.averageBandwidth;
    const resolution = attrs.resolution;
    const frameRate = attrs.frameRate;
    const name = attrs.name;
    variants.push({
      url,
      bandwidth,
      averageBandwidth,
      resolution,
      frameRate,
      name,
      label: formatVariantLabel({
        bandwidth,
        averageBandwidth,
        resolution,
        name,
      }),
    });
    i += 1;
  }

  if (variants.length > 0) {
    // الأعلى أولاً
    variants.sort(
      (a, b) => (b.bandwidth ?? 0) - (a.bandwidth ?? 0),
    );
    return { masterUrl, isMaster: true, variants };
  }

  return {
    masterUrl,
    isMaster: false,
    variants: [
      {
        url: masterUrl,
        bandwidth: null,
        averageBandwidth: null,
        resolution: null,
        frameRate: null,
        name: null,
        label: 'جودة واحدة (المسار كما هو)',
      },
    ],
  };
}

export function resolvePlaylistUri(masterUrl: string, uri: string): string {
  const trimmed = uri.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return new URL(trimmed, masterUrl).href;
}

function parseStreamInfAttrs(raw: string) {
  const map = new Map<string, string>();
  const re = /([A-Z0-9-]+)=("([^"]*)"|[^,]*)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const key = match[1]!.toUpperCase();
    const value = (match[3] ?? match[2] ?? '').trim();
    map.set(key, value);
  }

  const bandwidth = parseIntAttr(map.get('BANDWIDTH'));
  const averageBandwidth = parseIntAttr(map.get('AVERAGE-BANDWIDTH'));
  const resolution = map.get('RESOLUTION')?.trim() || null;
  const frameRate = parseFloatAttr(map.get('FRAME-RATE'));
  const name = map.get('NAME')?.trim() || null;

  return { bandwidth, averageBandwidth, resolution, frameRate, name };
}

function parseIntAttr(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function parseFloatAttr(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function formatVariantLabel(input: {
  bandwidth: number | null;
  averageBandwidth: number | null;
  resolution: string | null;
  name: string | null;
}): string {
  const parts: string[] = [];
  if (input.name) parts.push(input.name);
  if (input.resolution) {
    parts.push(input.resolution.replace('x', '×'));
  }
  const bw = input.averageBandwidth ?? input.bandwidth;
  if (bw != null) parts.push(formatBandwidth(bw));
  return parts.length ? parts.join(' · ') : 'مستوى جودة';
}

function formatBandwidth(bps: number): string {
  if (bps >= 1_000_000) {
    const mbps = bps / 1_000_000;
    return `${mbps >= 10 ? mbps.toFixed(0) : mbps.toFixed(1)} Mbps`;
  }
  if (bps >= 1000) {
    return `${Math.round(bps / 1000)} kbps`;
  }
  return `${bps} bps`;
}
