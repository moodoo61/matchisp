import { ENCODING_SOURCE_MODE_META } from '@isp/shared';
import type {
  SourceOptionDefinition,
  SourceOptionInput,
} from '../source-option.types';

/**
 * تمرير مباشر — السلوك الحالي لإضافة القنوات:
 * يُرسل المصدر إلى MistServer دون إعادة ترميز.
 * IPTV: الرابط كما هو.
 * HDMI: إدخال الأجهزة عبر ffmpeg بنسخ الفيديو (copy) كما كان سابقاً.
 */
export const passthroughSourceOption: SourceOptionDefinition = {
  mode: 'passthrough',
  label: ENCODING_SOURCE_MODE_META.passthrough.label,
  description: ENCODING_SOURCE_MODE_META.passthrough.description,
  resolveMistSource,
};

function resolveMistSource(input: SourceOptionInput): string {
  if (input.type === 'IPTV') {
    const source = input.sourceUrl?.trim();
    if (!source) {
      throw new Error('مصدر IPTV مطلوب لمزامنة MistServer');
    }
    return source;
  }

  const video = input.videoDevice?.trim();
  const audio = input.audioDevice?.trim();
  if (!video || !audio) {
    throw new Error('مسارا الفيديو والصوت مطلوبان لمزامنة MistServer');
  }

  return [
    'ts-exec:ffmpeg -nostdin -hide_banner -loglevel error',
    `-f v4l2 -thread_queue_size 512 -i ${shellEscape(video)}`,
    `-f alsa -thread_queue_size 512 -i ${shellEscape(audio)}`,
    '-c:v copy -c:a aac -f mpegts -',
  ].join(' ');
}

function shellEscape(value: string) {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
