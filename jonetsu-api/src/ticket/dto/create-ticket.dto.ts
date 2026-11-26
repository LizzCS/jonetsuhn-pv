import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OmitType } from '@nestjs/swagger';

import { CreateUserDto } from '../../user/dto/create-user.dto.js';

export class CreateTicketItemDto {
  @IsUUID('all', { message: 'id_producto debe ser un UUID válido' })
  id_producto!: string;

  @IsInt({ message: 'cantidad debe ser un número entero' })
  @Min(1, { message: 'cantidad debe ser al menos 1' })
  cantidad!: number;
}

// Datos de contacto de quien compra sin cuenta
export class DatosInvitadoDto extends OmitType(CreateUserDto, [
  'password',
] as const) {}

export class CreateTicketDto {
  // Con sesión, el pedido es del usuario del token y esto se ignora.
  // Sin sesión es obligatorio: se crea (o reutiliza) el invitado por correo.
  @IsOptional()
  @ValidateNested()
  @Type(() => DatosInvitadoDto)
  invitado?: DatosInvitadoDto;

  @IsUUID('all', { message: 'id_horario debe ser un UUID válido' })
  id_horario!: string;

  @IsArray({ message: 'items debe ser una lista' })
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un producto' })
  @ArrayUnique((item: CreateTicketItemDto) => item.id_producto, {
    message: 'No repitas productos: usa la cantidad',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateTicketItemDto)
  items!: CreateTicketItemDto[];

  @IsOptional()
  @IsString({ message: 'notas debe ser texto' })
  @MaxLength(500, { message: 'notas admite máximo 500 caracteres' })
  notas?: string | null;
}
