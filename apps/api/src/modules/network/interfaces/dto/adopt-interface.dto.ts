import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { IFACE_NAME_RE } from '../../constants/network-safety';

export class AdoptInterfaceDto {
  @ApiProperty({ example: 'eno2np1' })
  @IsString()
  @Matches(IFACE_NAME_RE, { message: 'اسم المنفذ غير صالح' })
  ifName!: string;
}
