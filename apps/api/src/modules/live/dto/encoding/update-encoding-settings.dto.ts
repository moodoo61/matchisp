import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  ENCODING_SOURCE_MODES,
  type EncodingSourceMode,
} from '@isp/shared';

export class UpdateEncodingSettingsDto {
  @ApiProperty({
    enum: ENCODING_SOURCE_MODES,
    description: 'وضع مصدر الترميز',
  })
  @IsIn(ENCODING_SOURCE_MODES)
  sourceMode!: EncodingSourceMode;
}
