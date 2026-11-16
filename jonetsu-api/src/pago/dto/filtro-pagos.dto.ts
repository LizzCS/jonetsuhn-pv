import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { estado_pago } from '../../generated/prisma/enums.js';

// GET /pagos?estado=pendiente  → cola de revisión del admin
export class FiltroPagosDto {
  @IsOptional()
  @IsEnum(estado_pago, { message: 'estado no es válido' })
  estado?: estado_pago;

  @IsOptional()
  @IsUUID('all', { message: 'id_ticket debe ser un UUID válido' })
  id_ticket?: string;
}
