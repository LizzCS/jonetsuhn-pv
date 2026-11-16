import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsInt,
} from 'class-validator';

/**
 * Table horario {
  id_horario uuid [primary key]
  id_evento uuid [not null, ref: > evento.id_evento]
  hora time [not null]
  abierto boolean [default: true]

  indexes {
    (id_evento, hora) [unique]
  }
}

Table horario_producto {
  id_horario uuid [not null, ref: > horario.id_horario]
  id_producto uuid [not null, ref: > inventario.id_producto]
  cupo_total int [not null]

  indexes {
    (id_horario, id_producto) [pk]
  }
}
 * 
 */

export class CreateHorarioDto {
  @IsUUID()
  @IsString()
  id_evento: string;

  @IsString()
  hora: string;

  @IsOptional()
  @IsBoolean()
  abierto?: boolean;
}

export class CreateHorarioProductoDto {
  @IsUUID()
  id_horario: string;

  @IsUUID()
  id_producto: string;

  @IsInt()
  cupo_total: number;
}
