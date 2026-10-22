import { createSocket, type Socket } from 'dgram';
import { networkInterfaces } from 'os';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  COMMS_DISCOVERY_BEACON_PREFIX,
  COMMS_DISCOVERY_PROBE,
  COMMS_DISCOVERY_SERVICE,
  DEFAULT_ASTERISK_WS_PORT,
  DEFAULT_COMMS_DISCOVERY_SETTINGS,
  type CommsDiscoveryStoredSettings,
} from '../constants/discovery-ports';

/**
 * يستمع UDP على منفذ الإعلان ويرد على MATCH_DISCOVER بـ MATCH_BEACON + JSON.
 * تُدار دورة الحياة من CommsDiscoverySettingsService عند الإقلاع والتحديث.
 */
@Injectable()
export class CommsDiscoveryBeaconService implements OnModuleDestroy {
  private readonly logger = new Logger(CommsDiscoveryBeaconService.name);
  private socket: Socket | null = null;
  private settings: CommsDiscoveryStoredSettings = {
    ...DEFAULT_COMMS_DISCOVERY_SETTINGS,
  };
  private listenError: string | null = null;

  async onModuleDestroy() {
    await this.closeSocket();
  }

  isListening(): boolean {
    return this.socket !== null && this.listenError === null;
  }

  getListenError(): string | null {
    return this.listenError;
  }

  async applySettings(next: CommsDiscoveryStoredSettings): Promise<void> {
    this.settings = { ...next };
    await this.rebind();
  }

  private async rebind(): Promise<void> {
    await this.closeSocket();
    this.listenError = null;

    if (!this.settings.enabled) {
      this.logger.log('إعلان اكتشاف الاتصال معطّل');
      return;
    }

    const port = this.settings.port;
    const sock = createSocket({ type: 'udp4', reuseAddr: true });
    this.socket = sock;

    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (err: Error) => {
          cleanup();
          reject(err);
        };
        const onListening = () => {
          cleanup();
          resolve();
        };
        const cleanup = () => {
          sock.off('error', onError);
          sock.off('listening', onListening);
        };
        sock.once('error', onError);
        sock.once('listening', onListening);
        sock.bind(port, '0.0.0.0');
      });
    } catch (err) {
      this.listenError =
        err instanceof Error ? err.message : 'فشل ربط منفذ الاكتشاف';
      this.logger.warn(`فشل ربط UDP :${port}: ${this.listenError}`);
      try {
        sock.close();
      } catch {
        /* ignore */
      }
      this.socket = null;
      return;
    }

    this.socket.on('message', (msg, rinfo) => {
      this.onMessage(msg, rinfo.address, rinfo.port);
    });
    this.socket.on('error', (err) => {
      this.listenError = err.message;
      this.logger.warn(`خطأ UDP اكتشاف: ${err.message}`);
    });

    this.logger.log(
      `إعلان اكتشاف الاتصال يستمع على UDP :${port} (${this.settings.displayName})`,
    );
  }

  private async closeSocket(): Promise<void> {
    const sock = this.socket;
    this.socket = null;
    if (!sock) return;
    await new Promise<void>((resolve) => {
      try {
        sock.close(() => resolve());
      } catch {
        resolve();
      }
    });
  }

  private onMessage(msg: Buffer, remoteHost: string, remotePort: number) {
    const text = msg.toString('utf8').trim();
    if (!text.startsWith(COMMS_DISCOVERY_PROBE)) return;

    const advertiseHost =
      process.env.COMMS_DISCOVERY_ADVERTISE_HOST?.trim() ||
      pickLanIpv4() ||
      remoteHost;
    const apiPort = Number(process.env.API_PORT || 3001);
    const wsPort = Number(
      process.env.ASTERISK_WS_PORT || DEFAULT_ASTERISK_WS_PORT,
    );

    const payload = {
      service: COMMS_DISCOVERY_SERVICE,
      v: 1,
      name: this.settings.displayName || 'Match',
      host: advertiseHost,
      wsUrl: `ws://${advertiseHost}:${wsPort}/ws`,
      sipDomain: advertiseHost,
      apiBase: `http://${advertiseHost}:${apiPort}`,
    };

    const reply = Buffer.from(
      `${COMMS_DISCOVERY_BEACON_PREFIX}${JSON.stringify(payload)}`,
      'utf8',
    );
    this.socket?.send(reply, remotePort, remoteHost, (err) => {
      if (err) {
        this.logger.warn(`فشل إرسال beacon إلى ${remoteHost}: ${err.message}`);
      }
    });
  }
}

function pickLanIpv4(): string | null {
  const candidates: string[] = [];
  const nets = networkInterfaces();
  for (const entries of Object.values(nets)) {
    if (!entries) continue;
    for (const ent of entries) {
      if (String(ent.family) !== 'IPv4' && String(ent.family) !== '4') continue;
      if (ent.internal) continue;
      candidates.push(ent.address);
    }
  }
  // تفضيل نطاق 172.* (شبكة محلية شائعة في نشر Match)
  const prefer172 = candidates.find((ip) => ip.startsWith('172.'));
  return prefer172 ?? candidates[0] ?? null;
}
