import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { AccesoService } from '../acceso.service.js';

// Lee las cookies de sesión y de invitado y deja el resultado en
// request.acceso. Nunca rechaza: el servicio decide si hace falta
// sesión, ser dueño del ticket o ser admin.
@Injectable()
export class AccesoGuard implements CanActivate {
  constructor(private readonly accesoService: AccesoService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const acceso = await this.accesoService.leer(
      request.cookies as Record<string, string | undefined> | undefined,
    );

    (request as Request & { acceso?: unknown }).acceso = acceso;

    return true;
  }
}
