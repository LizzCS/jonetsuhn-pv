// Tipos que usan los componentes. Los datos vienen del API (ver lib/api.ts):
// evento → Servicio, producto → Plato.

export type Servicio = {
  id: string;
  nombre: string;
  fecha: string; // "YYYY-MM-DD"
  descripcion: string; // lugar donde se hace y qué platos, breve
  imagenUrl?: string | null;
};

export type Plato = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string | null;
};

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// "2026-11-20" -> "20 de noviembre" (sin Date, para que servidor y navegador den lo mismo)
export function formatFecha(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${Number(dia)} de ${MESES[Number(mes) - 1]}`;
}
