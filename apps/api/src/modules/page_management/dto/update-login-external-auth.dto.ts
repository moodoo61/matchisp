import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLoginExternalAuthDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: ['credentials', 'redirect'] })
  @IsOptional()
  @IsIn(['credentials', 'redirect'])
  flowMode?: 'credentials' | 'redirect';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remoteUrl?: string;

  @ApiPropertyOptional({ enum: ['post', 'get'] })
  @IsOptional()
  @IsIn(['post', 'get'])
  httpMethod?: 'post' | 'get';

  @ApiPropertyOptional({ description: 'أصل REST على CHR مثل http://host:1616' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  restBaseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  restUsername?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  restPassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  linkLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendMac?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendIp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendUsername?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendLinkLogin?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendLinkOrig?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendError?: boolean;
}
