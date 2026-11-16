import { ZONA_HORARIA } from './reglas-negocio.js';

// Fecha y hora actuales en la zona del negocio, como "AAAA-MM-DD HH:MM"
export function ahoraLocal(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const valor = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? '00';

  return `${valor('year')}-${valor('month')}-${valor('day')} ${valor('hour')}:${valor('minute')}`;
}

// Une la fecha del evento (@db.Date) y la hora del horario (@db.Time)
// en "AAAA-MM-DD HH:MM". Prisma devuelve ambas como Date en UTC.
export function fechaHoraEvento(fecha: Date, hora: Date): string {
  return `${fecha.toISOString().slice(0, 10)} ${hora.toISOString().slice(11, 16)}`;
}

export function minutosDesdeAhora(minutos: number): Date {
  return new Date(Date.now() + minutos * 60 * 1000);
}
