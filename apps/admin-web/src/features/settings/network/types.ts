export type NetworkAddress = {
  family: string;
  local: string;
  prefixlen: number;
  scope: string;
  cidr: string;
};

export type NetworkInterface = {
  ifName: string;
  ifIndex: number;
  mtu: number;
  operState: string;
  /** حالة إدارية — true حتى لو لا يوجد كابل (operState قد يبقى DOWN) */
  adminUp: boolean;
  mac: string | null;
  flags: string[];
  addresses: NetworkAddress[];
  noteLabel: string;
  noteText: string;
  canControl: boolean;
};

export type InterfacesInventory = {
  checkedAt: string;
  interfaces: NetworkInterface[];
};

export type NetworkRoute = {
  destination: string;
  gateway: string | null;
  device: string | null;
  protocol: string | null;
  metric: number | null;
  scope: string | null;
};

export type RoutesInventory = {
  checkedAt: string;
  routes: NetworkRoute[];
};

export type NetworkDnsInfo = {
  mode: string;
  servers: string[];
  search: string[];
  resolvConf: string;
};

export type SstpStatus = {
  id: string;
  host: string;
  username: string;
  passwordSet: boolean;
  certWarn: boolean;
  tlsExt: boolean;
  autoConnect: boolean;
  updatedAt: string;
  connected: boolean;
  clientInstalled: boolean;
  pid: number | null;
  pppInterfaces: Array<{ ifName: string; operState: string }>;
  logTail: string;
  hasCredentials: boolean;
  probe: {
    tcpOk: boolean;
    tlsOk: boolean;
    detail: string;
  };
  mikrotikHint?: string;
};

export function operStateLabel(state: string): string {
  const map: Record<string, string> = {
    UP: 'يعمل',
    DOWN: 'متوقف',
    UNKNOWN: 'غير معروف',
    LOWERLAYERDOWN: 'طبقة سفلى متوقفة',
  };
  return map[state] ?? state;
}

/** تسمية الحالة للمنافذ: إداري أولاً ثم التشغيلي */
export function ifaceStateLabel(row: {
  adminUp: boolean;
  operState: string;
}): string {
  if (!row.adminUp) return 'متوقف';
  if (row.operState === 'UP') return 'يعمل';
  return 'مُشغَّل (بلا وسيط)';
}
