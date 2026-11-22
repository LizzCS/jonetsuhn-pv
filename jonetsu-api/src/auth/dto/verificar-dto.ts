import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const normalizarEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// POST /auth/reenviar-codigo
export class ReenviarCodigoDto {
  @Transform(normalizarEmail)
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(254, { message: 'email admite máximo 254 caracteres' })
  email!: string;
}

// POST /auth/verificar
export class VerificarCorreoDto extends ReenviarCodigoDto {
  // Acepta "123 456" o "123-456"
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[\s-]/g, '') : value,
  )
  @IsString({ message: 'codigo debe ser texto' })
  @Matches(/^\d{6}$/, { message: 'El código tiene 6 dígitos' })
  codigo!: string;
}
