import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login-dto.js';
import { RegisterDto } from './dto/register-dto.js';
import { ReenviarCodigoDto, VerificarCorreoDto } from './dto/verificar-dto.js';
import { VerificacionService } from './verificacion.service.js';
import { COOKIE_SESION, opcionesCookie } from './acceso.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificacion: VerificacionService,
  ) {}

  // Paso 1: manda un código de 6 dígitos al correo (la cuenta aún no existe)
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.verificacion.iniciarRegistro(registerDto);
  }

  // Paso 2: con el código correcto se crea la cuenta y queda la sesión iniciada
  @Post('verificar')
  async verificar(
    @Body() dto: VerificarCorreoDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.verificacion.verificar(dto.email, dto.codigo);
    const accessToken = await this.authService.emitirToken(user);

    res.cookie(COOKIE_SESION, accessToken, opcionesCookie(24 * 60 * 60 * 1000));

    return {
      message: 'Correo verificado. Tu cuenta está lista',
      user,
    };
  }

  // Código nuevo para un registro pendiente (máximo uno por minuto)
  @Post('reenviar-codigo')
  reenviarCodigo(@Body() dto: ReenviarCodigoDto) {
    return this.verificacion.reenviar(dto.email);
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
