/**
 * Table inventario {
  id_producto uuid [primary key]
  id_categoria uuid [not null, ref: > categoria.id_categoria]
  nombre varchar(100) [not null]
  precio decimal(10,2) [not null]
  activo boolean [default: true]
}
 */

import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  IsEmpty,
} from 'class-validator';

export class CreateProductoDto {
  @IsNotEmpty()
  @IsUUID()
  id_producto!: string;

  @IsNotEmpty()
  @IsUUID()
  id_categoria!: string;

  @IsString()
  descripcion?: string | null;

  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @IsNotEmpty()
  @IsNumber()
  precio!: number;
}
