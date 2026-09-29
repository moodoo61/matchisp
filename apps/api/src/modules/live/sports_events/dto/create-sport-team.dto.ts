import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum SportTeamTypeDto {
  CLUB = 'CLUB',
  NATIONAL = 'NATIONAL',
}

export class CreateSportTeamDto {
  @ApiProperty({ description: 'اسم الفريق' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: SportTeamTypeDto, description: 'نادي أو منتخب' })
  @IsEnum(SportTeamTypeDto)
  type!: SportTeamTypeDto;

  @ApiPropertyOptional({ description: 'رابط الشعار' })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
