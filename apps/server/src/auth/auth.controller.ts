import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { GoogleDto } from './dto/google.dto';
import { RefreshDto } from './dto/refresh.dto';

import { JwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('google')
  google(
    @Body() body: GoogleDto,
  ) {
    return this.authService.loginWithGoogle(
      body.idToken,
    );
  }

  @Post('refresh')
  refresh(
    @Body() body: RefreshDto,
  ) {
    return this.authService.refreshToken(
      body.refreshToken,
    );
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  logout(
    @Req() req: any,
  ) {
    return this.authService.logout(
      req.user.userId,
    );
  }
}
