import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { readdir, readFile, realpath } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type HdmiCaptureDevice = {
  id: string;
  name: string;
  videoPath: string;
  audioPath: string | null;
  audioPaths: string[];
};

@Injectable()
export class HdmiDevicesService {
  /** أجهزة HDMI Capture المتصلة بالخادم (V4L2 + ALSA) */
  async list(): Promise<HdmiCaptureDevice[]> {
    const videoNodes = await this.listCaptureVideoNodes();
    const audioCards = await this.listAlsaCards();
    const v4l2Names = await this.readV4l2Names();
    const sysNames = await this.readSysfsNames(videoNodes);

    return videoNodes.map((videoPath, index) => {
      const card =
        audioCards.length === 0
          ? null
          : audioCards[Math.min(index, audioCards.length - 1)];
      const audioPaths = card
        ? [`hw:${card.index},0`, `plughw:${card.index},0`]
        : [];
      const name =
        v4l2Names[videoPath] ||
        sysNames[videoPath] ||
        (card ? `${card.name}` : `Capture ${index + 1}`);
      return {
        id: videoPath,
        name,
        videoPath,
        audioPath: audioPaths[0] ?? null,
        audioPaths,
      };
    });
  }

  /** عقد V4L2 القادرة على الالتقاط (video capture) */
  private async listCaptureVideoNodes(): Promise<string[]> {
    try {
      const entries = await readdir('/dev');
      const nodes = entries
        .filter((name) => /^video\d+$/.test(name))
        .map((name) => `/dev/${name}`)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      const captureCapable: string[] = [];
      for (const path of nodes) {
        if (await this.isCaptureDevice(path)) {
          captureCapable.push(path);
        }
      }
      return captureCapable.length ? captureCapable : nodes;
    } catch {
      return [];
    }
  }

  private async isCaptureDevice(videoPath: string): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync(
        'v4l2-ctl',
        [`--device=${videoPath}`, '--all'],
        { timeout: 2000 },
      );
      return /Video Capture/i.test(stdout);
    } catch {
      // بدون v4l2-ctl نفترض أن كل /dev/video* مرشّح
      return true;
    }
  }

  private async listAlsaCards(): Promise<{ index: number; name: string }[]> {
    try {
      const raw = await readFile('/proc/asound/cards', 'utf8');
      const cards: { index: number; name: string }[] = [];
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*(\d+)\s+\[[^\]]+\]:\s*(.+)$/);
        if (m) {
          cards.push({ index: Number(m[1]), name: m[2].trim() });
        }
      }
      return cards;
    } catch {
      return [];
    }
  }

  private async readV4l2Names(): Promise<Record<string, string>> {
    try {
      const { stdout } = await execFileAsync('v4l2-ctl', ['--list-devices'], {
        timeout: 3000,
      });
      const map: Record<string, string> = {};
      let currentName = '';
      for (const line of stdout.split('\n')) {
        if (!line.startsWith('\t') && line.trim()) {
          currentName = line.replace(/:$/, '').trim();
          continue;
        }
        const path = line.trim();
        if (path.startsWith('/dev/video') && currentName) {
          map[path] = currentName;
        }
      }
      return map;
    } catch {
      return {};
    }
  }

  private async readSysfsNames(
    videoPaths: string[],
  ): Promise<Record<string, string>> {
    const map: Record<string, string> = {};
    for (const videoPath of videoPaths) {
      try {
        const resolved = await realpath(videoPath);
        const match = resolved.match(/video(\d+)$/);
        if (!match) continue;
        const namePath = join('/sys/class/video4linux', `video${match[1]}`, 'name');
        const name = (await readFile(namePath, 'utf8')).trim();
        if (name) map[videoPath] = name;
      } catch {
        // تجاهل
      }
    }
    return map;
  }
}
