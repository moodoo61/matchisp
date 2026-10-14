import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { WORK_PRIORITIES } from '../constants/priority';
import { WORK_ORDER_TYPES } from '../constants/work-order-type';

export class TriageServiceRequestDto {
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
