import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateExtensionDto {
  @ApiProperty({ example: '1001' })
  @IsString()
  @Matches(/^[0-9]{2,8}$/, {
    message: 'الرقم الداخلي يجب أن يكون من 2 إلى 8 أرقام',
  })
  number!: string;

  @ApiProperty({ example: 'المكتب الرئيسي' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @ApiProperty({ example: 'SecretPass1' })
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  secret!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ default: 'from-internal' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  context?: string;
}
