// Cliente del API (jonetsu-api)
// La URL sale de NEXT_PUBLIC_API_URL en .env.local

import type { Plato, Servicio } from "./data";
import type { Sesion } from "./session";
import type { EstadoTicket, TicketResumen } from "./tickets";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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

// ---- Cuenta y sesión (la cookie httpOnly access_token la pone el API) ----

export type UsuarioApi = {
  id_user: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  rol: "cliente" | "admin";
};

export type DatosRegistro = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
};

type RespuestaCodigo = { message: string; email: string; minutos: number };

const post = (body: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
});

// Datos que guardamos en sessionStorage para la UI
export function aSesion(u: UsuarioApi): Sesion {
  return {
    tipo: "cliente",
    id: u.id_user,
    rol: u.rol,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    telefono: u.telefono,
  };
}

// El login solo devuelve nombre y correo; pedimos el perfil completo
export async function login(email: string, password: string): Promise<UsuarioApi> {
  const r = await api<{ user: { id_user: string } }>(
    "/auth/login",
    post({ email, password }),
  );
  return api<UsuarioApi>(`/users/${r.user.id_user}`);
}

// Paso 1 del registro: el API manda un código de 6 dígitos al correo
export function registrar(datos: DatosRegistro) {
  return api<RespuestaCodigo>("/auth/register", post(datos));
}

// Paso 2: con el código correcto se crea la cuenta y queda la sesión iniciada
export async function verificarCorreo(email: string, codigo: string) {
  const r = await api<{ user: UsuarioApi }>("/auth/verificar", post({ email, codigo }));
  return r.user;
}

export function reenviarCodigo(email: string) {
  return api<RespuestaCodigo>("/auth/reenviar-codigo", post({ email }));
}

export function logout() {
  return api<{ message: string }>("/auth/logout", { method: "POST" });
}

// ---- Historial de pedidos ----

type TicketApi = {
  id_ticket: string;
  codigo_acceso: string;
  estado: EstadoTicket;
  horario: { hora: string; evento: { nombre: string; fecha: string } };
  items: {
    id_item: string;
    cantidad: number;
    precio_unitario: string | number;
    producto: { nombre: string };
  }[];
};

export async function getMisTickets(): Promise<TicketResumen[]> {
  const tickets = await api<TicketApi[]>("/tickets");
  return tickets.map((t) => ({
    id: t.id_ticket,
    codigoAcceso: t.codigo_acceso,
    servicio: t.horario.evento.nombre,
    fecha: soloFecha(t.horario.evento.fecha),
    hora: soloHora(t.horario.hora),
    estado: t.estado,
    items: t.items.map((i) => ({
      id: i.id_item,
      nombre: i.producto.nombre,
      cantidad: i.cantidad,
      precioUnitario: Number(i.precio_unitario),
    })),
  }));
}
