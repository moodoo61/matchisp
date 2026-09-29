import { execFile } from 'child_process';
import { access } from 'fs/promises';
import { constants } from 'fs';
import { promisify } from 'util';
import type { FfmpegStatus } from './encoding-types';

const execFileAsync = promisify(execFile);

export async function resolveBinary(bin: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('which', [bin], { timeout: 2000 });
    const path = stdout.trim().split('\n')[0];
    return path || null;
  } catch {
    const candidates = [`/usr/bin/${bin}`, `/usr/local/bin/${bin}`];
    for (const path of candidates) {
      try {
        await access(path, constants.X_OK);
        return path;
      } catch {
        // continue
      }
    }
    return null;
  }
}

export async function probeFfmpeg(): Promise<FfmpegStatus> {
  const path = await resolveBinary('ffmpeg');
  if (!path) {
    return {
      status: 'missing',
      available: false,
      path: null,
      version: null,
      detail: 'FFmpeg غير مثبّت على الخادم',
    };
  }

  try {
    const { stdout, stderr } = await execFileAsync(path, ['-version'], {
      timeout: 4000,
    });
    const text = `${stdout}\n${stderr}`;
    const versionLine = text.split('\n').find((l) => /ffmpeg version/i.test(l));
    const version = versionLine?.match(/ffmpeg version\s+(\S+)/i)?.[1] ?? null;
    return {
      status: 'ok',
      available: true,
      path,
      version,
      detail: version ? `FFmpeg ${version}` : 'FFmpeg متاح',
    };
  } catch (err) {
    return {
      status: 'error',
      available: false,
      path,
      version: null,
      detail:
        err instanceof Error ? err.message.slice(0, 200) : 'تعذر تشغيل FFmpeg',
    };
  }
}
