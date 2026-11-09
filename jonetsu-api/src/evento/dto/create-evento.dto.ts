export class CreateEventoDto {
  nombre!: string;
  descripcion?: string | null;
  fecha!: string;
  activo?: boolean;
}
