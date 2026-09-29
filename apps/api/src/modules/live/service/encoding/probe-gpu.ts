import { execFile } from 'child_process';
import { access, readFile, readdir } from 'fs/promises';
import { constants } from 'fs';
import { promisify } from 'util';
import type { GpuStatus } from './encoding-types';

const execFileAsync = promisify(execFile);

export async function probeGpu(): Promise<GpuStatus> {
  const nvidia = await probeNvidia();
  if (nvidia) return nvidia;

  const dri = await probeDri();
  if (dri) return dri;

  return {
    status: 'missing',
    available: false,
    vendor: null,
    name: null,
    driver: null,
    detail: 'لم يتم اكتشاف GPU على هذا الخادم',
  };
}

async function probeNvidia(): Promise<GpuStatus | null> {
  try {
    await access('/usr/bin/nvidia-smi', constants.X_OK);
  } catch {
    try {
      await access('/usr/bin/nvidia-smi', constants.F_OK);
    } catch {
      return null;
    }
  }

  try {
    const { stdout } = await execFileAsync(
      'nvidia-smi',
      ['--query-gpu=name,driver_version', '--format=csv,noheader,nounits'],
      { timeout: 4000 },
    );
    const line = stdout.trim().split('\n')[0]?.trim();
    if (!line) {
      return {
        status: 'error',
        available: false,
        vendor: 'NVIDIA',
        name: null,
        driver: null,
        detail: 'nvidia-smi لم يُرجع بيانات GPU',
      };
    }
    const [name, driver] = line.split(',').map((p) => p.trim());
    return {
      status: 'ok',
      available: true,
      vendor: 'NVIDIA',
      name: name || null,
      driver: driver || null,
      detail: driver ? `NVIDIA — برنامج التشغيل ${driver}` : 'NVIDIA جاهز',
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'تعذر التواصل مع NVIDIA';
    return {
      status: 'error',
      available: false,
      vendor: 'NVIDIA',
      name: null,
      driver: await readNvidiaDriverVersion(),
      detail:
        /couldn't communicate|NVIDIA-SMI has failed/i.test(message) ||
        /failed/i.test(message)
          ? 'NVIDIA موجودة لكن برنامج التشغيل غير متاح أو غير شغّال'
          : message.slice(0, 200),
    };
  }
}

async function readNvidiaDriverVersion(): Promise<string | null> {
  try {
    const raw = await readFile('/proc/driver/nvidia/version', 'utf8');
    const m = raw.match(/Kernel Module\s+([0-9.]+)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

async function probeDri(): Promise<GpuStatus | null> {
  try {
    const entries = await readdir('/dev/dri');
    const cards = entries.filter((e) => /^card\d+$/.test(e));
    if (!cards.length) return null;
    return {
      status: 'degraded',
      available: true,
      vendor: 'DRM',
      name: cards.map((c) => `/dev/dri/${c}`).join(', '),
      driver: null,
      detail: 'تم اكتشاف جهاز عرض (DRM) — قد يدعم VAAPI',
    };
  } catch {
    return null;
  }
}
