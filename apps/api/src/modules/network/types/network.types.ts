export type NetworkAddress = {
  family: 'inet' | 'inet6' | string;
  local: string;
  prefixlen: number;
  scope: string;
  /** CIDR مثل 192.168.1.10/24 */
  cidr: string;
};

/** خلفية إدارة المنفذ عبر NetworkManager */
export type NmBackendMode =
  | 'match'
  | 'other'
  | 'unmanaged'
  | 'unavailable'
  | 'none';

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
  /** إدارة عبر ملف match-* الدائم */
  nmMode: NmBackendMode;
  nmManaged: boolean;
  nmConnection: string | null;
  nmMatchProfile: string | null;
  nmPersistent: boolean;
  /** يمكن تحويله للطريقة الجديدة (match + /etc) */
  canAdoptNm: boolean;
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
  /** مصدر قائمة servers المعروضة للضبط */
  source: 'network-manager' | 'systemd-resolved' | 'resolv.conf';
  /** خوادم DNS الفعلية (بدون stub 127.0.0.53) */
  servers: string[];
  search: string[];
  resolvConf: string;
  /** عنوان stub الظاهر في resolv.conf إن وُجد */
  stubResolver: string | null;
  device: string | null;
  connection: string | null;
};
