import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMorePageSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  heroTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  itemsSectionTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemsSectionSubtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  aboutSectionTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aboutSectionSubtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  storySectionTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storySectionSubtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footerText?: string;
}
