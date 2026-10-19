import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** بيانات دخول المشترك من صفحة الهوتسبوت → تحقق خارجي ثم عودة لـ link-login */
export class ExternalAuthLoginDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  username!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;

  @ApiProperty({ description: 'رابط /login على راوتر الهوتسبوت' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  linkLogin!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkOrig?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  mac?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ip?: string;
}
