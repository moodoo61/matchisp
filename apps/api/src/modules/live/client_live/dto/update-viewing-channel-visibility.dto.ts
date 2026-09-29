import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateViewingChannelVisibilityDto {
  @ApiProperty({ description: 'إظهار القناة في صفحة المشاهدة' })
  @IsBoolean()
  visible!: boolean;
}
