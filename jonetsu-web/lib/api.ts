// Cliente del API (jonetsu-api)
// La URL sale de NEXT_PUBLIC_API_URL en .env.local

import type { Plato, Servicio } from "./data";

const API_URL = "http://localhost:3000";

// Error con el mensaje que manda el backend
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---- Cliente HTTP genérico ----

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  // Agregar Content-Type solamente si hay body
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    let message = "Error en la solicitud";

    try {
      const error = await response.json();

      message = Array.isArray(error.message)
        ? error.message.join(", ")
        : (error.message ?? message);
    } catch {
      // Si el backend no devuelve JSON, usamos el mensaje genérico
    }

    throw new ApiError(response.status, message);
  }

  // Respuestas sin contenido (por ejemplo, DELETE con 204)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// Alias para hacer las llamadas más cortas
export const api = apiFetch;

// ---- Respuestas del backend (campos como en Prisma; Decimal llega como string) ----

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
  hora: string;
  abierto: boolean;
  productos: DisponibilidadApi[];
};

export type EventoApi = {
  id_evento: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  fecha: string;
  horarios: HorarioApi[];
};

// ---- Adaptadores a los tipos que ya usan los componentes ----

export const soloFecha = (iso: string) => iso.slice(0, 10);
export const soloHora = (iso: string) => iso.slice(11, 16);

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
    imagenUrl: p.imagen_url
      ? `${API_URL}/productos/${p.id_producto}/imagen`
      : null,
  };
}

// ---- Lecturas públicas ----

export async function getServicios(): Promise<Servicio[]> {
  const eventos = await api<EventoApi[]>("/eventos");
  return eventos.map(aServicio);
}

export async function getEvento(id: string): Promise<EventoApi> {
  return api<EventoApi>(`/eventos/${id}`);
}

export async function getPlatos(): Promise<Plato[]> {
  const productos = await api<ProductoApi[]>("/productos");
  return productos.map(aPlato);
}
