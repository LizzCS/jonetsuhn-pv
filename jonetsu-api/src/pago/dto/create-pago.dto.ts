export class CreatePagoDto {
  id_ticket!: string;
  monto!: string | number;
  metodo!: 'transferencia' | 'efectivo' | 'tarjeta';
  comprobante_url?: string | null;
}
