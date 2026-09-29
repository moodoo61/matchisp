import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateAgentDto {
  @ApiPropertyOptional({ description: 'اسم الوكيل' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ description: 'اسم المحل' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  shopName?: string;

  @ApiPropertyOptional({ description: 'المنطقة' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  region?: string;

  @ApiPropertyOptional({ description: 'العنوان' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  address?: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  phone?: string;

  @ApiPropertyOptional({
    description: 'خط العرض من لوكيشن الجهاز — null لمسحه',
    nullable: true,
  })
  @ValidateIf((_, v) => v !== null)
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({
    description: 'خط الطول من لوكيشن الجهاز — null لمسحه',
    nullable: true,
  })
  @ValidateIf((_, v) => v !== null)
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'إظهار في الـ API العام' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
