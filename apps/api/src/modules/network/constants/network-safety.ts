/** منافذ محمية — لا تُطفأ ولا تُحذف عنونتها عبر الواجهة */
export const PROTECTED_IFACES = new Set(['lo']);

export const IFACE_NAME_RE = /^[A-Za-z0-9_.:-]{1,32}$/;

export const IPV4_CIDR_RE =
  /^(?:\d{1,3}\.){3}\d{1,3}\/(?:[0-9]|[12][0-9]|3[0-2])$/;

export const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;
