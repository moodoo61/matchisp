import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ description: 'اسم الوكيل' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ description: 'اسم المحل' })
  @IsString()
  @MinLength(2)
  shopName!: string;

  @ApiPropertyOptional({ description: 'المنطقة', default: 'أخرى' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  region?: string;

  @ApiProperty({ description: 'العنوان' })
  @IsString()
  @MinLength(2)
  address!: string;

  @ApiProperty({ description: 'رقم الهاتف' })
  @IsString()
  @MinLength(5)
  phone!: string;

  @ApiPropertyOptional({ description: 'خط العرض من لوكيشن الجهاز' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول من لوكيشن الجهاز' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true, description: 'إظهار في الـ API العام' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
