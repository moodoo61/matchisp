import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export const MORE_PAGE_ABOUT_ICON_KEYS = [
  'vision',
  'mission',
  'values',
  'custom',
] as const;

export class CreateMorePageAboutDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  body!: string;

  @ApiPropertyOptional({
    enum: MORE_PAGE_ABOUT_ICON_KEYS,
    default: 'custom',
  })
  @IsOptional()
  @IsIn(MORE_PAGE_ABOUT_ICON_KEYS)
  iconKey?: (typeof MORE_PAGE_ABOUT_ICON_KEYS)[number];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
