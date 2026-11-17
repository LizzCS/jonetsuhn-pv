import { IsIn, IsOptional, IsUUID } from 'class-validator';

import { metodo_pago } from '../../generated/prisma/enums.js';
import { METODOS_PAGO_HABILITADOS } from '../../common/reglas-negocio.js';

// Llega como multipart/form-data junto con el archivo "comprobante".
// El monto no se recibe: el servidor cobra el total del ticket.
export class CreatePagoDto {
  @IsUUID('all', { message: 'id_ticket debe ser un UUID válido' })
  id_ticket!: string;

  @IsOptional()
  @IsIn(METODOS_PAGO_HABILITADOS, {
    message: `Métodos de pago aceptados: ${METODOS_PAGO_HABILITADOS.join(', ')}`,
  })
  metodo?: metodo_pago;
}
