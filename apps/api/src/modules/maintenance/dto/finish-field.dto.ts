import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class FinishFieldDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  completionNotes!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCause?: string;
}
