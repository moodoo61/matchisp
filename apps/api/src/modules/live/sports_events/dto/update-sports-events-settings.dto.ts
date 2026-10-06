import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  AUTO_CLEAR_HOURS_MAX,
  AUTO_CLEAR_HOURS_MIN,
  SYNC_MINUTES_MAX,
  SYNC_MINUTES_MIN,
  SYNC_SECONDS_MAX,
  SYNC_SECONDS_MIN,
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

  @ApiPropertyOptional({ description: 'تفعيل مزامنة المباريات من مصدر خارجي' })
  @IsOptional()
  @IsBoolean()
  externalSyncEnabled?: boolean;

  @ApiPropertyOptional({ description: 'رابط مصدر مباريات اليوم' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  externalSyncUrl?: string;

  @ApiPropertyOptional({ description: 'تفعيل المزامنة العامة' })
  @IsOptional()
  @IsBoolean()
  externalSyncGeneralEnabled?: boolean;

  @ApiPropertyOptional({ description: 'دقائق فترة المزامنة العامة' })
  @IsOptional()
  @IsInt()
  @Min(SYNC_MINUTES_MIN)
  @Max(SYNC_MINUTES_MAX)
  externalSyncGeneralIntervalMinutes?: number;

  @ApiPropertyOptional({ description: 'ثوانٍ فترة المزامنة العامة' })
  @IsOptional()
  @IsInt()
  @Min(SYNC_SECONDS_MIN)
  @Max(SYNC_SECONDS_MAX)
  externalSyncGeneralIntervalSeconds?: number;

  @ApiPropertyOptional({
    description: 'تفعيل مزامنة المباريات الجارية فقط',
  })
  @IsOptional()
  @IsBoolean()
  externalSyncLiveEnabled?: boolean;

  @ApiPropertyOptional({ description: 'دقائق فترة مزامنة المباريات الجارية' })
  @IsOptional()
  @IsInt()
  @Min(SYNC_MINUTES_MIN)
  @Max(SYNC_MINUTES_MAX)
  externalSyncLiveIntervalMinutes?: number;

  @ApiPropertyOptional({ description: 'ثوانٍ فترة مزامنة المباريات الجارية' })
  @IsOptional()
  @IsInt()
  @Min(SYNC_SECONDS_MIN)
  @Max(SYNC_SECONDS_MAX)
  externalSyncLiveIntervalSeconds?: number;
}
