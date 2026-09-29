import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';

class AgentsPublicApiFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  name?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  region?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  address?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  shopName?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  phone?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  order?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  latitude?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  longitude?: boolean;
}

export class UpdateAgentsPublicApiSettingsDto {
  @ApiPropertyOptional({ description: 'تفعيل نقطة النهاية العامة' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ type: AgentsPublicApiFieldsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentsPublicApiFieldsDto)
  fields?: AgentsPublicApiFieldsDto;
}
