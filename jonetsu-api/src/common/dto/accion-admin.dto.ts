import { IsUUID } from 'class-validator';

// Body de las acciones que solo hace un admin (reembolsar, reactivar...)
export class AccionAdminDto {
  // TODO(auth): quitar este campo y tomar el admin del token
  @IsUUID('all', { message: 'id_admin debe ser un UUID válido' })
  id_admin!: string;
}
