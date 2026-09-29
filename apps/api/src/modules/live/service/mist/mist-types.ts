export type MistStreamPayload = {
  name: string;
  source: string;
  alwaysOn?: boolean;
};

/** حالة القناة كما يعيدها MistServer — online: 0=خطأ، 1=نشط، 2=غير نشط */
export type MistStreamStatus = {
  name: string;
  configured: boolean;
  online: 0 | 1 | 2 | null;
  error: string | null;
  source: string | null;
  active: boolean;
  viewers: number;
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
