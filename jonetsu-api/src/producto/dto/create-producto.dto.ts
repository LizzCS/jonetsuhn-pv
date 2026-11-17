import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// La imagen se sube aparte: PATCH /productos/:id/imagen
export class CreateProductoDto {
  @IsUUID('all', { message: 'id_categoria debe ser un UUID válido' })
  id_categoria!: string;

  @Transform(recortar)
  @IsString({ message: 'nombre debe ser texto' })
  @IsNotEmpty({ message: 'nombre es obligatorio' })
  @MaxLength(100, { message: 'nombre admite máximo 100 caracteres' })
  nombre!: string;

  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'descripcion debe ser texto' })
  @MaxLength(500, { message: 'descripcion admite máximo 500 caracteres' })
  descripcion?: string | null;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'precio debe ser un número con máximo 2 decimales' },
  )
  @IsPositive({ message: 'precio debe ser mayor que 0' })
  @Max(99999999, { message: 'precio es demasiado alto' })
  precio!: number;
}
