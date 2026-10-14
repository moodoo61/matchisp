import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectServiceRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  reason!: string;
}
