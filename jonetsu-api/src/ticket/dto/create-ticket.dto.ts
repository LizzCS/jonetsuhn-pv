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

export class CreateTicketItemDto {
  @IsUUID('all', { message: 'id_producto debe ser un UUID válido' })
  id_producto!: string;

  @IsInt({ message: 'cantidad debe ser un número entero' })
  @Min(1, { message: 'cantidad debe ser al menos 1' })
  cantidad!: number;
}

export class CreateTicketDto {
  // TODO(auth): tomar id_persona del token cuando exista el login
  @IsUUID('all', { message: 'id_persona debe ser un UUID válido' })
  id_persona!: string;

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
