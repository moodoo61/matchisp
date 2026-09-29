import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePageCardFlagDto {
  @ApiProperty()
  @IsBoolean()
  isEnabled!: boolean;
}
