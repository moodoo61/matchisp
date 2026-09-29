import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  AUTO_CLEAR_HOURS_MAX,
  AUTO_CLEAR_HOURS_MIN,
  type SportsEventsAutoClearMode,
} from '../constants/sports-events-settings';

enum AutoClearModeDto {
  all = 'all',
  after_hours = 'after_hours',
}

export class UpdateSportsEventsSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'عنوان القسم' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title?: string;

  @ApiPropertyOptional({
    description: 'المنطقة الزمنية لحساب أحداث اليوم (مثل Asia/Baghdad)',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ description: 'تفعيل جدول مسح أحداث اليوم' })
  @IsOptional()
  @IsBoolean()
  autoClearEnabled?: boolean;

  @ApiPropertyOptional({
    enum: AutoClearModeDto,
    description: 'all = حذف الكل · after_hours = بعد عدد ساعات من الموعد',
  })
  @IsOptional()
  @IsEnum(AutoClearModeDto)
  autoClearMode?: SportsEventsAutoClearMode;

  @ApiPropertyOptional({
    description: 'عدد الساعات قبل حذف المباراة (عند after_hours)',
    minimum: AUTO_CLEAR_HOURS_MIN,
    maximum: AUTO_CLEAR_HOURS_MAX,
  })
  @IsOptional()
  @IsInt()
  @Min(AUTO_CLEAR_HOURS_MIN)
  @Max(AUTO_CLEAR_HOURS_MAX)
  autoClearAfterHours?: number;
}
