import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateSstpSettingsDto {
  @ApiPropertyOptional({ description: 'عنوان خادم SSTP' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  host?: string;

  @ApiPropertyOptional({ description: 'اسم المستخدم' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  username?: string;

  @ApiPropertyOptional({
    description: 'كلمة المرور (اتركها فارغة للإبقاء على الحالية)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  password?: string;

  @ApiPropertyOptional({ description: 'تجاهل تحذير الشهادة' })
  @IsOptional()
  @IsBoolean()
  certWarn?: boolean;

  @ApiPropertyOptional({ description: 'امتداد TLS hostname (SNI)' })
  @IsOptional()
  @IsBoolean()
  tlsExt?: boolean;

  @ApiPropertyOptional({ description: 'اتصال تلقائي عند التشغيل' })
  @IsOptional()
  @IsBoolean()
  autoConnect?: boolean;
}
