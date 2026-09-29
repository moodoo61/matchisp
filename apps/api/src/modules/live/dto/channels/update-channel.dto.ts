import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import {
  ENCODING_SOURCE_MODES,
  type EncodingSourceMode,
} from '@isp/shared';
import {
  ENGLISH_NAME_MESSAGE,
  ENGLISH_NAME_PATTERN,
} from '../../constants/english-name';
import { CHANNEL_TYPES, type ChannelTypeValue } from './create-channel.dto';

export class UpdateChannelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({ description: 'معرّف إنجليزي فريد' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @Matches(ENGLISH_NAME_PATTERN, { message: ENGLISH_NAME_MESSAGE })
  name?: string;

  @ApiPropertyOptional({ description: 'اسم العرض' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @ApiPropertyOptional({ enum: CHANNEL_TYPES })
  @IsOptional()
  @IsIn(CHANNEL_TYPES)
  type?: ChannelTypeValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoDevice?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioDevice?: string | null;

  @ApiPropertyOptional({
    enum: ENCODING_SOURCE_MODES,
    description: 'خيار المصدر (من خيارات الجودة والترميز)',
  })
  @IsOptional()
  @IsIn(ENCODING_SOURCE_MODES)
  sourceMode?: EncodingSourceMode;

  @ApiPropertyOptional({
    type: [String],
    description: 'جودات ABR المفعّلة للقناة (encode_gpu فقط)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualityRungIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({ description: 'تشغيل دائم على MistServer' })
  @IsOptional()
  @IsBoolean()
  alwaysOn?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
