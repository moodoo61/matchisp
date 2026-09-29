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

export function operStateLabel(state: string): string {
  const map: Record<string, string> = {
    UP: 'يعمل',
    DOWN: 'متوقف',
    UNKNOWN: 'غير معروف',
    LOWERLAYERDOWN: 'طبقة سفلى متوقفة',
  };
  return map[state] ?? state;
}
