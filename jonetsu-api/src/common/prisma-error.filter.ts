import {
  ArgumentsHost,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { Prisma } from '../generated/prisma/client.js';

// Convierte los errores conocidos de Prisma en respuestas claras en vez
// de un 500. Los servicios pueden lanzar mensajes más específicos antes.
const RESPUESTAS: Record<string, () => HttpException> = {
  P2002: () => new ConflictException('Ya existe un registro con esos datos'),
  P2003: () =>
    new ConflictException('El registro está relacionado con otros datos'),
  P2025: () => new NotFoundException('El registro no existe'),
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaErrorFilter extends BaseExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const respuesta = RESPUESTAS[error.code];

    super.catch(respuesta ? respuesta() : error, host);
  }
}
