import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ASSET_KINDS } from '../constants/asset-kind';

export class CreateAssetDto {
  @ApiProperty({ enum: ASSET_KINDS })
  @IsIn([...ASSET_KINDS])
  kind!: (typeof ASSET_KINDS)[number];

  @ApiProperty()
  @IsString()
  @MinLength(2)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
