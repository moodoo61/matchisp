import { BadRequestException } from '@nestjs/common';

export function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeLabel(value: string) {
  return value.trim();
}

export function normalizeChannelPaths(dto: {
  type: 'IPTV' | 'HDMI';
  sourceUrl?: string | null;
  videoDevice?: string | null;
  audioDevice?: string | null;
}) {
  if (dto.type === 'IPTV') {
    const sourceUrl = dto.sourceUrl?.trim();
    if (!sourceUrl) {
      throw new BadRequestException('مصدر IPTV مطلوب');
    }
    return {
      sourceUrl,
      videoDevice: null as string | null,
      audioDevice: null as string | null,
    };
  }
  const videoDevice = dto.videoDevice?.trim();
  const audioDevice = dto.audioDevice?.trim();
  if (!videoDevice || !audioDevice) {
    throw new BadRequestException('مسار الفيديو والصوت مطلوبان لـ HDMI');
  }
  return {
    sourceUrl: null as string | null,
    videoDevice,
    audioDevice,
  };
}
