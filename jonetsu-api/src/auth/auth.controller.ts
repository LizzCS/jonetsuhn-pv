import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login-dto.js';
import { RegisterDto } from './dto/register-dto.js';
import { COOKIE_SESION, opcionesCookie } from './acceso.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie(
      COOKIE_SESION,
      result.accessToken,
      opcionesCookie(24 * 60 * 60 * 1000),
    );

    return {
      message: 'Inicio de sesión exitoso',
      user: result.user,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const { maxAge: _, ...opciones } = opcionesCookie(0);
    res.clearCookie(COOKIE_SESION, opciones);

    return {
      message: 'Sesión cerrada correctamente',
    };
  }
}
