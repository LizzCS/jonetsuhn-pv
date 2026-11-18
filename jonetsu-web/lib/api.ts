// Cliente del API (jonetsu-api). La URL sale de NEXT_PUBLIC_API_URL en .env.local
import type { Plato, Servicio } from "./data";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

// Error con el mensaje que manda el backend (los DTO ya traen mensajes en español)
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const esFormData = init.body instanceof FormData;
  let res: Response;

  try {
    res = await fetch(`${API_URL}${ruta}`, {
      cache: "no-store",
      ...init,
      headers: {
        ...(init.body && !esFormData && { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Intenta de nuevo.");
  }

  const texto = await res.text();
  const datos = texto ? JSON.parse(texto) : null;

  if (!res.ok) {
    const msg = Array.isArray(datos?.message) ? datos.message.join(". ") : datos?.message;
    throw new ApiError(res.status, msg ?? `Error ${res.status}`);
  }

  return datos as T;
}

// ---- Respuestas del backend (campos como en Prisma; Decimal llega como string)

type ProductoApi = {
  id_producto: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  precio: string | number;
};

export type DisponibilidadApi = {
  id_producto: string;
  nombre: string;
  precio: string | number;
  cupo_total: number;
  disponibles: number;
};

export type HorarioApi = {
  id_horario: string;
  hora: string; // "1970-01-01T19:00:00.000Z"
  abierto: boolean;
  productos: DisponibilidadApi[];
};

export type EventoApi = {
  id_evento: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  fecha: string; // "2026-11-20T00:00:00.000Z"
  horarios: HorarioApi[];
};

// ---- Adaptadores a los tipos que ya usan los componentes

export const soloFecha = (iso: string) => iso.slice(0, 10); // "YYYY-MM-DD"
export const soloHora = (iso: string) => iso.slice(11, 16); // "HH:MM"

function aServicio(e: EventoApi): Servicio {
  return {
    id: e.id_evento,
    nombre: e.nombre,
    fecha: soloFecha(e.fecha),
    descripcion: e.descripcion ?? "",
    imagenUrl: e.imagen_url ? `${API_URL}/eventos/${e.id_evento}/imagen` : null,
  };
}

function aPlato(p: ProductoApi): Plato {
  return {
    id: p.id_producto,
    nombre: p.nombre,
    descripcion: p.descripcion ?? "",
    precio: Number(p.precio),
    imagenUrl: p.imagen_url ? `${API_URL}/productos/${p.id_producto}/imagen` : null,
  };
}

// ---- Lecturas públicas

export async function getServicios(): Promise<Servicio[]> {
  return (await api<EventoApi[]>("/eventos")).map(aServicio);
}

export async function getEvento(id: string): Promise<EventoApi> {
  return api<EventoApi>(`/eventos/${id}`);
}

export async function getPlatos(): Promise<Plato[]> {
  return (await api<ProductoApi[]>("/productos")).map(aPlato);
}
