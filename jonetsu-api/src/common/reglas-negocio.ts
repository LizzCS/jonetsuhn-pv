import { metodo_pago } from '../generated/prisma/enums.js';

// Tiempo de gracia para subir el comprobante. Si vence sin pago, el
// ticket pasa a "cancelado" (se conserva para que el admin lo revise)
export const MINUTOS_RESERVA = 20;

// Nuevo plazo cuando el admin rechaza el pago, el cliente borra su pago
// pendiente o el admin reactiva un ticket vencido
export const MINUTOS_REINTENTO_PAGO = 20;

// Cada cuánto se marcan como canceladas las reservas vencidas
export const SEGUNDOS_REVISION_VENCIDOS = 60;

// Zona horaria del negocio, para saber si un horario ya pasó
export const ZONA_HORARIA = 'America/Tegucigalpa';

// Reintentos cuando dos transacciones chocan (P2034)
export const REINTENTOS_TRANSACCION = 3;

// Métodos que acepta hoy la API. El enum del schema conserva "tarjeta"
// y "efectivo" para habilitarlos más adelante sin migración.
export const METODOS_PAGO_HABILITADOS: metodo_pago[] = [
  metodo_pago.transferencia,
];

// Imágenes subidas (comprobantes de pago, platos y servicios)
export const IMAGEN_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGEN_TIPOS = /^image\/(jpeg|png|webp)$/;
export const COMPROBANTE_CAMPO = 'comprobante';
export const IMAGEN_CAMPO = 'imagen';

// Teléfonos: 8 dígitos sin prefijo se toman como de Honduras
export const PREFIJO_TELEFONO_LOCAL = '+504';

// Código de acceso del ticket: 8 caracteres sin 0/O, 1/I/L para que
// no se confundan al leerlos, mostrados como XXXX-XXXX
export const CODIGO_ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const CODIGO_LONGITUD = 8;
export const CODIGO_FORMATO = /^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;
