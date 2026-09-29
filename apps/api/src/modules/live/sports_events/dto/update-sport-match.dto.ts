import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class UpdateSportMatchDto {
  @ApiPropertyOptional({ description: 'البطولة' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  tournament?: string;

  @ApiPropertyOptional({ description: 'الفريق الأول' })
  @IsOptional()
  @IsUUID()
  homeTeamId?: string;

  @ApiPropertyOptional({ description: 'الفريق الثاني' })
  @IsOptional()
  @IsUUID()
  awayTeamId?: string;

  @ApiPropertyOptional({ description: 'موعد المباراة (ISO)' })
  @IsOptional()
  @IsDateString()
  kickoffAt?: string;

  @ApiPropertyOptional({ description: 'معرّف القناة' })
  @IsOptional()
  @IsUUID()
  channelId?: string;
}
