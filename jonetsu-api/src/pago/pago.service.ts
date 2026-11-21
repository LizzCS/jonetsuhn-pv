import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';
import {
  estado_pago,
  estado_ticket,
  metodo_pago,
} from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

import { exigirAdmin } from '../common/admin.js';
import { minutosDesdeAhora } from '../common/fechas.js';
import { conReintento } from '../common/prisma-utils.js';
import { MINUTOS_REINTENTO_PAGO } from '../common/reglas-negocio.js';

import type { ArchivoSubido } from '../common/archivos/imagen.pipe.js';
import { ArchivosService } from '../common/archivos/archivos.service.js';
import { CorreoService } from '../correo/correo.service.js';
import { exigirAccesoTicket } from '../auth/acceso.js';
import type { Acceso } from '../auth/acceso.js';
import { CreatePagoDto } from './dto/create-pago.dto.js';
import { FiltroPagosDto } from './dto/filtro-pagos.dto.js';
import { VerificarPagoDto } from './dto/verificar-pago.dto.js';

// Pagos que ocupan el saldo del ticket (en revisión o aprobados)
const PAGOS_ACTIVOS: estado_pago[] = [
  estado_pago.pendiente,
  estado_pago.verificado,
];

const PLAZO_CAMBIO_VENCIDO =
  'El plazo para cambiar el comprobante venció. Si subiste una imagen equivocada, comunícate con el staff';

const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

const incluirRelaciones = {
  ticket: {
    select: {
      id_ticket: true,
      id_user: true,
      codigo_acceso: true,
      total: true,
      estado: true,
    },
  },
  verificador: {
    select: {
      id_user: true,
      nombre: true,
      apellido: true,
    },
  },
} as const;

@Injectable()
export class PagoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly archivos: ArchivosService,
    private readonly correo: CorreoService,
  ) {}

  // CREATE - El cliente sube el comprobante de su transferencia.
  // Regla: un solo pago por el total del ticket; el monto lo pone el servidor.
  async create(dto: CreatePagoDto, archivo: ArchivoSubido, acceso: Acceso) {
    const { id_ticket } = dto;
    const metodo = dto.metodo ?? metodo_pago.transferencia;

    // Antes de guardar el archivo: el ticket debe ser de quien paga
    const dueno = await this.prisma.ticket.findUnique({
      where: { id_ticket },
      select: { id_ticket: true, id_user: true },
    });

    if (!dueno) {
      throw new NotFoundException('El ticket no existe');
    }

    exigirAccesoTicket(acceso, dueno);

    // Se guarda primero el archivo; si la transacción falla, se borra
    const clave = await this.archivos.guardar(
      'comprobantes',
      archivo.buffer,
      archivo.mimetype,
    );

    try {
      return await conReintento(
        () =>
          this.prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.findUnique({
              where: { id_ticket },
            });

            if (!ticket) {
              throw new NotFoundException('El ticket no existe');
            }

            if (ticket.estado === estado_ticket.pago_en_revision) {
              throw new ConflictException(
                'Este ticket ya tiene un pago en revisión. Si te equivocaste de imagen, reemplázala',
              );
            }

            // Venció el tiempo de gracia (o ya fue marcado como cancelado):
            // el ticket se conserva y el staff decide si lo reactiva
            const vencido =
              ticket.estado === estado_ticket.cancelado ||
              (ticket.estado === estado_ticket.reservado &&
                ticket.expira_en <= new Date());

            if (vencido) {
              throw new ConflictException(
                'El tiempo para subir el comprobante venció y el pedido fue cancelado. Si ya hiciste la transferencia, comunícate con el staff',
              );
            }

            if (ticket.estado !== estado_ticket.reservado) {
              throw new ConflictException(
                'El ticket no admite pagos en su estado actual',
              );
            }

            // Respaldo por si el estado del ticket quedó desfasado
            const pagosActivos = await tx.pago.count({
              where: { id_ticket, estado: { in: PAGOS_ACTIVOS } },
            });

            if (pagosActivos > 0) {
              throw new ConflictException(
                'Este ticket ya tiene un pago registrado',
              );
            }

            const pago = await tx.pago.create({
              data: {
                id_ticket,
                monto: ticket.total,
                metodo,
                comprobante_url: clave,
                estado: estado_pago.pendiente,
              },
            });

            await tx.ticket.update({
              where: { id_ticket },
              data: { estado: estado_ticket.pago_en_revision },
            });

            return pago;
          }, SERIALIZABLE),
        'Conflicto al registrar el pago. Intenta nuevamente',
      );
    } catch (error) {
      await this.archivos.borrar(clave);
      throw error;
    }
  }

  // READ - Obtener pagos, con filtros opcionales
  async findAll(filtros: FiltroPagosDto = {}) {
    return this.prisma.pago.findMany({
      where: {
        ...(filtros.estado !== undefined && { estado: filtros.estado }),
        ...(filtros.id_ticket !== undefined && {
          id_ticket: filtros.id_ticket,
        }),
      },
      include: incluirRelaciones,
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // READ - Obtener pago por ID. Con "acceso" se exige ser admin o dueño
  async findOne(id: string, acceso?: Acceso) {
    const pago = await this.prisma.pago.findUnique({
      where: {
        id_pago: id,
      },
      include: incluirRelaciones,
    });

    if (!pago) {
      throw new NotFoundException('El pago no existe');
    }

    if (acceso) {
      exigirAccesoTicket(acceso, pago.ticket);
    }

    return pago;
  }

  // READ - Imagen del comprobante (admin o dueño)
  async comprobante(id: string, acceso: Acceso) {
    const pago = await this.findOne(id, acceso);
    return this.archivos.abrir(pago.comprobante_url);
  }

  // UPDATE - Reemplazar la imagen si el cliente se equivocó.
  // Solo dentro del plazo de la reserva (expira_en del ticket, que no
  // cambia al subir el comprobante). Vencido el plazo, la imagen queda
  // fija para que el admin la revise sin que cambie; si hay que
  // corregirla, el admin rechaza el pago y el cliente recibe un plazo nuevo.
  async reemplazarComprobante(
    id: string,
    archivo: ArchivoSubido,
    acceso: Acceso,
  ) {
    const pago = await this.prisma.pago.findUnique({
      where: { id_pago: id },
      include: {
        ticket: { select: { id_ticket: true, id_user: true, expira_en: true } },
      },
    });

    if (!pago) {
      throw new NotFoundException('El pago no existe');
    }

    exigirAccesoTicket(acceso, pago.ticket);

    if (pago.estado !== estado_pago.pendiente) {
      throw new ConflictException(
        'El pago ya fue revisado; no se puede cambiar el comprobante',
      );
    }

    if (pago.ticket.expira_en <= new Date()) {
      throw new ConflictException(PLAZO_CAMBIO_VENCIDO);
    }

    const clave = await this.archivos.guardar(
      'comprobantes',
      archivo.buffer,
      archivo.mimetype,
    );

    // Estado y plazo van en el filtro por si el admin lo revisa o el
    // plazo vence mientras se sube el archivo
    const { count } = await this.prisma.pago.updateMany({
      where: {
        id_pago: id,
        estado: estado_pago.pendiente,
        ticket: { is: { expira_en: { gt: new Date() } } },
      },
      data: { comprobante_url: clave },
    });

    if (count === 0) {
      await this.archivos.borrar(clave);
      throw new ConflictException(
        'El pago ya fue revisado o venció el plazo; no se puede cambiar el comprobante',
      );
    }

    await this.archivos.borrar(pago.comprobante_url);

    return this.findOne(id);
  }

  // VERIFICAR - El admin aprueba o rechaza el comprobante
  async verificar(id: string, dto: VerificarPagoDto, id_admin: string) {
    let ticketConfirmado: string | null = null;

    const resultado = await conReintento(
      () =>
        this.prisma.$transaction(async (tx) => {
          ticketConfirmado = null;

          await exigirAdmin(tx, id_admin);

          const pago = await tx.pago.findUnique({
            where: { id_pago: id },
            include: { ticket: true },
          });

          if (!pago) {
            throw new NotFoundException('El pago no existe');
          }

          if (pago.estado !== estado_pago.pendiente) {
            throw new ConflictException('Este pago ya fue revisado');
          }

          const aprobado = dto.estado === estado_pago.verificado;

          await tx.pago.update({
            where: { id_pago: id },
            data: {
              estado: dto.estado,
              verificado_por: id_admin,
              verificado_en: new Date(),
              motivo_rechazo: aprobado ? null : dto.motivo_rechazo,
            },
          });

          if (aprobado) {
            // Confirmar el ticket cuando lo verificado cubre el total
            const verificado = await tx.pago.aggregate({
              where: {
                id_ticket: pago.id_ticket,
                estado: estado_pago.verificado,
              },
              _sum: { monto: true },
            });

            const pagado = verificado._sum.monto ?? new Prisma.Decimal(0);

            if (pagado.gte(pago.ticket.total)) {
              const { count } = await tx.ticket.updateMany({
                where: {
                  id_ticket: pago.id_ticket,
                  estado: estado_ticket.pago_en_revision,
                },
                data: { estado: estado_ticket.confirmado },
              });

              if (count > 0) {
                ticketConfirmado = pago.id_ticket;
              }
            }
          } else {
            await this.devolverAReservado(tx, pago.id_ticket);
          }

          return tx.pago.findUnique({
            where: { id_pago: id },
            include: incluirRelaciones,
          });
        }, SERIALIZABLE),
      'Conflicto al revisar el pago. Intenta nuevamente',
    );

    // Se envía después del commit y sin esperar: si el correo falla,
    // el pago igual queda verificado (el admin puede reenviarlo)
    if (ticketConfirmado) {
      void this.correo.enviarTicket(ticketConfirmado, 'confirmado');
    }

    return resultado;
  }

  // REEMBOLSAR - El admin devuelve un pago verificado y se cancela el ticket
  async reembolsar(id: string, id_admin: string) {
    return conReintento(
      () =>
        this.prisma.$transaction(async (tx) => {
          await exigirAdmin(tx, id_admin);

          const pago = await tx.pago.findUnique({
            where: { id_pago: id },
            include: { ticket: true },
          });

          if (!pago) {
            throw new NotFoundException('El pago no existe');
          }

          if (pago.estado !== estado_pago.verificado) {
            throw new ConflictException(
              'Solo se pueden reembolsar pagos verificados',
            );
          }

          if (pago.ticket.estado === estado_ticket.entregado) {
            throw new ConflictException(
              'El pedido ya fue entregado; no se puede reembolsar',
            );
          }

          // verificado_por / verificado_en guardan al último admin que
          // cambió el estado del pago (aquí, quien reembolsó)
          await tx.pago.update({
            where: { id_pago: id },
            data: {
              estado: estado_pago.reembolsado,
              verificado_por: id_admin,
              verificado_en: new Date(),
            },
          });

          await tx.ticket.update({
            where: { id_ticket: pago.id_ticket },
            data: { estado: estado_ticket.cancelado },
          });

          return tx.pago.findUnique({
            where: { id_pago: id },
            include: incluirRelaciones,
          });
        }, SERIALIZABLE),
      'Conflicto al reembolsar el pago. Intenta nuevamente',
    );
  }

  // DELETE - Solo admin: retira un pago pendiente (casos raros). El
  // cliente no borra pagos: si se equivocó de imagen la reemplaza dentro
  // del plazo, y si no, el admin rechaza el pago.
  async remove(id: string, id_admin: string) {
    const pago = await conReintento(
      () =>
        this.prisma.$transaction(async (tx) => {
          await exigirAdmin(tx, id_admin);

          const pago = await tx.pago.findUnique({
            where: { id_pago: id },
          });

          if (!pago) {
            throw new NotFoundException('El pago no existe');
          }

          if (pago.estado !== estado_pago.pendiente) {
            throw new ConflictException(
              'Solo se pueden eliminar pagos pendientes',
            );
          }

          await tx.pago.delete({
            where: { id_pago: id },
          });

          await this.devolverAReservado(tx, pago.id_ticket);

          return pago;
        }, SERIALIZABLE),
      'Conflicto al eliminar el pago. Intenta nuevamente',
    );

    // El archivo se borra solo después de confirmar la transacción
    await this.archivos.borrar(pago.comprobante_url);

    return {
      mensaje: 'Pago pendiente eliminado correctamente',
      id_pago: id,
    };
  }

  // Si el ticket ya no tiene pagos activos, vuelve a "reservado" con
  // un nuevo plazo para subir otro comprobante. El cupo nunca se soltó
  // (pago_en_revision lo ocupa), así que no hay que volver a revisarlo.
  private async devolverAReservado(
    tx: Prisma.TransactionClient,
    id_ticket: string,
  ) {
    const pagosActivos = await tx.pago.count({
      where: { id_ticket, estado: { in: PAGOS_ACTIVOS } },
    });

    if (pagosActivos === 0) {
      await tx.ticket.updateMany({
        where: { id_ticket, estado: estado_ticket.pago_en_revision },
        data: {
          estado: estado_ticket.reservado,
          expira_en: minutosDesdeAhora(MINUTOS_REINTENTO_PAGO),
        },
      });
    }
  }
}
