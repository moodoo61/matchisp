export type MistStreamPayload = {
  name: string;
  source: string;
  alwaysOn?: boolean;
};

/** إحصومات مدخل الستريم من clients (Current inputs) */
export type MistInputStats = {
  stream: string;
  /** ثوانٍ نشطة — Connected */
  conntime: number;
  /** بايتات محمّلة — Data downloaded */
  down: number;
  /** بايت/ث — Current bitrate = downbps*8 */
  downbps: number;
};

/** حالة القناة كما يعيدها MistServer — online: 1=نشط، 2=غير نشط، 0=متوقف (خطأ فقط عبر حقل error) */
export type MistStreamStatus = {
  name: string;
  configured: boolean;
  online: 0 | 1 | 2 | null;
  error: string | null;
  source: string | null;
  active: boolean;
  viewers: number;
  /** Connected — ثوانٍ من clients.conntime */
  connectedSec: number | null;
  /** Data downloaded — بايت */
  downBytes: number | null;
  /** Current bitrate — بايت/ث (يُعرض ×8 كبت) */
  downBps: number | null;
};

export type MistActiveStreamStats = {
  name: string;
  viewers: number;
  clients: number;
  inputs: number;
  outputs: number;
};

export type MistApiResponse = {
  LTS?: number;
  authorize?: { status?: string };
  active_streams?:
    | string[]
    | Record<string, number[] | Record<string, number>>;
  clients?: {
    time?: number;
    fields?: string[];
    data?: unknown[][];
  };
  streams?: Record<
    string,
    {
      name?: string;
      source?: string;
      online?: number;
      error?: string;
    }
  >;
};
