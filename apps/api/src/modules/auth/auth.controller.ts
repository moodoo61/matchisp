import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from './auth.dto';
import {
  CurrentUser,
  JwtAuthGuard,
  Public,
  type RequestUser,
} from '../../common/guards';

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto.username, dto.password, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @ApiBearerAuth()
  @Post('logout')
  logout(@Body() dto: RefreshDto, @CurrentUser() user: RequestUser) {
    return this.auth.logout(dto.refreshToken, user.id);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.auth.me(user.id);
  }
}
