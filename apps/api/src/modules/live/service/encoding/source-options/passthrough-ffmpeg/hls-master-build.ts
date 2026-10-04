import type { HlsVariantInfo } from './hls-master-parse';

/** يبني محتوى master playlist من مستويات مختارة */
export function buildCustomHlsMaster(
  variants: HlsVariantInfo[],
): string {
  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:6',
    '#EXT-X-INDEPENDENT-SEGMENTS',
  ];

  const sorted = [...variants].sort(
    (a, b) => (b.bandwidth ?? 0) - (a.bandwidth ?? 0),
  );

  for (const variant of sorted) {
    const attrs: string[] = [];
    if (variant.bandwidth != null) {
      attrs.push(`BANDWIDTH=${variant.bandwidth}`);
    } else {
      attrs.push('BANDWIDTH=1000000');
    }
    if (variant.averageBandwidth != null) {
      attrs.push(`AVERAGE-BANDWIDTH=${variant.averageBandwidth}`);
    }
    if (variant.resolution) {
      attrs.push(`RESOLUTION=${variant.resolution}`);
    }
    if (variant.frameRate != null) {
      attrs.push(`FRAME-RATE=${variant.frameRate}`);
    }
    if (variant.name) {
      attrs.push(`NAME="${variant.name.replace(/"/g, '')}"`);
    }
    lines.push(`#EXT-X-STREAM-INF:${attrs.join(',')}`);
    lines.push(variant.url);
  }

  return `${lines.join('\n')}\n`;
}
