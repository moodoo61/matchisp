import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryCdrDto {
  @ApiPropertyOptional({ description: 'بحث في src أو dst أو clid' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'من تاريخ ISO' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'إلى تاريخ ISO' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
