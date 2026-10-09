/** منافذ محمية — لا تُطفأ ولا تُحذف عنونتها عبر الواجهة */
export const PROTECTED_IFACES = new Set(['lo']);

export const IFACE_NAME_RE = /^[A-Za-z0-9_.:-]{1,32}$/;

export const IPV4_CIDR_RE =
  /^(?:\d{1,3}\.){3}\d{1,3}\/(?:[0-9]|[12][0-9]|3[0-2])$/;

export const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;

/** نطاق بحث DNS بسيط (مثلlan.local أو example.com) */
export const DNS_SEARCH_RE = /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)(?:\.(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?))*$/;

/** عناوين stub لـ systemd-resolved — ليست خوادم DNS حقيقية للضبط */
export const DNS_STUB_SERVERS = new Set(['127.0.0.53', '127.0.0.54']);
