import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { SportTeamTypeDto } from './create-sport-team.dto';

export class UpdateSportTeamDto {
  @ApiPropertyOptional({ description: 'اسم الفريق' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ enum: SportTeamTypeDto })
  @IsOptional()
  @IsEnum(SportTeamTypeDto)
  type?: SportTeamTypeDto;

  @ApiPropertyOptional({ description: 'رابط الشعار — null للمسح', nullable: true })
  @ValidateIf((_, v) => v !== null)
  @IsOptional()
  @IsString()
  logoUrl?: string | null;
}
