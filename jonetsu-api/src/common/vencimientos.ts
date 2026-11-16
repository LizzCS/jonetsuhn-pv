import { Prisma } from '../generated/prisma/client.js';
import { estado_ticket } from '../generated/prisma/enums.js';

// Pasa a "cancelado" los tickets reservados cuyo tiempo de gracia venció
// sin que se subiera el comprobante. No se borran: quedan en el historial
// y el admin puede reactivarlos si el cliente pagó tarde.
export async function cancelarReservasVencidas(
  db: Prisma.TransactionClient,
  filtro: Prisma.ticketWhereInput = {},
): Promise<number> {
  const { count } = await db.ticket.updateMany({
    where: {
      ...filtro,
      estado: estado_ticket.reservado,
      expira_en: { lte: new Date() },
    },
    data: { estado: estado_ticket.cancelado },
  });

  return count;
}
