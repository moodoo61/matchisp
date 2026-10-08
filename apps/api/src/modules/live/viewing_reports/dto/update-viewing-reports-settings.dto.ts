import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateViewingReportsSettingsDto {
  @ApiPropertyOptional({
    description:
      'تفعيل مشغّل USER_END على قنوات اللوحة لإرسال التقارير إلى API هذا السيرفر',
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
