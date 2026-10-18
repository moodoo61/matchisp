import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { WORK_PRIORITIES } from '../constants/priority';
import { WORK_ORDER_TYPES } from '../constants/work-order-type';

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

  /** تعيين فني مباشرة بعد التحويل (يتطلب صلاحية توزيع) */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  /** تطبيق فرز على البلاغ قبل التحويل (نفس حقول الفرز) */
  @ApiPropertyOptional({ enum: WORK_ORDER_TYPES })
  @IsOptional()
  @IsIn([...WORK_ORDER_TYPES])
  workType?: (typeof WORK_ORDER_TYPES)[number];

  @ApiPropertyOptional({ enum: WORK_PRIORITIES })
  @IsOptional()
  @IsIn([...WORK_PRIORITIES])
  priority?: (typeof WORK_PRIORITIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  triageNotes?: string;
}
