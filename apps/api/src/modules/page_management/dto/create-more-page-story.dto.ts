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

export const MORE_PAGE_STORY_VARIANTS = [
  'intro',
  'section',
  'highlight',
  'conclusion',
] as const;

export class CreateMorePageStoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  body!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  imageUrl!: string;

  @ApiPropertyOptional({
    enum: MORE_PAGE_STORY_VARIANTS,
    default: 'section',
  })
  @IsOptional()
  @IsIn(MORE_PAGE_STORY_VARIANTS)
  variant?: (typeof MORE_PAGE_STORY_VARIANTS)[number];

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
