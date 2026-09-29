import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  ValidateIf,
} from 'class-validator';
import {
  ENCODING_SOURCE_MODES,
  type EncodingSourceMode,
} from '@isp/shared';
import {
  ENGLISH_NAME_MESSAGE,
  ENGLISH_NAME_PATTERN,
} from '../../constants/english-name';

export const CHANNEL_TYPES = ['IPTV', 'HDMI'] as const;
export type ChannelTypeValue = (typeof CHANNEL_TYPES)[number];

export class CreateChannelDto {
  @ApiProperty()
  @IsUUID()
  sectionId!: string;

  @ApiProperty({ example: 'bein_1', description: 'معرّف إنجليزي فريد' })
  @IsString()
  @MinLength(1)
  @Matches(ENGLISH_NAME_PATTERN, { message: ENGLISH_NAME_MESSAGE })
  name!: string;

  @ApiProperty({ example: 'بي إن 1', description: 'اسم العرض' })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty({ enum: CHANNEL_TYPES })
  @IsIn(CHANNEL_TYPES)
  type!: ChannelTypeValue;

  @ApiPropertyOptional({ description: 'مصدر IPTV' })
  @ValidateIf((o: CreateChannelDto) => o.type === 'IPTV')
  @IsString()
  @MinLength(1)
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'مسار جهاز الفيديو HDMI' })
  @ValidateIf((o: CreateChannelDto) => o.type === 'HDMI')
  @IsString()
  @MinLength(1)
  videoDevice?: string;

  @ApiPropertyOptional({ description: 'مسار/معرّف جهاز الصوت HDMI' })
  @ValidateIf((o: CreateChannelDto) => o.type === 'HDMI')
  @IsString()
  @MinLength(1)
  audioDevice?: string;

  @ApiPropertyOptional({
    enum: ENCODING_SOURCE_MODES,
    default: 'passthrough',
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
  imageUrl?: string;

  @ApiPropertyOptional({ default: false, description: 'تشغيل دائم على MistServer' })
  @IsOptional()
  @IsBoolean()
  alwaysOn?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
