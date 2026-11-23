import { useSyncExternalStore } from "react";

// Sesión del navegador guardada en sessionStorage (dura lo que dura la
// pestaña). La autenticación real la lleva la cookie httpOnly access_token
// que pone el API; aquí solo guardamos los datos para mostrar en la UI.

export type Sesion = {
  tipo: "cliente" | "invitado"; // invitado = user sin password_hash
  id?: string; // id_user (solo clientes con cuenta)
  rol?: "cliente" | "admin";
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
};

const KEY = "jonetsu-sesion";
const oyentes = new Set<() => void>();
let cache: { raw: string | null; valor: Sesion | null } = { raw: null, valor: null };

function leer(): Sesion | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw !== cache.raw) {
      cache = { raw, valor: raw ? (JSON.parse(raw) as Sesion) : null };
    }
  } catch {
    cache = { raw: null, valor: null };
  }
  return cache.valor;
}

function suscribir(cb: () => void) {
  oyentes.add(cb);
  return () => {
    oyentes.delete(cb);
  };
}

function avisar() {
  oyentes.forEach((cb) => cb());
}

export function guardarSesion(s: Sesion) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // sin almacenamiento disponible: la sesión no persiste
  }
  avisar();
}

export function cerrarSesion() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // nada que borrar
  }
  avisar();
}

export function useSesion() {
  return useSyncExternalStore(suscribir, leer, () => null);
}

// false en el servidor y durante la hidratación; true ya en el navegador.
export function useMontado() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
