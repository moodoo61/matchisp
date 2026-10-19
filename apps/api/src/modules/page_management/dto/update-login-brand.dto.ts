import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLoginBrandDto {
  @ApiPropertyOptional({
    description: 'استخدام اسم/شعار مخصص بدل إعدادات العلامة العامة',
  })
  @IsOptional()
  @IsBoolean()
  useCustom?: boolean;

  @ApiPropertyOptional({ description: 'اسم العلامة المخصص لصفحة الدخول' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'رابط شعار مخصص لصفحة الدخول' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;
}
