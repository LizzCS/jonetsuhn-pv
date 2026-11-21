import type { Prisma } from '../generated/prisma/client.js';

export type MotivoCorreoTicket = 'confirmado' | 'reagendado';

type TicketCorreo = Prisma.ticketGetPayload<{
  include: {
    user: { select: { nombre: true; apellido: true; email: true } };
    horario: { include: { evento: true } };
    items: { include: { producto: { select: { nombre: true } } } };
  };
}>;

// Los nombres, productos y notas los escriben usuarios: se escapan
function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function lempiras(valor: Prisma.Decimal): string {
  return `L ${Number(valor).toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// @db.Date y @db.Time llegan como Date en UTC: se formatean en UTC
// para no correr el día/hora por la zona del servidor
function fechaLarga(fecha: Date): string {
  return new Intl.DateTimeFormat('es-HN', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

function horaCorta(hora: Date): string {
  return new Intl.DateTimeFormat('es-HN', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(hora);
}

export function plantillaTicket(
  ticket: TicketCorreo,
  motivo: MotivoCorreoTicket,
) {
  const evento = ticket.horario.evento;
  const fecha = fechaLarga(evento.fecha);
  const hora = horaCorta(ticket.horario.hora);
  const nombre = ticket.user.nombre;

  const asunto =
    motivo === 'confirmado'
      ? `Pedido confirmado: ${evento.nombre} · Código ${ticket.codigo_acceso}`
      : `Tu pedido fue reagendado: ${evento.nombre} · Código ${ticket.codigo_acceso}`;

  const intro =
    motivo === 'confirmado'
      ? 'Verificamos tu pago y tu pedido está confirmado.'
      : 'Tu pedido fue movido a un nuevo horario. Tu código de acceso sigue siendo el mismo.';

  const items = ticket.items.map((item) => ({
    nombre: item.producto.nombre,
    cantidad: item.cantidad,
    subtotal: lempiras(item.precio_unitario.mul(item.cantidad)),
  }));

  const filasHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${item.cantidad} × ${escapar(item.nombre)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${item.subtotal}</td>
        </tr>`,
    )
    .join('');

  const notasHtml = ticket.notas
    ? `<p style="margin:16px 0 0;color:#555"><strong>Notas:</strong> ${escapar(ticket.notas)}</p>`
    : '';

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
    <h1 style="margin:0 0 8px;font-size:22px">¡Hola, ${escapar(nombre)}!</h1>
    <p style="margin:0 0 24px;color:#52525b">${intro}</p>

    <div style="text-align:center;background:#fafafa;border:2px dashed #d4d4d8;border-radius:10px;padding:20px;margin-bottom:24px">
      <div style="font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:1px">Código de acceso</div>
      <div style="font-size:34px;font-weight:bold;letter-spacing:4px;margin-top:6px;font-family:'Courier New',monospace">${ticket.codigo_acceso}</div>
      <div style="font-size:13px;color:#71717a;margin-top:6px">Muéstralo al llegar para recibir tu pedido</div>
    </div>

    <p style="margin:0 0 4px"><strong>${escapar(evento.nombre)}</strong></p>
    <p style="margin:0 0 20px;color:#52525b">${fecha} · ${hora}</p>

    <table style="width:100%;border-collapse:collapse;font-size:15px">
      ${filasHtml}
      <tr>
        <td style="padding:12px 0 0;font-weight:bold">Total pagado</td>
        <td style="padding:12px 0 0;font-weight:bold;text-align:right">${lempiras(ticket.total)}</td>
      </tr>
    </table>
    ${notasHtml}

    <p style="margin:28px 0 0;font-size:12px;color:#a1a1aa">El pedido solo se entrega el día del servicio. No compartas este código.</p>
  </div>
</body>
</html>`;

  const texto = [
    `¡Hola, ${nombre}!`,
    intro,
    '',
    `CÓDIGO DE ACCESO: ${ticket.codigo_acceso}`,
    'Muéstralo al llegar para recibir tu pedido.',
    '',
    `${evento.nombre} — ${fecha} · ${hora}`,
    ...items.map(
      (item) => `  ${item.cantidad} × ${item.nombre}: ${item.subtotal}`,
    ),
    `Total pagado: ${lempiras(ticket.total)}`,
    ...(ticket.notas ? ['', `Notas: ${ticket.notas}`] : []),
  ].join('\n');

  return { asunto, html, texto };
}
