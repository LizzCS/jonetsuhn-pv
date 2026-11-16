import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

// Igual que ParseUUIDPipe pero con el mensaje en español.
// Uso: @Param('id', idValido) id: string
export const idValido = new ParseUUIDPipe({
  exceptionFactory: () =>
    new BadRequestException('El id de la ruta debe ser un UUID válido'),
});
