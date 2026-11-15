// Pedidos de ejemplo para el historial. Más adelante vienen del API
// (ticket + horario + evento + ticket_item).

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
  items: { nombre: string; cantidad: number; precioUnitario: number }[];
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

export const tickets: TicketResumen[] = [
  {
    id: "t-4",
    codigoAcceso: "JN-4821",
    servicio: "Servicio 2",
    fecha: "2026-11-21",
    hora: "19:00",
    estado: "pago_en_revision",
    items: [
      { nombre: "Plato 1", cantidad: 2, precioUnitario: 120 },
      { nombre: "Plato 3", cantidad: 1, precioUnitario: 180 },
    ],
  },
  {
    id: "t-3",
    codigoAcceso: "JN-4710",
    servicio: "Servicio 1",
    fecha: "2026-11-20",
    hora: "18:00",
    estado: "confirmado",
    items: [
      { nombre: "Plato 2", cantidad: 1, precioUnitario: 150 },
      { nombre: "Plato 1", cantidad: 1, precioUnitario: 120 },
    ],
  },
  {
    id: "t-2",
    codigoAcceso: "JN-3956",
    servicio: "Servicio 4",
    fecha: "2026-10-15",
    hora: "19:00",
    estado: "entregado",
    items: [{ nombre: "Plato 3", cantidad: 2, precioUnitario: 180 }],
  },
  {
    id: "t-1",
    codigoAcceso: "JN-3702",
    servicio: "Servicio 3",
    fecha: "2026-10-02",
    hora: "20:00",
    estado: "cancelado",
    items: [{ nombre: "Plato 2", cantidad: 2, precioUnitario: 150 }],
  },
];
