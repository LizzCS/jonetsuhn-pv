import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { PREFIJO_TELEFONO_LOCAL } from '../../common/reglas-negocio.js';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Quita espacios, guiones, puntos y paréntesis. 8 dígitos sin prefijo se
// toman como número de Honduras: "9999-8888" → "+50499998888"
const normalizarTelefono = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;

  const limpio = value.replace(/[\s\-().]/g, '');
  return /^\d{8}$/.test(limpio) ? `${PREFIJO_TELEFONO_LOCAL}${limpio}` : limpio;
};

// Sin password = invitado (se le avisa del pedido por correo y teléfono).
// Con password = cuenta de cliente. Nadie se registra como admin.
export class CreatePersonaDto {
  @Transform(recortar)
  @IsString({ message: 'nombre debe ser texto' })
  @IsNotEmpty({ message: 'nombre es obligatorio' })
  @MaxLength(100, { message: 'nombre admite máximo 100 caracteres' })
  nombre!: string;

  @Transform(recortar)
  @IsString({ message: 'apellido debe ser texto' })
  @IsNotEmpty({ message: 'apellido es obligatorio' })
  @MaxLength(100, { message: 'apellido admite máximo 100 caracteres' })
  apellido!: string;

  @Transform(normalizarTelefono)
  @IsString({ message: 'telefono debe ser texto' })
  @Matches(/^\+\d{8,15}$/, {
    message:
      'telefono debe tener 8 dígitos (Honduras) o incluir el código de país, por ejemplo +1 555 123 4567',
  })
  telefono!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(254, { message: 'email admite máximo 254 caracteres' })
  email!: string;

  @IsOptional()
  @IsString({ message: 'password debe ser texto' })
  @Length(8, 128, { message: 'La contraseña debe tener entre 8 y 128 caracteres' })
  password?: string;
}
