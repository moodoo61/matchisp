import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CONTACT_METHOD_TYPES } from '../constants/contact-method-types';

export class CreateContactMethodDto {
  @ApiProperty({ enum: CONTACT_METHOD_TYPES })
  @IsString()
  @IsIn([...CONTACT_METHOD_TYPES])
  contactType!: string;

  @ApiProperty({ description: 'العنوان الظاهر (contact_type_display)' })
  @IsString()
  @MinLength(1)
  displayName!: string;

  @ApiProperty({ description: 'القيمة: رقم / بريد / رابط' })
  @IsString()
  @MinLength(1)
  value!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
