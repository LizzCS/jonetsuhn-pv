import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { CookieOptions, Request } from 'express';

import { rol_user } from '../generated/prisma/enums.js';
import type { UsuarioToken } from './decorators/usuario.decorator.js';

// Cookie de la sesión de una cuenta (login)
export const COOKIE_SESION = 'access_token';

// Cookie de un invitado: solo da acceso a los tickets que él creó
export const COOKIE_INVITADO = 'ticket_token';

// Cuánto dura el acceso de un invitado a sus tickets
export const DIAS_ACCESO_INVITADO = 7;

// Máximo de tickets que guarda la cookie de un invitado (los más nuevos)
export const MAX_TICKETS_INVITADO = 20;

// Payload firmado en la cookie del invitado. "tipo" lo distingue de un
// token de sesión para que no se pueda usar uno en lugar del otro.
export interface TokenInvitado {
  tipo: 'invitado';
  tickets: string[];
}

// Quién hace la petición. Puede tener sesión, cookie de invitado, ambas
// o ninguna (la arma AccesoGuard; cada servicio decide qué exige).
export interface Acceso {
  usuario?: UsuarioToken;
  ticketsInvitado: string[];
}

export function opcionesCookie(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: maxAgeMs,
    path: '/',
  };
}

export function esAdmin(acceso: Acceso): boolean {
  return acceso.usuario?.role === rol_user.admin;
}

// Admin, dueño del ticket (con sesión) o invitado que lo creó
export function puedeVerTicket(
  acceso: Acceso,
  ticket: { id_ticket: string; id_user: string },
): boolean {
  return (
    esAdmin(acceso) ||
    acceso.usuario?.sub === ticket.id_user ||
    acceso.ticketsInvitado.includes(ticket.id_ticket)
  );
}

export function exigirAccesoTicket(
  acceso: Acceso,
  ticket: { id_ticket: string; id_user: string },
) {
  if (!puedeVerTicket(acceso, ticket)) {
    throw new ForbiddenException('No tienes acceso a este pedido');
  }
}

// @AccesoActual() en un endpoint con @ConAcceso()
export const AccesoActual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Acceso => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (
      (request as Request & { acceso?: Acceso }).acceso ?? {
        ticketsInvitado: [],
      }
    );
  },
);
