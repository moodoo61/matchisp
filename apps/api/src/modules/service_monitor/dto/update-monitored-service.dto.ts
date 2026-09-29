import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMonitoredServiceDto {
  @ApiPropertyOptional({ description: 'اسم العرض' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional({ description: 'وصف مختصر' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'عنوان أساسي للفحص (URL)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  baseUrl?: string;

  @ApiPropertyOptional({ description: 'تفعيل المتابعة' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'ملاحظات تشغيل' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
