import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { FORMATO_FECHA } from '../../common/fechas.js';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Un evento es un día de servicio. La imagen se sube aparte:
// PATCH /eventos/:id/imagen
export class CreateEventoDto {
  @Transform(recortar)
  @IsString({ message: 'nombre debe ser texto' })
  @IsNotEmpty({ message: 'nombre es obligatorio' })
  @MaxLength(150, { message: 'nombre admite máximo 150 caracteres' })
  nombre!: string;

  // Lugar y platos del servicio, breve
  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'descripcion debe ser texto' })
  @MaxLength(1000, { message: 'descripcion admite máximo 1000 caracteres' })
  descripcion?: string | null;

  @Matches(FORMATO_FECHA, { message: 'fecha debe tener formato AAAA-MM-DD' })
  fecha!: string;
}
