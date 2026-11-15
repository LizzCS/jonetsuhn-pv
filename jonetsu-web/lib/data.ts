// Datos de ejemplo. Cuando el admin y el API estén listos, se reemplazan por fetch al backend.
// Los campos siguen el esquema de Prisma (evento → Servicio, producto → Plato).

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

export const servicios: Servicio[] = [
  {
    id: "servicio-1",
    nombre: "Servicio 1",
    fecha: "2026-11-20",
    descripcion: "Descripción breve del lugar donde se hace y de los platos del servicio.",
  },
  {
    id: "servicio-2",
    nombre: "Servicio 2",
    fecha: "2026-11-21",
    descripcion: "Descripción breve del lugar donde se hace y de los platos del servicio.",
  },
  {
    id: "servicio-3",
    nombre: "Servicio 3",
    fecha: "2026-11-27",
    descripcion: "Descripción breve del lugar donde se hace y de los platos del servicio.",
  },
  {
    id: "servicio-4",
    nombre: "Servicio 4",
    fecha: "2026-11-28",
    descripcion: "Descripción breve del lugar donde se hace y de los platos del servicio.",
  },
];

export const platos: Plato[] = [
  {
    id: "plato-1",
    nombre: "Plato 1",
    descripcion: "Descripción del plato: ingredientes, porción y cómo se sirve.",
    precio: 120,
  },
  {
    id: "plato-2",
    nombre: "Plato 2",
    descripcion: "Descripción del plato: ingredientes, porción y cómo se sirve.",
    precio: 150,
  },
  {
    id: "plato-3",
    nombre: "Plato 3",
    descripcion: "Descripción del plato: ingredientes, porción y cómo se sirve.",
    precio: 180,
  },
];
