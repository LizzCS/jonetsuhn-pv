import { ConflictException } from '@nestjs/common';

import { REINTENTOS_TRANSACCION } from './reglas-negocio.js';

// Identificar errores de Prisma por código (P2002, P2025, P2034...)
export function esErrorPrisma(error: unknown, codigo: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === codigo
  );
}

// Ejecuta una transacción y la reintenta si choca con otra (P2034).
// `codigosReintento` permite reintentar también otros errores, por
// ejemplo P2002 cuando se genera un código aleatorio repetido.
export async function conReintento<T>(
  operacion: () => Promise<T>,
  mensajeConflicto: string,
  codigosReintento: string[] = ['P2034'],
): Promise<T> {
  for (let intento = 1; ; intento++) {
    try {
      return await operacion();
    } catch (error) {
      const reintentable = codigosReintento.some((codigo) =>
        esErrorPrisma(error, codigo),
      );

      if (!reintentable) {
        throw error;
      }

      if (intento >= REINTENTOS_TRANSACCION) {
        throw new ConflictException(mensajeConflicto);
      }
    }
  }
}
