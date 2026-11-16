import { IsInt, IsUUID, Max, Min } from 'class-validator';

// PATCH /horarios/:id/productos/:id_producto
export class UpdateCupoDto {
  @IsInt({ message: 'cupo_total debe ser un número entero' })
  @Min(0, { message: 'cupo_total no puede ser negativo' })
  @Max(10000, { message: 'cupo_total es demasiado alto' })
  cupo_total!: number;
}

// POST /horarios/:id/productos
export class AsignarProductoDto extends UpdateCupoDto {
  @IsUUID('all', { message: 'id_producto debe ser un UUID válido' })
  id_producto!: string;
}
