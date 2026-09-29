import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}
