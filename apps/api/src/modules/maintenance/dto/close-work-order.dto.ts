import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CloseWorkOrderDto {
  @ApiPropertyOptional({
    description: 'ملاحظات اعتماد المراجعة (مستحسنة)',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  reviewNotes?: string;
}
