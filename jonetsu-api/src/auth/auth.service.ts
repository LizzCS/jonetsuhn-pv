import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { UserService } from '../user/user.service.js';
import type { UsuarioToken } from './decorators/usuario.decorator.js';
import { LoginDto } from './dto/login-dto.js';
import { RegisterDto } from './dto/register-dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
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

    const payload: UsuarioToken = {
      sub: user.id_user,
      email: user.email,
      role: user.rol,
    };

    const accessToken = await this.jwtService.signAsync(payload);

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

  // Misma lógica que POST /users: siempre crea clientes (los admin se
  // asignan aparte) y si el correo era de un invitado, lo convierte en
  // cuenta y conserva sus pedidos. La contraseña se guarda con bcrypt.
  async register(dto: RegisterDto) {
    const user = await this.userService.create(dto);

    return {
      message: 'Usuario registrado correctamente',
      user,
    };
  }
}
