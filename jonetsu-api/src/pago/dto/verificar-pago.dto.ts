import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { estado_pago } from '../../generated/prisma/enums.js';

export class VerificarPagoDto {
  @IsIn([estado_pago.verificado, estado_pago.rechazado], {
    message: 'estado debe ser verificado o rechazado',
  })
  estado!: typeof estado_pago.verificado | typeof estado_pago.rechazado;

  // Obligatorio al rechazar, para que el cliente sepa qué corregir
  @ValidateIf((dto: VerificarPagoDto) => dto.estado === estado_pago.rechazado)
  @IsString({ message: 'motivo_rechazo debe ser texto' })
  @IsNotEmpty({ message: 'Indica el motivo del rechazo' })
  @MaxLength(300, { message: 'motivo_rechazo admite máximo 300 caracteres' })
  motivo_rechazo?: string;
}
