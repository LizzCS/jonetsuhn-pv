import { useSyncExternalStore } from "react";

// Sesión de PROTOTIPO guardada en el navegador (localStorage).
// Cuando exista el login en el backend, se reemplaza por la sesión real
// (cookie o token) y estas funciones se conectan al API.

export type Sesion = {
  tipo: "cliente" | "invitado"; // invitado = persona sin password_hash
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
    const raw = window.localStorage.getItem(KEY);
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
  window.addEventListener("storage", cb);
  return () => {
    oyentes.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function avisar() {
  oyentes.forEach((cb) => cb());
}

export function guardarSesion(s: Sesion) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // sin almacenamiento disponible: la sesión no persiste
  }
  avisar();
}

export function cerrarSesion() {
  try {
    window.localStorage.removeItem(KEY);
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
