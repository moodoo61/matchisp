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
}
