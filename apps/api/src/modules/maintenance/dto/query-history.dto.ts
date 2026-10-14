import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ASSET_KINDS } from '../constants/asset-kind';
import { WORK_ORDER_TYPES } from '../constants/work-order-type';

export class QueryHistoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({ enum: ASSET_KINDS })
  @IsOptional()
  @IsIn([...ASSET_KINDS])
  assetKind?: (typeof ASSET_KINDS)[number];

  @ApiPropertyOptional({ enum: WORK_ORDER_TYPES })
  @IsOptional()
  @IsIn([...WORK_ORDER_TYPES])
  type?: (typeof WORK_ORDER_TYPES)[number];

  @ApiPropertyOptional({ description: 'بحث في العنوان أو اسم الأصل أو الموقع' })
  @IsOptional()
  @IsString()
  q?: string;
}
