import { randomInt } from 'node:crypto';

import {
  CODIGO_ALFABETO,
  CODIGO_LONGITUD,
} from '../common/reglas-negocio.js';

// Genera un código como "K7M2-QX9P" (31^8 ≈ 850 mil millones de combinaciones)
export function generarCodigoAcceso(): string {
  let codigo = '';

  for (let i = 0; i < CODIGO_LONGITUD; i++) {
    codigo += CODIGO_ALFABETO[randomInt(CODIGO_ALFABETO.length)];
  }

  return `${codigo.slice(0, 4)}-${codigo.slice(4)}`;
}

// Acepta lo que escriba el usuario: minúsculas, espacios o sin guion
export function normalizarCodigoAcceso(valor: string): string {
  const limpio = valor.toUpperCase().replace(/[^0-9A-Z]/g, '');
  return limpio.length === CODIGO_LONGITUD
    ? `${limpio.slice(0, 4)}-${limpio.slice(4)}`
    : limpio;
}
