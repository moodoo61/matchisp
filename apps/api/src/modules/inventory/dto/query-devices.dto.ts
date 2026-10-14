import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { DEVICE_STATUSES } from '../constants/device-status';

export class QueryDevicesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiPropertyOptional({ enum: DEVICE_STATUSES })
  @IsOptional()
  @IsIn([...DEVICE_STATUSES])
  status?: (typeof DEVICE_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  holderUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;
}
