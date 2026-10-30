import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAgentsMapsSettingsDto {
  @ApiPropertyOptional({ description: 'مفتاح Google Maps JavaScript API' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  googleMapsApiKey?: string;
}
