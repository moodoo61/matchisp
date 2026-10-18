import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { MORE_PAGE_ABOUT_ICON_KEYS } from './create-more-page-about.dto';

export class UpdateMorePageAboutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  body?: string;

  @ApiPropertyOptional({ enum: MORE_PAGE_ABOUT_ICON_KEYS })
  @IsOptional()
  @IsIn(MORE_PAGE_ABOUT_ICON_KEYS)
  iconKey?: (typeof MORE_PAGE_ABOUT_ICON_KEYS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
