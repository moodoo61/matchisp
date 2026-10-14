import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreatePartsRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  description!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  /** إن true ينقل أمر العمل إلى waiting_parts */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  setWaiting?: boolean;
}
