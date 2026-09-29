import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';
import {
  ENGLISH_NAME_MESSAGE,
  ENGLISH_NAME_PATTERN,
} from '../../constants/english-name';

export class CreateChannelSectionDto {
  @ApiProperty({ example: 'sports', description: 'معرّف إنجليزي فريد' })
  @IsString()
  @MinLength(1)
  @Matches(ENGLISH_NAME_PATTERN, { message: ENGLISH_NAME_MESSAGE })
  name!: string;

  @ApiProperty({ example: 'رياضة', description: 'اسم العرض' })
  @IsString()
  @MinLength(1)
  label!: string;
}
