import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLoginPackageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({ description: 'مثل: 30 يوم' })
  @IsString()
  @MinLength(1)
  time!: string;

  @ApiProperty({ description: 'مثل: غير محدود' })
  @IsString()
  @MinLength(1)
  download!: string;

  @ApiProperty({ description: 'مثل: صالح لمدة 30 يوم' })
  @IsString()
  @MinLength(1)
  validity!: string;

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
