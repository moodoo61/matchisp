import { IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProbeHlsDto {
  @ApiProperty({
    example: 'https://live-hls-apps-aja-fa.getaj.net/AJA/index.m3u8',
  })
  @IsString()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(2000)
  url!: string;
}
