import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { COMMS_DISCOVERY_PORTS } from '../constants/discovery-ports';

export class UpdateCommsDiscoverySettingsDto {
  @ApiPropertyOptional({ description: 'تفعيل إعلان الاكتشاف UDP' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'منفذ الإعلان — من القائمة الثابتة فقط',
    enum: COMMS_DISCOVERY_PORTS,
  })
  @IsOptional()
  @IsInt()
  @IsIn([...COMMS_DISCOVERY_PORTS])
  port?: number;

  @ApiPropertyOptional({ description: 'اسم يظهر في تطبيق الأندرويد', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'إظهار زر تحميل تطبيق الأندرويد (افتراضي: عرض)',
  })
  @IsOptional()
  @IsBoolean()
  showDownloadButton?: boolean;
}
