import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { Role } from './role.enums.js';

// Payload que firma AuthService.login y devuelve JwtStrategy.validate
export interface UsuarioToken {
  sub: string; // id_user
  email: string;
  role: Role;
}

// Usuario del token en un endpoint protegido con JwtAuthGuard.
// @Usuario() da el payload completo; @Usuario('sub') solo el id_user.
export const Usuario = createParamDecorator(
  (campo: keyof UsuarioToken | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const usuario = request.user as UsuarioToken;

    return campo ? usuario[campo] : usuario;
  },
);
