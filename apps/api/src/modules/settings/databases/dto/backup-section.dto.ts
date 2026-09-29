import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class BackupSectionDto {
  @ApiProperty({ example: 'partners' })
  @IsString()
  @MinLength(2)
  sectionKey!: string;
}
