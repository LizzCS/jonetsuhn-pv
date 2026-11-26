import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { COOKIE_SESION } from '../acceso.js';
import { esTokenSesion } from '../acceso.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => request?.cookies?.[COOKIE_SESION],
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  // Rechaza tokens que no son de sesión (p. ej. el de un invitado,
  // que va firmado con el mismo secreto)
  validate(payload: { sub?: unknown; role?: unknown; tipo?: unknown }) {
    if (!esTokenSesion(payload)) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
