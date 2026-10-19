import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSpeedOptionDto {
  @ApiProperty({ description: 'الاسم المعروض' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ description: 'قيمة domain في MikroTik' })
  @IsString()
  @MinLength(1)
  value!: string;

  @ApiPropertyOptional({ description: 'الخيار الافتراضي' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
