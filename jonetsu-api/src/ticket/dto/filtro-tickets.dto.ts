import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { estado_ticket } from '../../generated/prisma/enums.js';

// GET /tickets?id_user=...&estado=...
export class FiltroTicketsDto {
  // TODO(auth): un cliente solo debe ver sus propios tickets
  @IsOptional()
  @IsUUID('all', { message: 'id_user debe ser un UUID válido' })
  id_user?: string;

  @IsOptional()
  @IsEnum(estado_ticket, { message: 'estado no es válido' })
  estado?: estado_ticket;
}
