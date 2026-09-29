import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { DEVICE_PATH_RE, MOUNTPOINT_RE } from '../constants/disk-safety';

export class UnmountDiskDto {
  @ApiPropertyOptional({ example: '/dev/sdb1' })
  @IsOptional()
  @IsString()
  @Matches(DEVICE_PATH_RE, { message: 'مسار الجهاز غير صالح' })
  devicePath?: string;

  @ApiPropertyOptional({ example: '/mnt/data' })
  @IsOptional()
  @IsString()
  @Matches(MOUNTPOINT_RE, { message: 'مسار التركيب غير صالح' })
  mountpoint?: string;

  @ApiPropertyOptional({
    description: 'فصل قسري (lazy) إن كان الجهاز مشغولاً',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  lazy?: boolean;
}
