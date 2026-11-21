import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Role } from './role.enums.js';
import { Roles } from './roles.decorators.js';

// Endpoint solo para admins: exige sesión (cookie) y rol admin en el token.
// El servicio además revisa en la BD que el admin siga activo (exigirAdmin).
export function SoloAdmin() {
  return applyDecorators(
    Roles(Role.admin),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiCookieAuth(),
    ApiUnauthorizedResponse({ description: 'No hay sesión iniciada' }),
    ApiForbiddenResponse({ description: 'Solo un administrador' }),
  );
}
