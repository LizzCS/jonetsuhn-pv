import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { estado_ticket } from '../../generated/prisma/enums.js';

export class UpdateTicketDto {
  @IsOptional()
  @IsString({ message: 'notas debe ser texto' })
  @MaxLength(500, { message: 'notas admite máximo 500 caracteres' })
  notas?: string | null;

  // Solo se puede cancelar un ticket que todavía espera pago
  @IsOptional()
  @IsIn([estado_ticket.cancelado], {
    message: 'Solo se permite cambiar el estado a cancelado',
  })
  estado?: typeof estado_ticket.cancelado;

  // Obligatorio para editar tickets que ya no están en "reservado"
  // TODO(auth): quitar este campo y tomar el admin del token
  @IsOptional()
  @IsUUID('all', { message: 'id_admin debe ser un UUID válido' })
  id_admin?: string;
}
