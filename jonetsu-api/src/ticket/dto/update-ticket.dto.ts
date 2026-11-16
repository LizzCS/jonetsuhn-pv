import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { estado_ticket } from '../../generated/prisma/enums.js';

// Solo para el admin: el cliente no edita tickets. Si quiere cancelar,
// se comunica con el staff; si quiere cambiar platos antes de pagar,
// borra el ticket (DELETE) y crea uno nuevo desde su carrito.
export class UpdateTicketDto {
  // TODO(auth): quitar este campo y tomar el admin del token
  @IsUUID('all', { message: 'id_admin debe ser un UUID válido' })
  id_admin!: string;

  @IsOptional()
  @IsString({ message: 'notas debe ser texto' })
  @MaxLength(500, { message: 'notas admite máximo 500 caracteres' })
  notas?: string | null;

  @IsOptional()
  @IsIn([estado_ticket.cancelado], {
    message: 'Solo se permite cambiar el estado a cancelado',
  })
  estado?: typeof estado_ticket.cancelado;
}
