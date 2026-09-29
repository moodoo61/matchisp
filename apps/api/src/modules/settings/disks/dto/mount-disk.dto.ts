import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { DEVICE_PATH_RE, MOUNTPOINT_RE } from '../constants/disk-safety';

export class MountDiskDto {
  @ApiProperty({ example: '/dev/sdb1' })
  @IsString()
  @Matches(DEVICE_PATH_RE, { message: 'مسار الجهاز غير صالح' })
  devicePath!: string;

  @ApiProperty({ example: '/mnt/data' })
  @IsString()
  @Matches(MOUNTPOINT_RE, { message: 'مسار التركيب غير صالح' })
  mountpoint!: string;

  @ApiPropertyOptional({ description: 'خيارات mount مثل defaults,noatime' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  options?: string;

  @ApiPropertyOptional({
    description: 'إنشاء مجلد نقطة التركيب إن لم يكن موجوداً',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  createDir?: boolean;
}
