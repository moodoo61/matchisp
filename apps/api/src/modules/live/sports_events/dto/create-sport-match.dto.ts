import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateSportMatchDto {
  @ApiProperty({ description: 'البطولة' })
  @IsString()
  @MinLength(2)
  tournament!: string;

  @ApiProperty({ description: 'الفريق الأول' })
  @IsUUID()
  homeTeamId!: string;

  @ApiProperty({ description: 'الفريق الثاني' })
  @IsUUID()
  awayTeamId!: string;

  @ApiProperty({ description: 'موعد المباراة (ISO)' })
  @IsDateString()
  kickoffAt!: string;

  @ApiProperty({ description: 'معرّف القناة' })
  @IsUUID()
  channelId!: string;
}
