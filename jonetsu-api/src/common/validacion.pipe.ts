import { ValidationPipe } from '@nestjs/common';

// Pipe de validación para los DTOs con decoradores de class-validator.
// Se aplica por controlador (@UsePipes) mientras los demás módulos
// terminan de migrar sus DTOs; luego se puede registrar global en main.ts.
export const validacionDto = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
