import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DOCUMENT_TYPES } from '../constants/document-type';

export class DocumentLineDto {
  @ApiProperty()
  @IsUUID()
  itemId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  /** للتعديل فقط: موجب زيادة / سالب إنقاص */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  adjustDelta?: number;

  @ApiPropertyOptional({ description: 'جهاز موجود عند الصرف/الإرجاع' })
  @IsOptional()
  @IsUUID()
  deviceUnitId?: string;

  @ApiPropertyOptional({ description: 'رقم تسلسلي جديد عند التوريد' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  serial?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateDocumentDto {
  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsIn([...DOCUMENT_TYPES])
  type!: (typeof DOCUMENT_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'المستلم عند الصرف' })
  @IsOptional()
  @IsUUID()
  issuedToUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partsRequestId?: string;

  @ApiProperty({ type: [DocumentLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  lines!: DocumentLineDto[];
}
