import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { DEVICE_PATH_RE } from '../constants/disk-safety';

export class UpsertDiskNoteDto {
  @ApiProperty({ example: '/dev/sdb1' })
  @IsString()
  @Matches(DEVICE_PATH_RE, { message: 'مسار الجهاز غير صالح' })
  devicePath!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
