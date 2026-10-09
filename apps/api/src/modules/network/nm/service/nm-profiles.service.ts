import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { IFACE_NAME_RE, PROTECTED_IFACES } from '../../constants/network-safety';
import {
  matchConnectionName,
  NM_MATCH_PREFIX,
  type NmIfaceStatus,
} from '../constants/nm-profile';
import { NmManagedConfService } from './nm-managed-conf.service';
import { NmcliService } from './nmcli.service';

const execFileAsync = promisify(execFile);

type DeviceRow = {
  device: string;
  type: string;
  state: string;
  connection: string;
};

type ConnectionRow = {
  name: string;
  uuid: string;
  type: string;
  device: string;
  filename: string;
};

/**
 * ملفات اتصال NetworkManager الدائمة للمنافذ.
 * يضمن أن إعدادات التشغيل والعنونة تبقى بعد إعادة التشغيل.
 */
@Injectable()
export class NmProfilesService {
  private readonly logger = new Logger(NmProfilesService.name);

  constructor(
    private readonly nmcli: NmcliService,
    private readonly managedConf: NmManagedConfService,
  ) {}

  assertControllable(ifName: string) {
    if (!IFACE_NAME_RE.test(ifName)) {
      throw new BadRequestException('اسم المنفذ غير صالح');
    }
    if (PROTECTED_IFACES.has(ifName)) {
      throw new BadRequestException(`المنفذ المحمي لا يمكن تعديله: ${ifName}`);
    }
  }

  /**
   * يعيد دائماً ملف الاتصال الدائم match-<iface> فقط
   * (لا يعيد استخدام اتصالات netplan/الأخرى).
   */
  async ensureProfile(ifName: string): Promise<string> {
    this.assertControllable(ifName);
    await this.nmcli.assertAvailable();
    await this.ensureManaged(ifName);

    const conName = matchConnectionName(ifName);
    const existing = await this.findMatchConnection(ifName);
    if (existing) {
      await this.nmcli.run([
        'connection',
        'modify',
        existing,
        'connection.interface-name',
        ifName,
        'connection.id',
        conName,
      ]);
      return existing;
    }

    const liveCidrs = await this.readLiveIpv4Cidrs(ifName);
    const addArgs = [
      'connection',
      'add',
      'type',
      'ethernet',
      'ifname',
      ifName,
      'con-name',
      conName,
      'connection.autoconnect',
      'yes',
      'ipv6.method',
      'ignore',
    ];
    if (liveCidrs.length > 0) {
      addArgs.push(
        'ipv4.method',
        'manual',
        'ipv4.addresses',
        liveCidrs.join(','),
      );
    } else {
      addArgs.push('ipv4.method', 'disabled');
    }

    await this.nmcli.run(addArgs);
    this.logger.log(`أُنشئ ملف اتصال دائم: ${conName} ← ${ifName}`);
    return conName;
  }

  /** حالة إدارة NM لكل المنافذ (للواجهة) */
  async statusByIface(): Promise<Map<string, NmIfaceStatus>> {
    const map = new Map<string, NmIfaceStatus>();
    try {
      await this.nmcli.assertAvailable();
    } catch {
      return map;
    }

    const [devices, cons] = await Promise.all([
      this.listDevices(),
      this.listConnections(),
    ]);

    for (const d of devices) {
      map.set(d.device, this.buildStatus(d, cons));
    }
    return map;
  }

  /**
   * ترحيل المنفذ إلى ملف match-* الدائم تحت /etc
   * مع نسخ العناوين/البوابة/DNS من الاتصال الحالي أو الحالة الحية.
   */
  async adoptMatchProfile(ifName: string): Promise<{
    connection: string;
    addresses: string[];
    persistent: boolean;
  }> {
    this.assertControllable(ifName);
    await this.nmcli.assertAvailable();
    await this.ensureManaged(ifName);

    const foreign = await this.findForeignConnection(ifName);
    const liveCidrs = await this.readLiveIpv4Cidrs(ifName);
    let addresses = liveCidrs;
    let gateway: string | null = null;
    let dns: string[] = [];
    let dnsSearch: string[] = [];

    if (foreign) {
      const fromCon = await this.getIpv4Addresses(foreign);
      addresses = uniqueCidrs([...fromCon, ...liveCidrs]);
      gateway = await this.getIpv4Gateway(foreign);
      dns = await this.getIpv4Dns(foreign);
      dnsSearch = await this.getIpv4DnsSearch(foreign);
    }

    const con = await this.ensureProfile(ifName);
    const args = [
      'connection',
      'modify',
      con,
      'connection.interface-name',
      ifName,
      'connection.autoconnect',
      'yes',
      'ipv6.method',
      'ignore',
    ];
    if (addresses.length > 0) {
      args.push(
        'ipv4.method',
        'manual',
        'ipv4.addresses',
        addresses.join(','),
      );
      if (gateway) args.push('ipv4.gateway', gateway);
    } else {
      args.push('ipv4.method', 'disabled', 'ipv4.addresses', '');
    }
    if (dns.length) {
      args.push('ipv4.ignore-auto-dns', 'yes', 'ipv4.dns', dns.join(','));
    }
    if (dnsSearch.length) {
      args.push('ipv4.dns-search', dnsSearch.join(','));
    }
    await this.nmcli.run(args);

    // أوقف الاعتماد على الاتصال القديم (netplan/غيره) إن أمكن
    if (foreign && foreign !== con) {
      await this.nmcli
        .run([
          'connection',
          'modify',
          foreign,
          'connection.autoconnect',
          'no',
        ])
        .catch((err) => {
          this.logger.debug(
            `تعذر تعطيل autoconnect لـ ${foreign}: ${this.nmcli.errMsg(err)}`,
          );
        });
    }

    await this.activate(con, ifName);

    const persistent = await this.isPersistentConnection(con);
    if (!persistent) {
      this.logger.warn(
        `الاتصال ${con} ليس تحت /etc/NetworkManager/system-connections — قد لا يثبت بعد الإقلاع`,
      );
    }

    return { connection: con, addresses, persistent };
  }

  async setState(ifName: string, state: 'up' | 'down'): Promise<void> {
    const con = await this.ensureProfile(ifName);
    if (state === 'up') {
      await this.nmcli.run([
        'connection',
        'modify',
        con,
        'connection.autoconnect',
        'yes',
      ]);
      await this.activate(con, ifName);
      if (!(await this.isAdminUp(ifName))) {
        throw new BadRequestException(
          `تعذر تشغيل المنفذ ${ifName} — تحقق أن NetworkManager يدير الجهاز وأن الكابل متصل إن لزم`,
        );
      }
      return;
    }

    await this.nmcli.run([
      'connection',
      'modify',
      con,
      'connection.autoconnect',
      'no',
    ]);
    try {
      await this.nmcli.run(['device', 'disconnect', ifName], 20000);
    } catch (err) {
      this.logger.debug(`device disconnect ${ifName}: ${this.nmcli.errMsg(err)}`);
      await this.nmcli.run(['connection', 'down', con], 20000).catch(
        () => undefined,
      );
    }
    // تأكيد الإطفاء الإداري إن بقي الرابط مرفوعاً
    if (await this.isAdminUp(ifName)) {
      await execFileAsync('ip', ['link', 'set', 'dev', ifName, 'down'], {
        timeout: 10000,
        maxBuffer: 64 * 1024,
      }).catch((err) => {
        this.logger.warn(
          `ip link down ${ifName}: ${this.nmcli.errMsg(err)}`,
        );
      });
    }
  }

  async addAddress(ifName: string, cidr: string): Promise<void> {
    const con = await this.ensureProfile(ifName);
    const current = await this.getIpv4Addresses(con);
    const live = await this.readLiveIpv4Cidrs(ifName);
    const merged = uniqueCidrs([...current, ...live, cidr]);
    await this.applyIpv4(con, ifName, merged);
  }

  async removeAddress(ifName: string, cidr: string): Promise<void> {
    const con = await this.ensureProfile(ifName);
    const current = await this.getIpv4Addresses(con);
    const live = await this.readLiveIpv4Cidrs(ifName);
    const base = uniqueCidrs([...current, ...live]);
    const next = base.filter((c) => c !== cidr.trim());
    if (next.length === base.length) {
      throw new BadRequestException(`العنوان غير موجود على ${ifName}: ${cidr}`);
    }
    await this.applyIpv4(con, ifName, next);
  }

  async setDns(
    servers: string[],
    search: string[],
    device: string | undefined,
  ): Promise<{ device: string; connection: string }> {
    const ifName = device?.trim() || (await this.inferNmManagedDevice());
    if (!ifName) {
      throw new BadRequestException(
        'حدّد منفذ الجهاز لـ DNS — تعذر اكتشاف منفذ تحت NetworkManager',
      );
    }
    this.assertControllable(ifName);
    const con = await this.ensureProfile(ifName);
    const addresses = uniqueCidrs([
      ...(await this.getIpv4Addresses(con)),
      ...(await this.readLiveIpv4Cidrs(ifName)),
    ]);

    const args = [
      'connection',
      'modify',
      con,
      'ipv4.ignore-auto-dns',
      'yes',
      'ipv4.dns',
      servers.join(','),
      'ipv4.dns-search',
      search.join(','),
      'connection.autoconnect',
      'yes',
    ];
    if (addresses.length > 0) {
      const gateway = await this.getIpv4Gateway(con);
      args.push('ipv4.method', 'manual', 'ipv4.addresses', addresses.join(','));
      if (gateway) args.push('ipv4.gateway', gateway);
    }
    await this.nmcli.run(args);
    await this.reapply(con, ifName);
    return { device: ifName, connection: con };
  }

  /** قراءة DNS المضبوط على ملف NM (وليس stub 127.0.0.53) */
  async getConfiguredDns(device?: string): Promise<{
    device: string | null;
    connection: string | null;
    servers: string[];
    search: string[];
  }> {
    try {
      await this.nmcli.assertAvailable();
    } catch {
      return { device: null, connection: null, servers: [], search: [] };
    }

    const ifName = device?.trim() || (await this.inferNmManagedDevice());
    if (!ifName) {
      return { device: null, connection: null, servers: [], search: [] };
    }

    const match = await this.findMatchConnection(ifName);
    const foreign = await this.findForeignConnection(ifName);
    const con = match ?? foreign;
    if (!con) {
      return {
        device: ifName,
        connection: null,
        servers: [],
        search: [],
      };
    }

    return {
      device: ifName,
      connection: con,
      servers: await this.getIpv4Dns(con),
      search: await this.getIpv4DnsSearch(con),
    };
  }

  async setDefaultGateway(
    gateway: string,
    device: string | undefined,
  ): Promise<{ device: string; connection: string }> {
    const ifName = device?.trim() || (await this.inferDefaultDevice());
    if (!ifName) {
      throw new BadRequestException(
        'حدّد منفذ الجهاز للمسار الافتراضي — تعذر اكتشافه تلقائياً',
      );
    }
    this.assertControllable(ifName);
    const con = await this.ensureProfile(ifName);
    const addresses = uniqueCidrs([
      ...(await this.getIpv4Addresses(con)),
      ...(await this.readLiveIpv4Cidrs(ifName)),
    ]);
    if (addresses.length === 0) {
      throw new BadRequestException(
        `المنفذ ${ifName} بلا عنوان IPv4 — أضف عنونة قبل ضبط البوابة`,
      );
    }

    await this.nmcli.run([
      'connection',
      'modify',
      con,
      'ipv4.method',
      'manual',
      'ipv4.addresses',
      addresses.join(','),
      'ipv4.gateway',
      gateway.trim(),
      'ipv4.never-default',
      'no',
      'connection.autoconnect',
      'yes',
    ]);
    await this.reapply(con, ifName);
    return { device: ifName, connection: con };
  }

  private async applyIpv4(
    con: string,
    ifName: string,
    cidrs: string[],
  ): Promise<void> {
    if (cidrs.length === 0) {
      await this.nmcli.run([
        'connection',
        'modify',
        con,
        'ipv4.method',
        'disabled',
        'ipv4.addresses',
        '',
        'ipv4.gateway',
        '',
        'connection.autoconnect',
        'yes',
      ]);
    } else {
      const gateway = await this.getIpv4Gateway(con);
      const args = [
        'connection',
        'modify',
        con,
        'ipv4.method',
        'manual',
        'ipv4.addresses',
        cidrs.join(','),
        'connection.autoconnect',
        'yes',
      ];
      if (gateway) {
        args.push('ipv4.gateway', gateway);
      }
      await this.nmcli.run(args);
    }
    await this.reapply(con, ifName);
  }

  private async reapply(con: string, ifName: string): Promise<void> {
    const devices = await this.listDevices();
    const row = devices.find((d) => d.device === ifName);
    const connected =
      !!row &&
      (row.state === 'connected' ||
        row.state.startsWith('connected') ||
        (row.connection.length > 0 && row.state !== 'unmanaged'));

    if (connected) {
      try {
        await this.nmcli.run(['device', 'reapply', ifName], 20000);
        return;
      } catch (err) {
        this.logger.debug(
          `device reapply ${ifName}: ${this.nmcli.errMsg(err)}`,
        );
      }
    }
    await this.activate(con, ifName);
  }

  /** تفعيل الاتصال فعلياً (device connect ثم connection up) */
  private async activate(con: string, ifName: string): Promise<void> {
    await this.ensureManaged(ifName);
    const errors: string[] = [];

    try {
      await this.nmcli.run(['device', 'connect', ifName], 30000);
      if (await this.isAdminUp(ifName)) return;
    } catch (err) {
      errors.push(`device connect: ${this.nmcli.errMsg(err)}`);
    }

    try {
      await this.nmcli.run(['connection', 'up', con], 30000);
      if (await this.isAdminUp(ifName)) return;
    } catch (err) {
      errors.push(`connection up: ${this.nmcli.errMsg(err)}`);
    }

    // انتظار قصير لحالة الجهاز بعد أوامر NM
    await sleep(800);
    if (await this.isAdminUp(ifName)) return;

    if (errors.length) {
      throw new BadRequestException(errors.join(' | '));
    }
  }

  private async isAdminUp(ifName: string): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync(
        'ip',
        ['-j', 'link', 'show', 'dev', ifName],
        { timeout: 8000, maxBuffer: 1024 * 1024 },
      );
      const parsed = JSON.parse(stdout) as Array<{ flags?: string[] }>;
      return (parsed[0]?.flags ?? []).includes('UP');
    } catch {
      return false;
    }
  }

  private async ensureManaged(ifName: string): Promise<void> {
    const devices = await this.listDevices();
    const row = devices.find((d) => d.device === ifName);
    if (!row) {
      throw new BadRequestException(`المنفذ غير موجود: ${ifName}`);
    }
    await this.managedConf.ensureManagedPersistent(ifName);
    // دائماً نؤكد managed — القائمة قد تكون قديمة قبل reload
    try {
      await this.nmcli.run(['device', 'set', ifName, 'managed', 'yes']);
    } catch (err) {
      if (row.state === 'unmanaged') {
        throw new BadRequestException(
          `تعذر جعل ${ifName} تحت إدارة NetworkManager: ${this.nmcli.errMsg(err)}`,
        );
      }
      this.logger.debug(
        `device set managed ${ifName}: ${this.nmcli.errMsg(err)}`,
      );
    }
  }

  private buildStatus(
    device: DeviceRow,
    cons: ConnectionRow[],
  ): NmIfaceStatus {
    const matchName = matchConnectionName(device.device);
    const matchCon = cons.find((c) => c.name === matchName) ?? null;
    const persistent = matchCon
      ? isEtcNmConnection(matchCon.filename)
      : false;
    const active = device.connection || null;
    const managed = device.state !== 'unmanaged';

    let mode: NmIfaceStatus['mode'];
    if (!managed) {
      mode = 'unmanaged';
    } else if (active?.startsWith(NM_MATCH_PREFIX)) {
      mode = 'match';
    } else if (matchCon && persistent) {
      // ملف دائم موجود لكن جهاز عليه اتصال آخر (netplan) أو غير مفعّل بعد
      mode = active && !active.startsWith(NM_MATCH_PREFIX) ? 'other' : 'match';
    } else if (active) {
      mode = 'other';
    } else {
      mode = 'none';
    }

    const canAdopt =
      managed &&
      !PROTECTED_IFACES.has(device.device) &&
      !(mode === 'match' && persistent && active?.startsWith(NM_MATCH_PREFIX));

    return {
      available: true,
      managed,
      mode,
      connection: active,
      matchProfile: matchCon?.name ?? null,
      persistent,
      canAdopt,
    };
  }

  private async findMatchConnection(ifName: string): Promise<string | null> {
    const preferred = matchConnectionName(ifName);
    const cons = await this.listConnections();
    const byName = cons.find((c) => c.name === preferred);
    return byName?.name ?? null;
  }

  private async findForeignConnection(ifName: string): Promise<string | null> {
    const preferred = matchConnectionName(ifName);
    const cons = await this.listConnections();
    const onDevice = cons.find(
      (c) => c.device === ifName && c.name !== preferred,
    );
    if (onDevice) return onDevice.name;

    for (const c of cons) {
      if (c.name === preferred) continue;
      if (!c.type.includes('ethernet') && c.type !== '802-3-ethernet') {
        continue;
      }
      try {
        const iface = (
          await this.nmcli.run([
            '-g',
            'connection.interface-name',
            'connection',
            'show',
            c.uuid,
          ])
        ).trim();
        if (iface === ifName) return c.name;
      } catch {
        /* skip */
      }
    }
    return null;
  }

  private async isPersistentConnection(conName: string): Promise<boolean> {
    const cons = await this.listConnections();
    const row = cons.find((c) => c.name === conName);
    return row ? isEtcNmConnection(row.filename) : false;
  }

  private async listDevices(): Promise<DeviceRow[]> {
    const stdout = await this.nmcli.run([
      '-t',
      '-f',
      'DEVICE,TYPE,STATE,CONNECTION',
      'device',
      'status',
    ]);
    return this.nmcli.parseRows(stdout).map((p) => ({
      device: p[0] ?? '',
      type: p[1] ?? '',
      state: p[2] ?? '',
      connection: p[3] && p[3] !== '--' ? p[3] : '',
    }));
  }

  private async listConnections(): Promise<ConnectionRow[]> {
    const stdout = await this.nmcli.run([
      '-t',
      '-f',
      'NAME,UUID,TYPE,DEVICE,FILENAME',
      'connection',
      'show',
    ]);
    return this.nmcli.parseRows(stdout).map((p) => ({
      name: p[0] ?? '',
      uuid: p[1] ?? '',
      type: p[2] ?? '',
      device: p[3] && p[3] !== '--' ? p[3] : '',
      filename: p[4] ?? '',
    }));
  }

  private async getIpv4Dns(con: string): Promise<string[]> {
    const raw = (
      await this.nmcli.run(['-g', 'ipv4.dns', 'connection', 'show', con])
    ).trim();
    if (!raw || raw === '--') return [];
    return raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private async getIpv4DnsSearch(con: string): Promise<string[]> {
    const raw = (
      await this.nmcli.run([
        '-g',
        'ipv4.dns-search',
        'connection',
        'show',
        con,
      ])
    ).trim();
    if (!raw || raw === '--') return [];
    return raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private async getIpv4Addresses(con: string): Promise<string[]> {
    const raw = (
      await this.nmcli.run(['-g', 'ipv4.addresses', 'connection', 'show', con])
    ).trim();
    if (!raw) return [];
    return uniqueCidrs(
      raw
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/\s+/g, '')),
    );
  }

  private async getIpv4Gateway(con: string): Promise<string | null> {
    const raw = (
      await this.nmcli.run(['-g', 'ipv4.gateway', 'connection', 'show', con])
    ).trim();
    if (!raw || raw === '--' || raw === '0.0.0.0') return null;
    return raw;
  }

  private async readLiveIpv4Cidrs(ifName: string): Promise<string[]> {
    try {
      const { stdout } = await execFileAsync('ip', ['-j', 'addr', 'show', 'dev', ifName], {
        timeout: 8000,
        maxBuffer: 2 * 1024 * 1024,
      });
      const parsed = JSON.parse(stdout) as Array<{
        addr_info?: Array<{
          family?: string;
          local?: string;
          prefixlen?: number;
          scope?: string;
        }>;
      }>;
      const cidrs: string[] = [];
      for (const item of parsed) {
        for (const a of item.addr_info ?? []) {
          if (a.family !== 'inet' || !a.local) continue;
          if (a.scope === 'link') continue;
          cidrs.push(`${a.local}/${a.prefixlen ?? 32}`);
        }
      }
      return uniqueCidrs(cidrs);
    } catch {
      return [];
    }
  }

  private async inferDefaultDevice(): Promise<string | null> {
    const managed = await this.inferNmManagedDevice();
    if (managed) return managed;
    try {
      const { stdout } = await execFileAsync(
        'ip',
        ['-j', 'route', 'show', 'default'],
        { timeout: 8000, maxBuffer: 1024 * 1024 },
      );
      const routes = JSON.parse(stdout) as Array<{ dev?: string }>;
      const dev = routes[0]?.dev;
      return dev && IFACE_NAME_RE.test(dev) ? dev : null;
    } catch {
      return null;
    }
  }

  /** يفضّل منفذاً تحت NM (match أو connected) ويتجنب unmanaged */
  private async inferNmManagedDevice(): Promise<string | null> {
    const devices = await this.listDevices();
    const cons = await this.listConnections();
    const ethernet = devices.filter(
      (d) =>
        (d.type === 'ethernet' || d.type === '802-3-ethernet') &&
        d.state !== 'unmanaged' &&
        !PROTECTED_IFACES.has(d.device),
    );

    const withMatch = ethernet.find((d) =>
      cons.some((c) => c.name === matchConnectionName(d.device)),
    );
    if (withMatch) return withMatch.device;

    const connected = ethernet.find(
      (d) => d.state === 'connected' || d.state.startsWith('connected'),
    );
    if (connected) return connected.device;

    return ethernet[0]?.device ?? null;
  }
}

function uniqueCidrs(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const c = item.trim();
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isEtcNmConnection(filename: string): boolean {
  if (!filename || filename === '--') return false;
  return (
    filename.includes('/etc/NetworkManager/system-connections/') ||
    filename.startsWith('/etc/NetworkManager/system-connections/')
  );
}
