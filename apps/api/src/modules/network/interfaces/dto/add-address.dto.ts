import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { IFACE_NAME_RE, IPV4_CIDR_RE } from '../../constants/network-safety';

export class AddAddressDto {
  @ApiProperty({ example: 'eno2' })
  @IsString()
  @Matches(IFACE_NAME_RE)
  ifName!: string;

  @ApiProperty({ example: '192.168.10.50/24' })
  @IsString()
  @Matches(IPV4_CIDR_RE, {
    message: 'صيغة CIDR غير صالحة — مثال 192.168.10.50/24',
  })
  cidr!: string;
}
