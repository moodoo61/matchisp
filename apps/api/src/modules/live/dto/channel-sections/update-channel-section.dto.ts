import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import {
  ENGLISH_NAME_MESSAGE,
  ENGLISH_NAME_PATTERN,
} from '../../constants/english-name';

export class UpdateChannelSectionDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
