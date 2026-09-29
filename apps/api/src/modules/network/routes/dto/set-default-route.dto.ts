import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { IFACE_NAME_RE, IPV4_RE } from '../../constants/network-safety';

export class SetDefaultRouteDto {
  @ApiProperty({ example: '192.168.1.1' })
  @IsString()
  @Matches(IPV4_RE, { message: 'البوابة غير صالحة' })
  gateway!: string;

  @ApiPropertyOptional({ example: 'eno1' })
  @IsOptional()
  @IsString()
  @Matches(IFACE_NAME_RE)
  device?: string;
}
