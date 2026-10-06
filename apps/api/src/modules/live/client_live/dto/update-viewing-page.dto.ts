import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateViewingPageDto {
  @ApiPropertyOptional({ description: 'تفعيل صفحة المشاهدة العامة' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 'ISP Live' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  brandTitle?: string;

  @ApiPropertyOptional({ example: 'البث المباشر' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  pageTitle?: string;

  @ApiPropertyOptional({ example: 'قنواتك في مكان واحد' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @ApiPropertyOptional({ description: 'إظهار جدول المباريات في صفحة العميل' })
  @IsOptional()
  @IsBoolean()
  showMatchSchedule?: boolean;

  @ApiPropertyOptional({ description: 'إظهار اسم العلامة في صفحة العميل' })
  @IsOptional()
  @IsBoolean()
  showBrandTitle?: boolean;

  @ApiPropertyOptional({ description: 'إظهار شعار العلامة في صفحة العميل' })
  @IsOptional()
  @IsBoolean()
  showBrandLogo?: boolean;

  @ApiPropertyOptional({ example: 'LIVE • HD' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  brandSubtitle?: string;

  @ApiPropertyOptional({ description: 'إظهار العبارة تحت اسم العلامة' })
  @IsOptional()
  @IsBoolean()
  showBrandSubtitle?: boolean;

  @ApiPropertyOptional({ example: 'بث مباشر' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  liveBadgeText?: string;

  @ApiPropertyOptional({ description: 'إظهار شارة البث في الترويسة' })
  @IsOptional()
  @IsBoolean()
  showLiveBadge?: boolean;

  @ApiPropertyOptional({
    description: 'تشغيل القناة تلقائياً عند دخول صفحة المشاهدة',
  })
  @IsOptional()
  @IsBoolean()
  autoplayOnEnter?: boolean;

  @ApiPropertyOptional({
    description:
      'تفعيل حماية روابط المشاهدة بـ JWT/JWK (MistServer) — اختياري',
  })
  @IsOptional()
  @IsBoolean()
  jwtPlaybackEnabled?: boolean;
}
