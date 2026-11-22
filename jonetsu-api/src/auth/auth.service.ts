import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import type { UsuarioToken } from './decorators/usuario.decorator.js';
import { LoginDto } from './dto/login-dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
      select: {
        id_user: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        password_hash: true,
      },
    });

    // Invitados (sin contraseña) y cuentas desactivadas no inician sesión
    if (!user || !user.activo || !user.password_hash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const validPassword = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!validPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = await this.emitirToken(user);

    return {
      accessToken,
      user: {
        id_user: user.id_user,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    };
  }

  // Token de sesión (cookie access_token) para un user ya validado:
  // al iniciar sesión o justo después de verificar el correo
  emitirToken(user: {
    id_user: string;
    email: string;
    rol: UsuarioToken['role'];
  }): Promise<string> {
    const payload: UsuarioToken = {
      sub: user.id_user,
      email: user.email,
      role: user.rol,
    };

    return this.jwtService.signAsync(payload);
  }
}
