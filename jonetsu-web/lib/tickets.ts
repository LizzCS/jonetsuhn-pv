// Tipos del historial de pedidos. Los datos vienen del API
// (ver getMisTickets en lib/api.ts: ticket + horario + evento + ticket_item).

export type EstadoTicket =
  | "reservado"
  | "pago_en_revision"
  | "confirmado"
  | "entregado"
  | "cancelado";

export type TicketResumen = {
  id: string;
  codigoAcceso: string;
  servicio: string;
  fecha: string; // "YYYY-MM-DD"
  hora: string; // "HH:MM"
  estado: EstadoTicket;
  items: { id: string; nombre: string; cantidad: number; precioUnitario: number }[];
};

export const estadoLabel: Record<EstadoTicket, string> = {
  reservado: "Esperando pago",
  pago_en_revision: "Pago en revisión",
  confirmado: "Confirmado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function totalDe(t: TicketResumen) {
  return t.items.reduce((suma, i) => suma + i.cantidad * i.precioUnitario, 0);
}

// "19:00" -> "7:00 pm"
export function formatHora(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
