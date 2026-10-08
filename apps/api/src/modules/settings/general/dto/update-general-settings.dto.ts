import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { GENERAL_UI_FONT_IDS } from '../constants/general-fonts';

export class UpdateGeneralSettingsDto {
  @ApiPropertyOptional({ description: 'اسم النظام' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  systemName?: string;

  @ApiPropertyOptional({ description: 'رابط شعار النظام' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'اسم العلامة' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brandName?: string;

  @ApiPropertyOptional({ description: 'رابط شعار العلامة' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  brandLogoUrl?: string;

  @ApiPropertyOptional({
    description: 'معرّف خط واجهة الإدارة',
    enum: GENERAL_UI_FONT_IDS,
  })
  @IsOptional()
  @IsString()
  @IsIn([...GENERAL_UI_FONT_IDS])
  uiFontId?: string;
}
