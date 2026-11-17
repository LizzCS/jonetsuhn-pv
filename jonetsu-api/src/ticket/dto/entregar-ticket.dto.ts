import { IsString, IsUUID, Length } from 'class-validator';

export class EntregarTicketDto {
  // Se normaliza en el servicio: acepta "k7m2qx9p", "K7M2-QX9P", etc.
  @IsString({ message: 'codigo_acceso debe ser texto' })
  @Length(8, 12, { message: 'codigo_acceso no es válido' })
  codigo_acceso!: string;

  // TODO(auth): quitar este campo y tomar el admin del token
  @IsUUID('all', { message: 'id_admin debe ser un UUID válido' })
  id_admin!: string;
}
