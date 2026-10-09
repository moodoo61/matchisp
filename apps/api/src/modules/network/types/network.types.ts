export type NetworkAddress = {
  family: 'inet' | 'inet6' | string;
  local: string;
  prefixlen: number;
  scope: string;
  /** CIDR مثل 192.168.1.10/24 */
  cidr: string;
};

export type NetworkInterface = {
  ifName: string;
  ifIndex: number;
  mtu: number;
  operState: string;
  /** حالة إدارية من flags (UP) — مستقلة عن وجود حامل/كابل */
  adminUp: boolean;
  mac: string | null;
  flags: string[];
  addresses: NetworkAddress[];
  noteLabel: string;
  noteText: string;
  canControl: boolean;
};

export type NetworkRoute = {
  destination: string;
  gateway: string | null;
  device: string | null;
  protocol: string | null;
  metric: number | null;
  scope: string | null;
};

export type NetworkDnsInfo = {
  mode: string;
  servers: string[];
  search: string[];
  resolvConf: string;
};
