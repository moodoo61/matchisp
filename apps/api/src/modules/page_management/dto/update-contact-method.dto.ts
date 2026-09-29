import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CONTACT_METHOD_TYPES } from '../constants/contact-method-types';

export class UpdateContactMethodDto {
  @ApiPropertyOptional({ enum: CONTACT_METHOD_TYPES })
  @IsOptional()
  @IsString()
  @IsIn([...CONTACT_METHOD_TYPES])
  contactType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
