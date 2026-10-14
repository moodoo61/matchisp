import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class ConvertServiceRequestDto {
  @ApiPropertyOptional({ description: 'عنوان أمر العمل إن اختلف عن البلاغ' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /** اعتماد فوري بعد الإنشاء (افتراضي true) */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  approve?: boolean;
}
