import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

// Junta los mensajes de todos los errores, incluidos los de objetos
// anidados (items[0].cantidad), y traduce el de campos no permitidos.
function mensajes(errores: ValidationError[], prefijo = ''): string[] {
  return errores.flatMap((error) => {
    const campo = `${prefijo}${error.property}`;

    const propios = Object.entries(error.constraints ?? {}).map(
      ([regla, mensaje]) =>
        regla === 'whitelistValidation'
          ? `El campo "${campo}" no está permitido`
          : mensaje,
    );

    return [...propios, ...mensajes(error.children ?? [], `${campo}.`)];
  });
}

// Pipe global (main.ts) para los DTOs con decoradores de class-validator
export const validacionDto = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errores) => new BadRequestException(mensajes(errores)),
});
