import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { DEVICE_PATH_RE } from '../constants/disk-safety';
import type { DiskSmartResult } from '../types/disk.types';

const execFileAsync = promisify(execFile);

@Injectable()
export class DisksSmartService {
  private readonly logger = new Logger(DisksSmartService.name);

  async smart(devicePath: string): Promise<DiskSmartResult> {
    const path = devicePath.trim();
    if (!DEVICE_PATH_RE.test(path)) {
      throw new BadRequestException('مسار الجهاز غير صالح');
    }

    try {
      const { stdout } = await execFileAsync(
        'smartctl',
        ['-H', '-A', '-i', '-j', path],
        { timeout: 20000, maxBuffer: 2 * 1024 * 1024 },
      );
      const data = JSON.parse(stdout) as Record<string, unknown>;
      const smartStatus = data.smart_status as
        | { passed?: boolean }
        | undefined;
      const modelName =
        (data.model_name as string | undefined) ??
        (data.scsi_model_name as string | undefined) ??
        null;
      const serial =
        (data.serial_number as string | undefined) ??
        (data.scsi_serial_number as string | undefined) ??
        null;

      let temperatureC: number | null = null;
      const temp = data.temperature as { current?: number } | undefined;
      if (typeof temp?.current === 'number') temperatureC = temp.current;

      let powerOnHours: number | null = null;
      const attrs = data.ata_smart_attributes as
        | {
            table?: Array<{
              id?: number;
              name?: string;
              raw?: { value?: number };
            }>;
          }
        | undefined;
      const poh = attrs?.table?.find(
        (a) => a.id === 9 || a.name === 'Power_On_Hours',
      );
      if (typeof poh?.raw?.value === 'number') powerOnHours = poh.raw.value;

      const passed = smartStatus?.passed ?? null;
      return {
        devicePath: path,
        available: true,
        passed,
        model: modelName,
        serial,
        temperatureC,
        powerOnHours,
        detail:
          passed === true
            ? 'فحص SMART ناجح'
            : passed === false
              ? 'فحص SMART فاشل'
              : 'تعذر تحديد نتيجة SMART',
        raw: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`SMART ${path}: ${msg}`);
      return {
        devicePath: path,
        available: false,
        passed: null,
        model: null,
        serial: null,
        temperatureC: null,
        powerOnHours: null,
        detail: msg.slice(0, 300),
        raw: null,
      };
    }
  }
}
