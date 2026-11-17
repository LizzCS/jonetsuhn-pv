import { IsBoolean, IsOptional, IsUUID, Matches } from 'class-validator';

import { FORMATO_HORA } from '../../common/fechas.js';

export class CreateHorarioDto {
  @IsUUID('all', { message: 'id_evento debe ser un UUID válido' })
  id_evento!: string;

  @Matches(FORMATO_HORA, { message: 'hora debe tener formato HH:MM (24 horas)' })
  hora!: string;

  // false = la venta de esa hora está cerrada (llena o pausada por el admin)
  @IsOptional()
  @IsBoolean({ message: 'abierto debe ser true o false' })
  abierto?: boolean;
}
