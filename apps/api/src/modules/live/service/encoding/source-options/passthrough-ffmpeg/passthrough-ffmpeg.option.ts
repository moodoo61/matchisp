import path from 'node:path';
import { ENCODING_SOURCE_MODE_META } from '@isp/shared';
import type {
  SourceOptionDefinition,
  SourceOptionInput,
} from '../source-option.types';
import { resolvePassthroughFfmpegScriptPath } from './passthrough-ffmpeg.paths';

/**
 * تمرير مباشر عبر ffmpeg:
 * يمرّر التدفق إلى Mist عبر ts-exec مع نسخ الترميز (copy) بدون إعادة ترميز.
 */
export const passthroughFfmpegSourceOption: SourceOptionDefinition = {
  mode: 'passthrough_ffmpeg',
  label: ENCODING_SOURCE_MODE_META.passthrough_ffmpeg.label,
  description: ENCODING_SOURCE_MODE_META.passthrough_ffmpeg.description,
  resolveMistSource,
};

function resolveMistSource(input: SourceOptionInput): string {
  if (input.type === 'IPTV') {
    const source = input.sourceUrl?.trim();
    if (!source) {
      throw new Error('مصدر IPTV مطلوب للتمرير عبر ffmpeg');
    }
    return buildTsExec(source);
  }

  const video = input.videoDevice?.trim();
  const audio = input.audioDevice?.trim();
  if (!video || !audio) {
    throw new Error('مسارا الفيديو والصوت مطلوبان للتمرير عبر ffmpeg');
  }
  // HDMI: السكربت يستقبل URL/مسار إدخال واحد — نبقي أوامر الجهاز مباشرة لـ Mist
  return [
    'ts-exec:ffmpeg -nostdin -hide_banner -loglevel error',
    `-f v4l2 -thread_queue_size 512 -i ${shellEscape(video)}`,
    `-f alsa -thread_queue_size 512 -i ${shellEscape(audio)}`,
    '-c:v copy -c:a aac -f mpegts -',
  ].join(' ');
}

function buildTsExec(source: string) {
  const script = resolvePassthroughFfmpegScriptPath();
  if (!path.isAbsolute(script)) {
    throw new Error('مسار سكربت التمرير عبر ffmpeg يجب أن يكون مطلقاً');
  }
  return `ts-exec:${shellEscape(script)} ${shellEscape(source)}`;
}

function shellEscape(value: string) {
  if (/^[A-Za-z0-9_./:@%?&=+-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
