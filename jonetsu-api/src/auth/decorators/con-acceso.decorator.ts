import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AccesoGuard } from '../guards/acceso.guard.js';

// Endpoint de un pedido: lo usan el admin, el dueño con sesión o el
// invitado con su cookie ticket_token. Leer el resultado con @AccesoActual().
export function ConAcceso() {
  return applyDecorators(
    UseGuards(AccesoGuard),
    ApiCookieAuth(),
    ApiCookieAuth('invitado'),
    ApiUnauthorizedResponse({
      description: 'Sin sesión ni cookie de invitado',
    }),
    ApiForbiddenResponse({ description: 'El pedido no es tuyo' }),
  );
}
