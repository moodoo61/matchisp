import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MistServerService } from '../mist/mist_server.service';
import type { EncodingRuntimeStatus } from './encoding-types';
import { probeEncoder } from './probe-encoder';
import { probeFfmpeg } from './probe-ffmpeg';
import { probeGpu } from './probe-gpu';
import { probeMistServer } from './probe-mist';

@Injectable()
export class EncodingStatusService {
  constructor(
    private readonly mist: MistServerService,
    private readonly config: ConfigService,
  ) {}

  async getStatus(): Promise<EncodingRuntimeStatus> {
    const [gpu, ffmpeg, mistserver] = await Promise.all([
      probeGpu(),
      probeFfmpeg(),
      probeMistServer(this.mist, this.config),
    ]);
    const encoder = await probeEncoder(ffmpeg);
    return {
      checkedAt: new Date().toISOString(),
      gpu,
      encoder,
      ffmpeg,
      mistserver,
    };
  }
}
