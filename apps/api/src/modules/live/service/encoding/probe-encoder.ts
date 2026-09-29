import { execFile } from 'child_process';
import { promisify } from 'util';
import type { EncoderStatus, FfmpegStatus } from './encoding-types';

const execFileAsync = promisify(execFile);

const HARDWARE_ENCODERS = [
  'h264_nvenc',
  'hevc_nvenc',
  'av1_nvenc',
  'h264_qsv',
  'hevc_qsv',
  'h264_vaapi',
  'hevc_vaapi',
  'h264_amf',
  'hevc_amf',
] as const;

const SOFTWARE_ENCODERS = ['libx264', 'libx265', 'libaom-av1'] as const;

export async function probeEncoder(
  ffmpeg: FfmpegStatus,
): Promise<EncoderStatus> {
  if (!ffmpeg.available || !ffmpeg.path) {
    return {
      status: 'missing',
      available: false,
      preferred: null,
      hardware: [],
      software: [],
      detail: 'لا يمكن فحص المرمزات دون FFmpeg',
    };
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      ffmpeg.path,
      ['-hide_banner', '-encoders'],
      { timeout: 5000 },
    );
    const text = `${stdout}\n${stderr}`;
    const hardware = HARDWARE_ENCODERS.filter((code) =>
      new RegExp(`\\b${code}\\b`).test(text),
    );
    const software = SOFTWARE_ENCODERS.filter((code) =>
      new RegExp(`\\b${code}\\b`).test(text),
    );

    const preferred =
      hardware.find((c) => c.includes('nvenc')) ||
      hardware.find((c) => c.includes('qsv')) ||
      hardware.find((c) => c.includes('vaapi')) ||
      hardware[0] ||
      software[0] ||
      null;

    return {
      status: hardware.length ? 'ok' : software.length ? 'degraded' : 'missing',
      available: hardware.length > 0 || software.length > 0,
      preferred,
      hardware: [...hardware],
      software: [...software],
      detail: hardware.length
        ? `مرمز عتاد: ${preferred}`
        : software.length
          ? `مرمز برمجي فقط: ${preferred}`
          : 'لا توجد مرمزات فيديو معروفة',
    };
  } catch (err) {
    return {
      status: 'error',
      available: false,
      preferred: null,
      hardware: [],
      software: [],
      detail:
        err instanceof Error
          ? err.message.slice(0, 200)
          : 'تعذر قراءة قائمة المرمزات',
    };
  }
}
