import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: WORK_ORDER_TYPES })
  @IsIn([...WORK_ORDER_TYPES])
  workType!: (typeof WORK_ORDER_TYPES)[number];

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

  /** إن true يُرسل مباشرة للفرز */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  submit?: boolean;
}
