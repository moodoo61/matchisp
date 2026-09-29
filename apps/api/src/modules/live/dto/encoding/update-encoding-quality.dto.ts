import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class EncodingQualityRungDto {
  @ApiProperty({ example: 'v0' })
  @IsString()
  @MinLength(1)
  id!: string;

  @ApiPropertyOptional({ example: true, description: 'تفعيل هذه الجودة' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ example: 1800, description: 'bitrate بالكبلوبت' })
  @IsInt()
  @Min(50)
  @Max(50000)
  bitrateKbps!: number;

  @ApiProperty({ example: 1800 })
  @IsInt()
  @Min(50)
  @Max(50000)
  maxrateKbps!: number;

  @ApiProperty({ example: 1800 })
  @IsInt()
  @Min(50)
  @Max(100000)
  bufsizeKbps!: number;
}

export class UpdateEncodingQualityDto {
  @ApiProperty({ type: [EncodingQualityRungDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => EncodingQualityRungDto)
  rungs!: EncodingQualityRungDto[];
}
