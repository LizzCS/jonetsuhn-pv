import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { Role } from '../decorators/role.enums.js';
import { ROLES_KEY } from '../decorators/roles.decorators.js';
import type { UsuarioToken } from '../decorators/usuario.decorator.js';

// Va después de JwtAuthGuard: compara el rol del token con @Roles(...)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si el endpoint no pide un rol, se permite
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UsuarioToken | undefined;

    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('No tienes permiso para acceder');
    }

    return true;
  }
}
