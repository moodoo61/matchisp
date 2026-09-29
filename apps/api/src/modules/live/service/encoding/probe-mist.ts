import type { ConfigService } from '@nestjs/config';
import type { MistServerService } from '../mist/mist_server.service';
import type { MistStatus } from './encoding-types';

export async function probeMistServer(
  mist: MistServerService,
  config: ConfigService,
): Promise<MistStatus> {
  const url =
    config.get<string>('MISTSERVER_API_URL')?.trim() ||
    'http://127.0.0.1:4242/api2';
  const ping = await mist.ping();
  return {
    status: ping.ok ? 'ok' : 'error',
    available: ping.ok,
    url,
    detail: ping.detail,
  };
}
