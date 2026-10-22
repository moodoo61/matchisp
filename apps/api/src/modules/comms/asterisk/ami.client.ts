import { Socket } from 'net';

export type AmiAction = Record<string, string>;
export type AmiPacket = Record<string, string>;

const DEFAULT_TIMEOUT_MS = 12_000;

/**
 * عميل AMI بسيط يعتمد على تجميع كل الحزم حتى شرط الإكمال.
 */
export class AmiClient {
  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly username: string,
    private readonly secret: string,
  ) {}

  async ping(): Promise<boolean> {
    try {
      await this.request({ Action: 'Ping' });
      return true;
    } catch {
      return false;
    }
  }

  async coreStatus(): Promise<AmiPacket> {
    const packets = await this.request({ Action: 'CoreStatus' });
    return (
      packets.find((p) => p.Event === 'CoreStatus') ??
      packets.find((p) => p.Response === 'Success') ??
      {}
    );
  }

  async coreShowVersion(): Promise<string> {
    const packets = await this.request({
      Action: 'Command',
      Command: 'core show version',
    });
    const lines = packets
      .map((p) => p.Output ?? '')
      .filter((l) => l && !l.includes('--END COMMAND--'));
    return lines.join('\n').trim() || 'Asterisk';
  }

  async pjsipShowEndpoints(): Promise<AmiPacket[]> {
    const packets = await this.request({ Action: 'PJSIPShowEndpoints' });
    return packets.filter((p) => p.Event === 'EndpointList');
  }

  async coreShowChannels(): Promise<AmiPacket[]> {
    const packets = await this.request({ Action: 'CoreShowChannels' });
    return packets.filter((p) => p.Event === 'CoreShowChannel');
  }

  async reloadPjsip(): Promise<void> {
    await this.request({
      Action: 'Command',
      Command: 'module reload res_pjsip.so',
    });
  }

  async reloadDialplan(): Promise<void> {
    await this.request({
      Action: 'Command',
      Command: 'dialplan reload',
    });
  }

  async request(
    action: AmiAction,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): Promise<AmiPacket[]> {
    const actionId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    return new Promise((resolve, reject) => {
      const socket = new Socket();
      let buffer = '';
      const packets: AmiPacket[] = [];
      let settled = false;
      let phase: 'wait-banner' | 'wait-login' | 'wait-action' = 'wait-banner';

      const done = (err?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        socket.destroy();
        if (err) reject(err);
        else resolve(packets.filter((p) => p.ActionID === actionId || p.Event || p.Output !== undefined));
      };

      const timer = setTimeout(
        () => done(new Error('انتهت مهلة اتصال AMI')),
        timeoutMs,
      );

      const write = (fields: AmiAction) => {
        socket.write(
          Object.entries(fields)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\r\n') + '\r\n\r\n',
        );
      };

      const isComplete = (pkt: AmiPacket): boolean => {
        if (pkt.EventList === 'Complete') return true;
        if (action.Action === 'Command') {
          if (pkt.Output?.includes('--END COMMAND--')) return true;
          if (
            pkt.Response === 'Success' &&
            packets.some((p) => typeof p.Output === 'string')
          ) {
            return true;
          }
        }
        if (
          pkt.Response === 'Success' &&
          pkt.ActionID === actionId &&
          !isListAction(action.Action) &&
          action.Action !== 'Command'
        ) {
          return true;
        }
        return false;
      };

      const handle = (pkt: AmiPacket) => {
        if (phase === 'wait-login') {
          if (pkt.Response === 'Error') {
            done(new Error(pkt.Message || 'فشل تسجيل دخول AMI'));
            return;
          }
          if (pkt.Response === 'Success') {
            phase = 'wait-action';
            write({ ...action, ActionID: actionId });
          }
          return;
        }

        if (phase !== 'wait-action') return;
        if (pkt.ActionID && pkt.ActionID !== actionId) return;

        packets.push(pkt);
        if (pkt.Response === 'Error') {
          // قوائم فارغة تعود أحياناً كـ Error (مثل No endpoints found)
          if (
            isListAction(action.Action) &&
            /not found|no .+ found/i.test(pkt.Message || '')
          ) {
            done();
            return;
          }
          done(new Error(pkt.Message || 'خطأ AMI'));
          return;
        }
        if (isComplete(pkt)) done();
      };

      socket.setEncoding('utf8');
      socket.on('data', (chunk: string) => {
        buffer += chunk;

        if (phase === 'wait-banner' && /Asterisk Call Manager/i.test(buffer)) {
          phase = 'wait-login';
          // أزل سطر الترحيب حتى لا يلتصق برد Login
          buffer = buffer.replace(/^.*?Asterisk Call Manager[^\r\n]*\r?\n/i, '');
          write({
            Action: 'Login',
            Username: this.username,
            Secret: this.secret,
            Events: 'off',
          });
        }

        let sep: number;
        while ((sep = indexOfPacketEnd(buffer)) >= 0) {
          const raw = buffer.slice(0, sep);
          buffer = buffer.slice(sep + packetEndLen(buffer, sep));
          if (!raw.trim()) continue;
          handle(parsePacket(raw));
        }
      });
      socket.on('error', (err) => done(err));
      socket.on('close', () => {
        if (!settled) {
          if (packets.length) done();
          else done(new Error('أُغلق اتصال AMI قبل اكتمال الرد'));
        }
      });

      socket.connect(this.port, this.host);
    });
  }
}

function isListAction(name: string): boolean {
  // CoreStatus يرد Success واحداً بالحقول مباشرة — ليس قائمة EventList
  return name === 'PJSIPShowEndpoints' || name === 'CoreShowChannels';
}

function indexOfPacketEnd(buf: string): number {
  const a = buf.indexOf('\r\n\r\n');
  const b = buf.indexOf('\n\n');
  if (a < 0) return b;
  if (b < 0) return a;
  return Math.min(a, b);
}

function packetEndLen(buf: string, idx: number): number {
  if (buf.startsWith('\r\n\r\n', idx)) return 4;
  if (buf.startsWith('\n\n', idx)) return 2;
  return 4;
}

function parsePacket(raw: string): AmiPacket {
  const out: AmiPacket = {};
  for (const line of raw.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}
