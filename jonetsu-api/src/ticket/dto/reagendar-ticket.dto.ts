import { IsUUID } from 'class-validator';

// El admin mueve un ticket confirmado a otro horario (fuerza mayor).
// Se conservan los mismos platos, cantidades, total y código de acceso.
export class ReagendarTicketDto {
  // TODO(auth): quitar este campo y tomar el admin del token
  @IsUUID('all', { message: 'id_admin debe ser un UUID válido' })
  id_admin!: string;

  @IsUUID('all', { message: 'id_horario debe ser un UUID válido' })
  id_horario!: string;
}
