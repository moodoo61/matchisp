import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/** غلاف منخفض المستوى لأوامر nmcli */
@Injectable()
export class NmcliService {
  private readonly logger = new Logger(NmcliService.name);
  private available: boolean | null = null;

  async assertAvailable(): Promise<void> {
    if (this.available === true) return;
    try {
      await execFileAsync('nmcli', ['-t', '-f', 'RUNNING', 'general'], {
        timeout: 5000,
        maxBuffer: 64 * 1024,
      });
      this.available = true;
    } catch (err) {
      this.available = false;
      this.logger.warn(`NetworkManager غير متاح: ${this.errMsg(err)}`);
      throw new ServiceUnavailableException(
        'NetworkManager غير متاح على الخادم — ثبّت الحزمة network-manager وتأكد أن الخدمة نشطة',
      );
    }
  }

  async run(args: string[], timeoutMs = 20000): Promise<string> {
    await this.assertAvailable();
    try {
      const { stdout } = await execFileAsync('nmcli', args, {
        timeout: timeoutMs,
        maxBuffer: 4 * 1024 * 1024,
      });
      return (stdout ?? '').toString();
    } catch (err) {
      throw new Error(this.errMsg(err));
    }
  }

  /** إخراج `-t` مفصول بحقول `:` مع تهريب `\:` */
  parseRows(stdout: string): string[][] {
    return stdout
      .split('\n')
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => this.splitTerse(line));
  }

  errMsg(err: unknown): string {
    if (!err || typeof err !== 'object') return String(err);
    const e = err as { stderr?: Buffer | string; message?: string };
    const stderr =
      typeof e.stderr === 'string'
        ? e.stderr
        : Buffer.isBuffer(e.stderr)
          ? e.stderr.toString('utf8')
          : '';
    return (stderr || e.message || String(err)).trim().slice(0, 400);
  }

  private splitTerse(line: string): string[] {
    const parts: string[] = [];
    let cur = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '\\' && i + 1 < line.length) {
        cur += line[i + 1];
        i++;
        continue;
      }
      if (ch === ':') {
        parts.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    parts.push(cur);
    return parts;
  }
}
