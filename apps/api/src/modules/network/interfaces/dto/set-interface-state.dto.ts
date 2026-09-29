import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';
import { IFACE_NAME_RE } from '../../constants/network-safety';

export class SetInterfaceStateDto {
  @ApiProperty({ example: 'eno2' })
  @IsString()
  @Matches(IFACE_NAME_RE, { message: 'اسم المنفذ غير صالح' })
  ifName!: string;

  @ApiProperty({ enum: ['up', 'down'] })
  @IsIn(['up', 'down'])
  state!: 'up' | 'down';
}
