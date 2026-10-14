import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ReasonDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  reason!: string;
}

export class OptionalReasonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
