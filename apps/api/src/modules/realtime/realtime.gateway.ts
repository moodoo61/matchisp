import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Public } from '../../common/guards';

function resolveCorsOrigins(): string | string[] | boolean {
  if (
    process.env.CORS_ALLOW_ALL === 'true' ||
    process.env.CORS_ORIGINS?.trim() === '*'
  ) {
    return true;
  }
  const fromList = process.env.CORS_ORIGINS?.split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (fromList?.length) {
    return fromList;
  }
  return process.env.ADMIN_WEB_URL ?? 'http://localhost:4010';
}

@WebSocketGateway({
  cors: {
    origin: resolveCorsOrigins(),
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  @Public()
  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: unknown) {
    return { event: 'pong', data };
  }

  emitNotification(payload: Record<string, unknown>) {
    this.server.emit('notification', payload);
  }
}
