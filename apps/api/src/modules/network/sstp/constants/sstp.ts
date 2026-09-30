export const SSTP_SETTINGS_ID = 'default';

/** إعداد أولي — يُستخدم فقط عند إنشاء السجل إن لم يوجد */
export const DEFAULT_SSTP_SETTINGS = {
  host: '45.86.229.57',
  username: '771601616',
  password: '771601616',
  certWarn: true,
  tlsExt: true,
  autoConnect: true,
} as const;

export const SSTP_RUNTIME_DIR = '/opt/match/var/sstp';
export const SSTP_PID_FILE = `${SSTP_RUNTIME_DIR}/sstpc.pid`;
export const SSTP_LOG_FILE = `${SSTP_RUNTIME_DIR}/sstpc.log`;
export const SSTP_OPENSSL_CONF = `${SSTP_RUNTIME_DIR}/openssl-sstp.cnf`;
export const SSTP_PRELOAD_SO = `${SSTP_RUNTIME_DIR}/libssl_cipher_preload.so`;
export const SSTP_PRELOAD_SRC =
  '/opt/match/apps/api/src/modules/network/sstp/native/ssl_cipher_preload.c';
export const SSTP_CHAP_SECRETS = '/etc/ppp/chap-secrets';
export const SSTP_CHAP_BEGIN = '# begin isp-sstp';
export const SSTP_CHAP_END = '# end isp-sstp';

/** تأخير قبل أول اتصال تلقائي بعد إقلاع الـ API */
export const SSTP_AUTO_CONNECT_DELAY_MS = 5_000;
/** مراقبة الاتصال وإعادة المحاولة عند الانقطاع */
export const SSTP_AUTO_RETRY_MS = 30_000;
/** تأخير قصير بعد فصل مُكتشف قبل إعادة الاتصال */
export const SSTP_RECONNECT_GRACE_MS = 3_000;
