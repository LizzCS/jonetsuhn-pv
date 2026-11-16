import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';
import { estado_pago, estado_ticket } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

import { exigirAdmin } from '../common/admin.js';
import { AccionAdminDto } from '../common/dto/accion-admin.dto.js';
import { ahoraLocal, fechaHoraEvento, minutosDesdeAhora } from '../common/fechas.js';
import { conReintento } from '../common/prisma-utils.js';
import {
  CODIGO_FORMATO,
  MINUTOS_REINTENTO_PAGO,
  MINUTOS_RESERVA,
  SEGUNDOS_REVISION_VENCIDOS,
} from '../common/reglas-negocio.js';
import { cancelarReservasVencidas } from '../common/vencimientos.js';

import { generarCodigoAcceso, normalizarCodigoAcceso } from './codigo-acceso.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { EntregarTicketDto } from './dto/entregar-ticket.dto.js';
import { FiltroTicketsDto } from './dto/filtro-tickets.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';

// Estados de pago que cuentan como pago en curso o aprobado
const PAGOS_ACTIVOS: estado_pago[] = [
  estado_pago.pendiente,
  estado_pago.verificado,
];

// Estados de ticket que ya no se pueden modificar
const TICKETS_CERRADOS: estado_ticket[] = [
  estado_ticket.entregado,
  estado_ticket.cancelado,
];

const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

@Injectable()
export class TicketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TicketService.name);
  private revisionVencidos?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  // Revisión periódica de reservas vencidas (además de la que se hace
  // al leer tickets, para que el historial siempre salga al día)
  onModuleInit() {
    this.revisionVencidos = setInterval(() => {
      cancelarReservasVencidas(this.prisma)
        .then((cancelados) => {
          if (cancelados > 0) {
            this.logger.log(`Reservas vencidas canceladas: ${cancelados}`);
          }
        })
        .catch((error: unknown) =>
          this.logger.error('No se pudieron cancelar las reservas vencidas', error),
        );
    }, SEGUNDOS_REVISION_VENCIDOS * 1000);

    this.revisionVencidos.unref();
  }

  onModuleDestroy() {
    clearInterval(this.revisionVencidos);
  }

  // CREATE - Reservar
  async create(dto: CreateTicketDto) {
    const { id_persona, id_horario, items, notas } = dto;

    // P2002 = código de acceso repetido (muy improbable): se reintenta
    return conReintento(
      () =>
        this.prisma.$transaction(async (tx) => {
          const persona = await tx.persona.findFirst({
            where: { id_persona, activo: true },
            select: { id_persona: true },
          });

          if (!persona) {
            throw new NotFoundException('La persona no existe');
          }

          await this.validarHorarioDisponible(tx, id_horario);

          let total = new Prisma.Decimal(0);

          const productosCalculados: {
            id_producto: string;
            cantidad: number;
            precio_unitario: Prisma.Decimal;
          }[] = [];

          for (const item of items) {
            const producto = await this.validarCupo(
              tx,
              id_horario,
              item.id_producto,
              item.cantidad,
            );

            productosCalculados.push({
              id_producto: item.id_producto,
              cantidad: item.cantidad,
              precio_unitario: producto.precio,
            });

            total = total.plus(producto.precio.mul(item.cantidad));
          }

          return tx.ticket.create({
            data: {
              persona: {
                connect: { id_persona },
              },
              horario: {
                connect: { id_horario },
              },
              codigo_acceso: generarCodigoAcceso(),
              expira_en: minutosDesdeAhora(MINUTOS_RESERVA),
              total,
              ...(notas !== undefined ? { notas } : {}),
              items: {
                create: productosCalculados.map((producto) => ({
                  producto: {
                    connect: {
                      id_producto: producto.id_producto,
                    },
                  },
                  cantidad: producto.cantidad,
                  precio_unitario: producto.precio_unitario,
                })),
              },
            },
            include: {
              items: true,
            },
          });
        }, SERIALIZABLE),
      'Conflicto al reservar. Intenta nuevamente',
      ['P2034', 'P2002'],
    );
  }

  // READ - Obtener tickets (historial), con filtros opcionales
  async findAll(filtros: FiltroTicketsDto = {}) {
    await cancelarReservasVencidas(this.prisma);

    return this.prisma.ticket.findMany({
      where: {
        ...(filtros.id_persona !== undefined && {
          id_persona: filtros.id_persona,
        }),
        ...(filtros.estado !== undefined && { estado: filtros.estado }),
      },
      select: {
        id_ticket: true,
        id_persona: true,
        id_horario: true,
        codigo_acceso: true,
        estado: true,
        expira_en: true,
        asistio: true,
        notas: true,
        total: true,
        created_at: true,
        persona: {
          select: {
            id_persona: true,
            nombre: true,
            apellido: true,
          },
        },
        horario: {
          select: {
            hora: true,
            evento: {
              select: {
                id_evento: true,
                nombre: true,
                fecha: true,
              },
            },
          },
        },
        items: {
          include: {
            producto: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // READ - Obtener ticket por ID
  async findOne(id: string) {
    await cancelarReservasVencidas(this.prisma, { id_ticket: id });

    const ticket = await this.prisma.ticket.findUnique({
      where: {
        id_ticket: id,
      },
      include: {
        persona: {
          select: {
            id_persona: true,
            nombre: true,
            apellido: true,
          },
        },
        horario: {
          include: {
            evento: {
              select: {
                nombre: true,
                fecha: true,
              },
            },
          },
        },
        items: {
          include: {
            producto: {
              select: {
                nombre: true,
              },
            },
          },
        },
        pagos: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('El ticket no existe');
    }

    return ticket;
  }

  // UPDATE - El cliente edita notas o cancela mientras espera pago.
  // Con el ticket en revisión o confirmado, solo un admin puede editarlo.
  async update(id: string, dto: UpdateTicketDto) {
    const ticket = await this.findOne(id);

    if (TICKETS_CERRADOS.includes(ticket.estado)) {
      throw new ConflictException(
        ticket.estado === estado_ticket.cancelado
          ? 'El ticket está cancelado. Si ya pagaste, comunícate con el staff'
          : 'El pedido ya fue entregado y no se puede modificar',
      );
    }

    if (ticket.estado !== estado_ticket.reservado) {
      if (!dto.id_admin) {
        throw new ConflictException(
          'Este ticket ya tiene un pago registrado; solo un administrador puede modificarlo',
        );
      }

      await exigirAdmin(this.prisma, dto.id_admin);
    }

    const data: {
      notas?: string | null;
      estado?: typeof estado_ticket.cancelado;
    } = {};

    if (dto.notas !== undefined) {
      data.notas = dto.notas;
    }

    if (dto.estado !== undefined) {
      if (ticket.estado !== estado_ticket.reservado) {
        throw new ConflictException(
          ticket.estado === estado_ticket.confirmado
            ? 'Un ticket confirmado se cancela reembolsando su pago'
            : 'Primero revisa el pago pendiente (verificar o rechazar)',
        );
      }

      // Los pagos rechazados no impiden cancelar
      const pagosActivos = ticket.pagos.filter((pago) =>
        PAGOS_ACTIVOS.includes(pago.estado),
      );

      if (pagosActivos.length > 0) {
        throw new ConflictException(
          'No se puede cancelar un ticket con un pago en curso',
        );
      }

      data.estado = estado_ticket.cancelado;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No se enviaron campos para actualizar');
    }

    return this.prisma.ticket.update({
      where: {
        id_ticket: id,
      },
      data,
    });
  }

  // REACTIVAR - El admin le da un nuevo plazo a un ticket cancelado
  // (por ejemplo, el cliente pagó pero no subió el comprobante a tiempo).
  // Se vuelve a revisar el cupo porque al cancelarse lo soltó.
  async reactivar(id: string, dto: AccionAdminDto) {
    await cancelarReservasVencidas(this.prisma, { id_ticket: id });

    return conReintento(
      () =>
        this.prisma.$transaction(async (tx) => {
          await exigirAdmin(tx, dto.id_admin);

          const ticket = await tx.ticket.findUnique({
            where: { id_ticket: id },
            include: { items: true, pagos: true },
          });

          if (!ticket) {
            throw new NotFoundException('El ticket no existe');
          }

          if (ticket.estado !== estado_ticket.cancelado) {
            throw new ConflictException(
              'Solo se pueden reactivar tickets cancelados',
            );
          }

          // Con pagos aprobados o reembolsados ya no aplica reactivar
          const pagosQueBloquean = ticket.pagos.filter(
            (pago) => pago.estado !== estado_pago.rechazado,
          );

          if (pagosQueBloquean.length > 0) {
            throw new ConflictException(
              'El ticket tiene pagos registrados; no se puede reactivar',
            );
          }

          await this.validarHorarioDisponible(tx, ticket.id_horario);

          for (const item of ticket.items) {
            await this.validarCupo(
              tx,
              ticket.id_horario,
              item.id_producto,
              item.cantidad,
            );
          }

          return tx.ticket.update({
            where: { id_ticket: id },
            data: {
              estado: estado_ticket.reservado,
              expira_en: minutosDesdeAhora(MINUTOS_REINTENTO_PAGO),
            },
            include: { items: true },
          });
        }, SERIALIZABLE),
      'Conflicto al reactivar el ticket. Intenta nuevamente',
    );
  }

  // ENTREGAR - El admin valida el código el día del servicio
  async entregar(dto: EntregarTicketDto) {
    const codigo_acceso = normalizarCodigoAcceso(dto.codigo_acceso);

    if (!CODIGO_FORMATO.test(codigo_acceso)) {
      throw new BadRequestException('codigo_acceso no es válido');
    }

    return this.prisma.$transaction(async (tx) => {
      await exigirAdmin(tx, dto.id_admin);

      const ticket = await tx.ticket.findUnique({
        where: { codigo_acceso },
        include: { horario: { include: { evento: true } } },
      });

      if (!ticket) {
        throw new NotFoundException('No existe un ticket con ese código');
      }

      if (ticket.estado === estado_ticket.entregado) {
        throw new ConflictException('Este pedido ya fue entregado');
      }

      if (ticket.estado !== estado_ticket.confirmado) {
        throw new ConflictException(
          'Solo se pueden entregar tickets con el pago confirmado',
        );
      }

      const diaServicio = ticket.horario.evento.fecha.toISOString().slice(0, 10);

      if (diaServicio !== ahoraLocal().slice(0, 10)) {
        throw new ConflictException(
          `Este pedido es para el servicio del ${diaServicio}; solo se entrega ese día`,
        );
      }

      // updateMany con el estado en el filtro evita entregar dos veces
      // si dos admins escanean el mismo código al mismo tiempo
      const { count } = await tx.ticket.updateMany({
        where: {
          id_ticket: ticket.id_ticket,
          estado: estado_ticket.confirmado,
        },
        data: {
          estado: estado_ticket.entregado,
          asistio: true,
        },
      });

      if (count === 0) {
        throw new ConflictException('Este pedido ya fue entregado');
      }

      return tx.ticket.findUnique({
        where: { id_ticket: ticket.id_ticket },
        include: { items: true },
      });
    });
  }

  // DELETE - Solo tickets sin confirmar y sin ningún pago (ni rechazado),
  // para no perder el historial de pagos
  async remove(id: string) {
    const ticket = await this.findOne(id);

    if (
      ticket.estado !== estado_ticket.reservado &&
      ticket.estado !== estado_ticket.cancelado
    ) {
      throw new ConflictException(
        'Solo se pueden eliminar tickets sin confirmar',
      );
    }

    if (ticket.pagos.length > 0) {
      throw new ConflictException(
        'No se puede eliminar un ticket con pagos registrados. Cancélalo en su lugar',
      );
    }

    await this.prisma.ticket.delete({
      where: {
        id_ticket: id,
      },
    });

    return {
      mensaje: 'Ticket eliminado correctamente',
    };
  }

  // El horario debe existir, estar abierto, su evento activo y no haber pasado
  private async validarHorarioDisponible(
    tx: Prisma.TransactionClient,
    id_horario: string,
  ) {
    const horario = await tx.horario.findFirst({
      where: { id_horario, activo: true },
      include: { evento: true },
    });

    if (!horario) {
      throw new NotFoundException('El horario no existe');
    }

    if (!horario.abierto || !horario.evento.activo) {
      throw new ConflictException('El horario o evento está cerrado');
    }

    if (fechaHoraEvento(horario.evento.fecha, horario.hora) <= ahoraLocal()) {
      throw new ConflictException('Este horario ya pasó');
    }

    return horario;
  }

  // Comprueba que queden unidades del producto en ese horario y lo devuelve.
  // Ocupan cupo: tickets en revisión, confirmados, entregados y reservas
  // sin vencer. Los cancelados (incluidos los vencidos) no ocupan.
  private async validarCupo(
    tx: Prisma.TransactionClient,
    id_horario: string,
    id_producto: string,
    cantidad: number,
  ) {
    const disponibilidad = await tx.horario_producto.findUnique({
      where: {
        id_horario_id_producto: { id_horario, id_producto },
      },
      include: { producto: true },
    });

    if (
      !disponibilidad ||
      !disponibilidad.activo ||
      !disponibilidad.producto.activo
    ) {
      throw new BadRequestException('Producto no disponible para este horario');
    }

    const ocupacion = await tx.ticket_item.aggregate({
      where: {
        id_producto,
        ticket: {
          id_horario,
          OR: [
            {
              estado: {
                in: [
                  estado_ticket.pago_en_revision,
                  estado_ticket.confirmado,
                  estado_ticket.entregado,
                ],
              },
            },
            {
              estado: estado_ticket.reservado,
              expira_en: { gt: new Date() },
            },
          ],
        },
      },
      _sum: { cantidad: true },
    });

    const ocupados = ocupacion._sum.cantidad ?? 0;
    const disponibles = disponibilidad.cupo_total - ocupados;

    if (cantidad > disponibles) {
      throw new ConflictException(
        `No hay cupos suficientes para ${disponibilidad.producto.nombre} (quedan ${Math.max(disponibles, 0)})`,
      );
    }

    return disponibilidad.producto;
  }
}
