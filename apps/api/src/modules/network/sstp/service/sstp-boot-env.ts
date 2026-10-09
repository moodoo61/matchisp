import { chmodSync, mkdirSync, writeFileSync } from 'fs';
import { SSTP_BOOT_ENV, SSTP_RUNTIME_DIR } from '../constants/sstp';

export type SstpBootRow = {
  host: string;
  username: string;
  password: string;
  certWarn: boolean;
  tlsExt: boolean;
  autoConnect: boolean;
};

/**
 * يكتب boot.env لخدمة match-sstp المستقلة عن Node/Postgres.
 * الصلاحيات 0600 — يحتوي كلمة المرور.
 */
export function writeSstpBootEnv(row: SstpBootRow): void {
  mkdirSync(SSTP_RUNTIME_DIR, { recursive: true });
  const body = [
    `# Managed by ISP Admin — used by match-sstp.service`,
    `AUTO_CONNECT=${row.autoConnect ? '1' : '0'}`,
    `HOST=${shellEscape(row.host.trim())}`,
    `USERNAME=${shellEscape(row.username.trim())}`,
    `PASSWORD=${shellEscape(row.password)}`,
    `CERT_WARN=${row.certWarn ? '1' : '0'}`,
    `TLS_EXT=${row.tlsExt ? '1' : '0'}`,
    '',
  ].join('\n');
  writeFileSync(SSTP_BOOT_ENV, body, { encoding: 'utf8', mode: 0o600 });
  try {
    chmodSync(SSTP_BOOT_ENV, 0o600);
  } catch {
    /* ignore */
  }
}

function shellEscape(value: string): string {
  // قيم بسيطة بدون أسطر؛ نغلّف بعلامات اقتباس مفردة مع تهريب
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
