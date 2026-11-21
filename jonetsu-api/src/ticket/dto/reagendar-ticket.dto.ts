import { IsUUID } from 'class-validator';

// El admin mueve un ticket confirmado a otro horario (fuerza mayor).
// Se conservan los mismos platos, cantidades, total y código de acceso.
export class ReagendarTicketDto {
  @IsUUID('all', { message: 'id_horario debe ser un UUID válido' })
  id_horario!: string;
}
