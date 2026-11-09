export class CreateTicketItemDto {
  id_producto!: string;
  cantidad!: number;
}

export class CreateTicketDto {
  id_persona!: string;
  id_horario!: string;
  items!: CreateTicketItemDto[];
  notas?: string | null;
}
