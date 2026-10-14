import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class MarkInstalledDto {
  @ApiProperty({ description: 'معرّف أصل الصيانة (موقع/مشترك)' })
  @IsUUID()
  installedAssetId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
