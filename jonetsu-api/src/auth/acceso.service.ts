import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';

import { rol_user } from '../generated/prisma/enums.js';
import type { UsuarioToken } from './decorators/usuario.decorator.js';
import {
  COOKIE_INVITADO,
  COOKIE_SESION,
  DIAS_ACCESO_INVITADO,
  MAX_TICKETS_INVITADO,
  opcionesCookie,
} from './acceso.js';
import type { Acceso, TokenInvitado } from './acceso.js';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

@Injectable()
export class AccesoService {
  constructor(private readonly jwt: JwtService) {}

  // Verifica ambas cookies. Un token inválido o vencido se ignora.
  async leer(
    cookies: Record<string, string | undefined> = {},
  ): Promise<Acceso> {
    const [usuario, ticketsInvitado] = await Promise.all([
      this.leerSesion(cookies[COOKIE_SESION]),
      this.leerInvitado(cookies[COOKIE_INVITADO]),
    ]);

    return { usuario, ticketsInvitado };
  }

  // Agrega el ticket a la cookie del invitado (conserva los anteriores)
  async darAccesoInvitado(res: Response, acceso: Acceso, id_ticket: string) {
    const tickets = [
      ...acceso.ticketsInvitado.filter((id) => id !== id_ticket),
      id_ticket,
    ].slice(-MAX_TICKETS_INVITADO);

    const payload: TokenInvitado = { tipo: 'invitado', tickets };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: `${DIAS_ACCESO_INVITADO}d`,
    });

    res.cookie(
      COOKIE_INVITADO,
      token,
      opcionesCookie(DIAS_ACCESO_INVITADO * MS_POR_DIA),
    );
  }

  private async leerSesion(
    token: string | undefined,
  ): Promise<UsuarioToken | undefined> {
    if (!token) return undefined;

    try {
      const payload = await this.jwt.verifyAsync<
        UsuarioToken & { tipo?: string }
      >(token);

      return esTokenSesion(payload)
        ? { sub: payload.sub, email: payload.email, role: payload.role }
        : undefined;
    } catch {
      return undefined;
    }
  }

  private async leerInvitado(token: string | undefined): Promise<string[]> {
    if (!token) return [];

    try {
      const payload = await this.jwt.verifyAsync<Partial<TokenInvitado>>(token);

      return payload.tipo === 'invitado' && Array.isArray(payload.tickets)
        ? payload.tickets.filter((id) => typeof id === 'string')
        : [];
    } catch {
      return [];
    }
  }
}

// Un token de sesión trae sub y un rol válido, y nunca "tipo"
// (así un token de invitado no sirve como sesión)
export function esTokenSesion(payload: {
  sub?: unknown;
  role?: unknown;
  tipo?: unknown;
}): payload is UsuarioToken {
  return (
    payload.tipo === undefined &&
    typeof payload.sub === 'string' &&
    Object.values(rol_user).includes(payload.role as rol_user)
  );
}
