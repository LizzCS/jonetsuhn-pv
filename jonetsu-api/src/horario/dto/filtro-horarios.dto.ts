import { IsOptional, IsUUID } from 'class-validator';

// GET /horarios?id_evento=
export class FiltroHorariosDto {
  @IsOptional()
  @IsUUID('all', { message: 'id_evento debe ser un UUID válido' })
  id_evento?: string;
}
