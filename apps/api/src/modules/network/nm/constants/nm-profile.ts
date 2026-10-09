/** بادئة ملفات الاتصال الدائمة التي تنشئها لوحة الإدارة */
export const NM_MATCH_PREFIX = 'match-';

export function matchConnectionName(ifName: string): string {
  return `${NM_MATCH_PREFIX}${ifName}`;
}

export type NmBackendMode =
  | 'match'
  | 'other'
  | 'unmanaged'
  | 'unavailable'
  | 'none';

export type NmIfaceStatus = {
  available: boolean;
  managed: boolean;
  mode: NmBackendMode;
  connection: string | null;
  matchProfile: string | null;
  persistent: boolean;
  canAdopt: boolean;
};
