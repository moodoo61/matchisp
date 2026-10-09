import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { spawn, execFile } from 'child_process';
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
  closeSync,
  chmodSync,
} from 'fs';
import { connect as netConnect } from 'net';
import { promisify } from 'util';
import { AuditService } from '../../../audit/audit.service';
import {
  SSTP_AUTO_CONNECT_DELAY_MS,
  SSTP_AUTO_RETRY_MS,
  SSTP_CHAP_BEGIN,
  SSTP_CHAP_END,
  SSTP_CHAP_SECRETS,
  SSTP_LOG_FILE,
  SSTP_OPENSSL_CONF,
  SSTP_PID_FILE,
  SSTP_PRELOAD_SO,
  SSTP_PRELOAD_SRC,
  SSTP_RECONNECT_GRACE_MS,
  SSTP_RUNTIME_DIR,
} from '../constants/sstp';
import { SstpSettingsService } from './sstp-settings.service';

const execFileAsync = promisify(execFile);

@Injectable()
export class SstpConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SstpConnectionService.name);
  private autoTimer: ReturnType<typeof setTimeout> | null = null;
  private autoRetry: ReturnType<typeof setInterval> | null = null;
  private connecting = false;
  /** true بعد اتصال ناجح — لإعادة المحاولة السريعة عند السقوط */
  private wasConnected = false;
  private consecutiveFailures = 0;

  constructor(
    private readonly settings: SstpSettingsService,
    private readonly audit: AuditService,
  ) {
    this.ensureRuntimeDir();
    this.ensureOpensslConf();
    this.ensurePreloadLibrary();
  }

  onModuleInit() {
    this.autoTimer = setTimeout(() => {
      void this.tryAutoConnect('startup');
    }, SSTP_AUTO_CONNECT_DELAY_MS);
    this.autoRetry = setInterval(() => {
      void this.tryAutoConnect('retry');
    }, SSTP_AUTO_RETRY_MS);
  }

  onModuleDestroy() {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    if (this.autoRetry) clearInterval(this.autoRetry);
    this.autoTimer = null;
    this.autoRetry = null;
  }

  async status() {
    const cfg = await this.settings.get();
    const secrets = await this.settings.getSecrets();
    const connected = await this.isProcessRunning();
    const pppIfaces = await this.listPppInterfaces();
    const clientInstalled = await this.isSstpcInstalled();
    const probe = await this.probeHost(secrets.host);

    return {
      ...cfg,
      connected,
      clientInstalled,
      pid: this.readPid(),
      pppInterfaces: pppIfaces,
      logTail: this.readLogTail(40),
      hasCredentials: Boolean(
        secrets.host && secrets.username && secrets.password,
      ),
      probe,
      mikrotikHint:
        'MikroTik: تأكد أن certificate معيّن في sstp-server، والمستخدم ضمن بروفايل VPN.',
    };
  }

  async connect(actorId: string | null) {
    if (this.connecting) {
      throw new BadRequestException('جاري محاولة الاتصال حالياً');
    }
    this.connecting = true;
    try {
      return await this.connectInternal(actorId);
    } finally {
      this.connecting = false;
    }
  }

  async disconnect(actorId: string | null) {
    const pid = this.readPid();
    let killed = false;

    if (pid) {
      try {
        process.kill(pid, 'SIGTERM');
        killed = true;
      } catch {
        /* already dead */
      }
    }

    try {
      await execFileAsync('pkill', ['-f', 'sstpc'], { timeout: 5000 });
      killed = true;
    } catch {
      /* no matching process */
    }

    this.clearStalePid();

    await this.audit.log({
      actorId,
      action: 'disconnect',
      resource: 'network.sstp',
      resourceId: 'default',
      metadata: { pid, killed },
    });

    await new Promise((r) => setTimeout(r, 500));
    return this.status();
  }

  private async tryAutoConnect(reason: string) {
    try {
      const row = await this.settings.getSecrets();
      if (!row.autoConnect) return;
      if (!(await this.isSstpcInstalled())) return;
      if (!row.host || !row.username || !row.password) return;

      const up = await this.isProcessRunning();
      if (up) {
        this.wasConnected = true;
        this.consecutiveFailures = 0;
        return;
      }

      // انقطع بعد اتصال سابق → انتظر قليلاً ثم أعد المحاولة
      if (this.wasConnected && reason === 'retry') {
        this.logger.warn('SSTP انقطع — جدولة إعادة اتصال');
        this.wasConnected = false;
        await new Promise((r) => setTimeout(r, SSTP_RECONNECT_GRACE_MS));
        if (await this.isProcessRunning()) return;
        if (!(await this.settings.getSecrets()).autoConnect) return;
      }

      // تباعد أطول بعد فشلين متتاليين لتقليل الضغط على الخادم
      if (this.consecutiveFailures >= 2 && reason === 'retry') {
        const backoff = Math.min(
          this.consecutiveFailures * 15_000,
          120_000,
        );
        this.logger.log(
          `SSTP تأجيل إعادة المحاولة ${backoff}ms (فشل×${this.consecutiveFailures})`,
        );
        await new Promise((r) => setTimeout(r, backoff));
        if (await this.isProcessRunning()) return;
        if (!(await this.settings.getSecrets()).autoConnect) return;
      }

      this.logger.log(`SSTP اتصال تلقائي (${reason}) → ${row.host}`);
      await this.connect(null);
      this.wasConnected = true;
      this.consecutiveFailures = 0;
    } catch (err) {
      this.consecutiveFailures += 1;
      this.logger.warn(
        `SSTP اتصال تلقائي فشل (#${this.consecutiveFailures}): ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }

  private async connectInternal(actorId: string | null) {
    if (!(await this.isSstpcInstalled())) {
      throw new BadRequestException(
        'حزمة sstp-client غير مثبتة. ثبّتها: apt install sstp-client',
      );
    }

    this.ensureRuntimeDir();
    this.ensureOpensslConf();
    await this.ensurePreloadBuilt();

    const row = await this.settings.getSecrets();
    if (!row.host?.trim() || !row.username?.trim() || !row.password) {
      throw new BadRequestException(
        'أكمل إعدادات المضيف واسم المستخدم وكلمة المرور أولاً',
      );
    }
    this.settings.syncBootEnv(row);

    if (await this.isProcessRunning()) {
      return this.status();
    }

    const probe = await this.probeHost(row.host.trim());
    if (!probe.tcpOk) {
      throw new BadRequestException(
        `لا يمكن الوصول إلى ${row.host}:443 — ${probe.detail}`,
      );
    }

    this.syncChapSecrets(row.username, row.password);
    this.clearStalePid();

    // عميل MikroTik: لا نطلب مصادقة عكسية من الخادم (forbid require-mschap-v2)
    const args = [
      ...(row.certWarn ? ['--cert-warn'] : []),
      ...(row.tlsExt ? ['--tls-ext'] : []),
      '--log-stderr',
      '--log-level',
      '2',
      '--user',
      row.username,
      '--password',
      row.password,
      row.host.trim(),
      '--',
      'noauth',
      'refuse-eap',
      'usepeerdns',
      'nodefaultroute',
    ];

    try {
      writeFileSync(
        SSTP_LOG_FILE,
        `\n--- connect ${new Date().toISOString()} ${row.host} ---\n`,
        { flag: 'a' },
      );
    } catch {
      /* ignore */
    }

    const logFd = openSync(SSTP_LOG_FILE, 'a');
    const child = spawn('sstpc', args, {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env: {
        ...process.env,
        OPENSSL_CONF: SSTP_OPENSSL_CONF,
        LD_PRELOAD: [
          SSTP_PRELOAD_SO,
          process.env.LD_PRELOAD || '',
        ]
          .filter(Boolean)
          .join(':'),
      },
    });
    closeSync(logFd);

    if (!child.pid) {
      throw new BadRequestException('تعذر بدء عملية sstpc');
    }

    writeFileSync(SSTP_PID_FILE, String(child.pid), 'utf8');
    child.unref();

    await this.audit.log({
      actorId,
      action: 'connect',
      resource: 'network.sstp',
      resourceId: row.id,
      metadata: {
        host: row.host,
        username: row.username,
        pid: child.pid,
        auto: actorId == null,
      },
    });

    this.logger.warn(`بدء sstpc pid=${child.pid} host=${row.host}`);

    await new Promise((r) => setTimeout(r, 3500));
    const stillUp = await this.isProcessRunning();
    if (!stillUp) {
      const tail = this.readLogTail(30);
      const hint = this.explainFailure(tail, probe);
      throw new BadRequestException(
        `فشل الاتصال بـ SSTP. ${hint}${tail ? `\nالسجل:\n${tail}` : ''}`,
      );
    }

    return this.status();
  }

  private explainFailure(
    logTail: string,
    probe: { tcpOk: boolean; tlsOk: boolean; detail: string },
  ): string {
    if (/unrecognized option/i.test(logTail)) {
      return 'خيار pppd غير مدعوم على هذا النظام — راجع سجل الاتصال.';
    }
    if (
      /HTTP handshake with server failed|Unrecoverable socket error/i.test(
        logTail,
      ) ||
      !probe.tlsOk
    ) {
      return (
        'لا يوجد تشفير مشترك / فشل TLS. على MikroTik قيمة certificate=none تسبب ذلك. ' +
        'أنشئ شهادة وعيّنها: /certificate add name=sstp-cert common-name=45.86.229.57; ' +
        '/certificate sign sstp-cert; /interface sstp-server server set certificate=sstp-cert'
      );
    }
    if (
      /Failed to get peer certificate|CRYPTO BIND|Connection was aborted/i.test(
        logTail,
      )
    ) {
      return (
        'الخادم بلا شهادة صالحة لـ Crypto Binding. عيّن certificate في sstp-server على MikroTik.'
      );
    }
    if (/suitable secret|required to authenticate|refused to authenticate/i.test(
      logTail,
    )) {
      return 'فشل مصادقة PPP — تحقق من المستخدم/كلمة المرور في بروفايل VPN على MikroTik.';
    }
    if (/CHAP authentication succeeded|Connection Established/i.test(logTail)) {
      return 'الاتصال نجح.';
    }
    return probe.detail || 'راجع السجل أدناه.';
  }

  private syncChapSecrets(username: string, password: string) {
    const user = username.replace(/\s+/g, '');
    const pass = password.replace(/"/g, '');
    const block = [
      SSTP_CHAP_BEGIN,
      `${user} * ${pass} *`,
      `* * ${pass} *`,
      SSTP_CHAP_END,
      '',
    ].join('\n');

    let current = '';
    try {
      current = readFileSync(SSTP_CHAP_SECRETS, 'utf8');
    } catch {
      current = '# Secrets for authentication using CHAP\n';
    }

    const begin = current.indexOf(SSTP_CHAP_BEGIN);
    const end = current.indexOf(SSTP_CHAP_END);
    if (begin >= 0 && end > begin) {
      const afterEnd = end + SSTP_CHAP_END.length;
      current =
        current.slice(0, begin) + block + current.slice(afterEnd).replace(/^\n/, '');
    } else {
      current = `${current.trimEnd()}\n\n${block}`;
    }
    writeFileSync(SSTP_CHAP_SECRETS, current, 'utf8');
    try {
      chmodSync(SSTP_CHAP_SECRETS, 0o600);
    } catch {
      /* ignore */
    }
  }

  private ensureOpensslConf() {
    if (existsSync(SSTP_OPENSSL_CONF)) return;
    writeFileSync(
      SSTP_OPENSSL_CONF,
      `openssl_conf = openssl_init
[openssl_init]
providers = provider_sect
ssl_conf = ssl_sect
[provider_sect]
default = default_sect
legacy = legacy_sect
[default_sect]
activate = 1
[legacy_sect]
activate = 1
[ssl_sect]
system_default = system_default_sect
[system_default_sect]
MinProtocol = TLSv1
MaxProtocol = TLSv1.2
CipherString = AES256-SHA:AES256-GCM-SHA384:AES128-SHA:ADH-AES256-SHA:ALL:@SECLEVEL=0
Ciphersuites =
`,
      'utf8',
    );
  }

  private ensurePreloadLibrary() {
    if (existsSync(SSTP_PRELOAD_SO)) return;
    if (!existsSync(SSTP_PRELOAD_SRC)) {
      this.logger.warn(`ملف المصدر غير موجود: ${SSTP_PRELOAD_SRC}`);
      return;
    }
    try {
      execFile(
        'cc',
        ['-shared', '-fPIC', '-O2', '-o', SSTP_PRELOAD_SO, SSTP_PRELOAD_SRC, '-ldl'],
        { timeout: 30000 },
        (err) => {
          if (err) {
            this.logger.warn(`فشل بناء preload: ${err.message}`);
          }
        },
      );
    } catch (err) {
      this.logger.warn(
        `تعذر بناء preload: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async ensurePreloadBuilt(): Promise<void> {
    if (existsSync(SSTP_PRELOAD_SO)) return;
    if (!existsSync(SSTP_PRELOAD_SRC)) return;
    await execFileAsync(
      'cc',
      ['-shared', '-fPIC', '-O2', '-o', SSTP_PRELOAD_SO, SSTP_PRELOAD_SRC, '-ldl'],
      { timeout: 30000 },
    );
  }

  private async probeHost(host: string): Promise<{
    tcpOk: boolean;
    tlsOk: boolean;
    detail: string;
  }> {
    const target = host?.trim();
    if (!target) {
      return { tcpOk: false, tlsOk: false, detail: 'المضيف فارغ' };
    }

    const tcpOk = await new Promise<boolean>((resolve) => {
      const socket = netConnect({ host: target, port: 443, timeout: 4000 });
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => resolve(false));
      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });

    if (!tcpOk) {
      return {
        tcpOk: false,
        tlsOk: false,
        detail: `تعذر فتح TCP إلى ${target}:443`,
      };
    }

    try {
      this.ensureOpensslConf();
      let stdout = '';
      let stderr = '';
      try {
        const res = await execFileAsync(
          'openssl',
          [
            's_client',
            '-connect',
            `${target}:443`,
            '-servername',
            target,
            '-tls1_2',
            '-cipher',
            'AES256-SHA:AES256-GCM-SHA384:ALL:@SECLEVEL=0',
          ],
          {
            timeout: 6000,
            maxBuffer: 256 * 1024,
            env: { ...process.env, OPENSSL_CONF: SSTP_OPENSSL_CONF },
          },
        );
        stdout = res.stdout;
        stderr = res.stderr;
      } catch (err) {
        // openssl يخرج بفشل عند شهادة ذاتية رغم نجاح المصافحة
        const e = err as { stdout?: string; stderr?: string };
        stdout = e.stdout ?? '';
        stderr = e.stderr ?? '';
      }
      const text = `${stdout}\n${stderr}`;
      if (/Cipher is/i.test(text) && !/Cipher is \(NONE\)/i.test(text)) {
        const anon = /ADH-/i.test(text);
        const selfSigned = /self-signed|Verify return code:\s*18/i.test(text);
        return {
          tcpOk: true,
          tlsOk: true,
          detail: anon
            ? 'TLS بتشفير مجهول (ADH) — عيّن certificate على MikroTik'
            : selfSigned
              ? 'TLS ناجح (شهادة ذاتية — طبيعي مع MikroTik)'
              : 'TCP وTLS متاحان',
        };
      }
      return {
        tcpOk: true,
        tlsOk: false,
        detail:
          'TCP مفتوح لكن TLS يفشل (تحقق من certificate على sstp-server)',
      };
    } catch {
      return {
        tcpOk: true,
        tlsOk: false,
        detail:
          'TCP مفتوح لكن TLS يفشل (تحقق من certificate على sstp-server)',
      };
    }
  }
  private ensureRuntimeDir() {
    if (!existsSync(SSTP_RUNTIME_DIR)) {
      mkdirSync(SSTP_RUNTIME_DIR, { recursive: true });
    }
  }

  private readPid(): number | null {
    try {
      if (!existsSync(SSTP_PID_FILE)) return null;
      const n = Number(readFileSync(SSTP_PID_FILE, 'utf8').trim());
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  }

  private clearStalePid() {
    try {
      if (existsSync(SSTP_PID_FILE)) unlinkSync(SSTP_PID_FILE);
    } catch {
      /* ignore */
    }
  }

  private async isProcessRunning(): Promise<boolean> {
    const pid = this.readPid();
    if (pid) {
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        this.clearStalePid();
      }
    }

    try {
      const { stdout } = await execFileAsync('pgrep', ['-f', 'sstpc'], {
        timeout: 3000,
      });
      return Boolean(stdout.trim());
    } catch {
      return false;
    }
  }

  private async isSstpcInstalled(): Promise<boolean> {
    try {
      await execFileAsync('which', ['sstpc'], { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  private async listPppInterfaces(): Promise<
    Array<{ ifName: string; operState: string }>
  > {
    try {
      const { stdout } = await execFileAsync('ip', ['-j', 'link'], {
        timeout: 5000,
        maxBuffer: 2 * 1024 * 1024,
      });
      const list = JSON.parse(stdout) as Array<{
        ifname?: string;
        operstate?: string;
        link_type?: string;
      }>;
      return list
        .filter(
          (i) =>
            i.link_type === 'ppp' || (i.ifname ?? '').startsWith('ppp'),
        )
        .map((i) => ({
          ifName: i.ifname ?? '',
          operState: i.operstate ?? 'unknown',
        }));
    } catch {
      return [];
    }
  }

  private readLogTail(lines: number): string {
    try {
      if (!existsSync(SSTP_LOG_FILE)) return '';
      const text = readFileSync(SSTP_LOG_FILE, 'utf8');
      return text.split('\n').slice(-lines).join('\n').trim();
    } catch {
      return '';
    }
  }
}
