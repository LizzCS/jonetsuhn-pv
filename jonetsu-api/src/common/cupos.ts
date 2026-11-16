import { Prisma } from '../generated/prisma/client.js';
import { estado_ticket } from '../generated/prisma/enums.js';

// Tickets que siguen en curso: reservas sin vencer, pagos en revisión y
// confirmados. Mientras existan, no se borra ni se cambia la fecha/hora
// de su evento u horario (primero se reagendan uno por uno).
export function ticketsPendientes(
  ahora = new Date(),
): Prisma.ticketWhereInput {
  return {
    OR: [
      {
        estado: {
          in: [estado_ticket.pago_en_revision, estado_ticket.confirmado],
        },
      },
      { estado: estado_ticket.reservado, expira_en: { gt: ahora } },
    ],
  };
}

// Tickets que ocupan cupo: los pendientes más los ya entregados.
// Los cancelados (incluidos los vencidos) no ocupan.
export function ticketsQueOcupanCupo(
  ahora = new Date(),
): Prisma.ticketWhereInput {
  return {
    OR: [
      ...(ticketsPendientes(ahora).OR ?? []),
      { estado: estado_ticket.entregado },
    ],
  };
}

// Unidades vendidas o apartadas de un plato en un horario
export async function unidadesOcupadas(
  db: Prisma.TransactionClient,
  id_horario: string,
  id_producto: string,
): Promise<number> {
  const ocupacion = await db.ticket_item.aggregate({
    where: {
      id_producto,
      ticket: { id_horario, ...ticketsQueOcupanCupo() },
    },
    _sum: { cantidad: true },
  });

  return ocupacion._sum.cantidad ?? 0;
}

// Platos asignados a un horario con su cupo total, ocupados y disponibles
export async function disponibilidadHorario(
  db: Prisma.TransactionClient,
  id_horario: string,
) {
  const [asignados, ocupados] = await Promise.all([
    db.horario_producto.findMany({
      where: { id_horario, activo: true, producto: { activo: true } },
      include: {
        producto: {
          select: {
            id_producto: true,
            nombre: true,
            descripcion: true,
            precio: true,
            imagen_url: true,
            categoria: { select: { id_categoria: true, nombre: true } },
          },
        },
      },
      orderBy: { producto: { nombre: 'asc' } },
    }),
    ocupadosPorProducto(db, id_horario),
  ]);

  return asignados.map((asignado) => {
    const ocupadosProducto = ocupados.get(asignado.id_producto) ?? 0;

    return {
      ...asignado.producto,
      cupo_total: asignado.cupo_total,
      ocupados: ocupadosProducto,
      disponibles: Math.max(asignado.cupo_total - ocupadosProducto, 0),
    };
  });
}

// Unidades ocupadas de cada plato en un horario: Map<id_producto, unidades>
export async function ocupadosPorProducto(
  db: Prisma.TransactionClient,
  id_horario: string,
): Promise<Map<string, number>> {
  const grupos = await db.ticket_item.groupBy({
    by: ['id_producto'],
    where: { ticket: { id_horario, ...ticketsQueOcupanCupo() } },
    _sum: { cantidad: true },
  });

  return new Map(
    grupos.map((grupo) => [grupo.id_producto, grupo._sum.cantidad ?? 0]),
  );
}
