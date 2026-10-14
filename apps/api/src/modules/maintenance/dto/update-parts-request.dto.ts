import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdatePartsRequestDto {
  @ApiProperty({
    enum: ['acknowledged', 'fulfilled', 'rejected'],
  })
  @IsIn(['acknowledged', 'fulfilled', 'rejected'])
  status!: 'acknowledged' | 'fulfilled' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  rejectReason?: string;

  /** عند الصرف: إعادة أمر العمل للتنفيذ إن كان بانتظار مواد */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  resumeWorkOrder?: boolean;
}
