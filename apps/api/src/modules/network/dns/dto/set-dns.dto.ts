import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import {
  DNS_SEARCH_RE,
  IFACE_NAME_RE,
  IPV4_RE,
} from '../../constants/network-safety';

export class SetDnsDto {
  @ApiProperty({
    type: [String],
    example: ['8.8.8.8', '1.1.1.1'],
    description: 'خوادم DNS (IPv4) — قائمة فارغة لمسح الإعداد',
  })
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @Matches(IPV4_RE, {
    each: true,
    message: 'كل خادم DNS يجب أن يكون IPv4 صالحاً',
  })
  servers!: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['lan.local'],
    description: 'نطاقات البحث (اختياري)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @Matches(DNS_SEARCH_RE, {
    each: true,
    message: 'نطاق بحث DNS غير صالح',
  })
  search?: string[];

  @ApiPropertyOptional({
    example: 'eno1',
    description: 'المنفذ الذي يُربط به ملف اتصال NM (افتراضي: مسار default)',
  })
  @IsOptional()
  @IsString()
  @Matches(IFACE_NAME_RE)
  device?: string;
}
