import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';
import { BACKUP_FILENAME_RE } from '../constants/section-databases';

export class RestoreBackupDto {
  @ApiProperty({ example: 'partners' })
  @IsString()
  @MinLength(2)
  sectionKey!: string;

  @ApiProperty({ example: 'partners_20260929-120000.dump' })
  @IsString()
  @Matches(BACKUP_FILENAME_RE, { message: 'اسم ملف النسخة غير صالح' })
  filename!: string;
}
