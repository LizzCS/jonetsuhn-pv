import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

import { CreatePagoDto } from './dto/create-pago.dto.js';
import { UpdatePagoDto } from './dto/update-pago.dto.js';

@Injectable()
export class PagoService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Validar UUID
  private validarUUID(
    valor: unknown,
    campo: string,
  ): string {
    const formato =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      typeof valor !== 'string' ||
      !formato.test(valor)
    ) {
      throw new BadRequestException(
        `${campo} debe ser un UUID válido`,
      );
    }

    return valor;
  }

  // Validar monto del pago
  private validarMonto(valor: unknown): Prisma.Decimal {
    if (
      typeof valor !== 'number' &&
      typeof valor !== 'string'
    ) {
      throw new BadRequestException(
        'El monto debe ser un número positivo',
      );
    }

    const texto = String(valor);

    if (!/^\d{1,12}(\.\d{1,2})?$/.test(texto)) {
      throw new BadRequestException(
        'El monto debe ser válido y admitir máximo dos decimales',
      );
    }

    const monto = new Prisma.Decimal(texto);

    if (monto.lte(0)) {
      throw new BadRequestException(
        'El monto debe ser mayor que cero',
      );
    }

    return monto;
  }

  // Validar método de pago
  private validarMetodo(
    valor: unknown,
  ): 'transferencia' | 'efectivo' | 'tarjeta' {
    if (
      valor !== 'transferencia' &&
      valor !== 'efectivo' &&
      valor !== 'tarjeta'
    ) {
      throw new BadRequestException(
        'El método debe ser transferencia, efectivo o tarjeta',
      );
    }

    return valor;
  }

  // Validar la dirección del comprobante
  private validarComprobante(
    valor: unknown,
  ): string | null {
    if (valor === null) {
      return null;
    }

    if (
      typeof valor !== 'string' ||
      valor.length > 2048
    ) {
      throw new BadRequestException(
        'El comprobante debe ser una URL válida',
      );
    }

    try {
      const url = new URL(valor);

      if (
        url.protocol !== 'http:' &&
        url.protocol !== 'https:'
      ) {
        throw new Error('Protocolo inválido');
      }

      return url.toString();
    } catch {
      throw new BadRequestException(
        'El comprobante debe tener una URL HTTP o HTTPS válida',
      );
    }
  }

  // Identificar errores de Prisma
  private esErrorPrisma(
    error: unknown,
    codigo: string,
  ): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === codigo
    );
  }

  // CREATE - Crear un pago
  async create(dto: CreatePagoDto) {
    const id_ticket = this.validarUUID(
      dto?.id_ticket,
      'id_ticket',
    );

    const monto = this.validarMonto(
      dto?.monto,
    );

    const metodo = this.validarMetodo(
      dto?.metodo,
    );

    const comprobante_url =
      dto?.comprobante_url !== undefined
        ? this.validarComprobante(
            dto.comprobante_url,
          )
        : undefined;

    // Reintentos para conflictos entre transacciones
    for (let intento = 0; intento < 3; intento++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // Verificar que exista el ticket
            const ticket =
              await tx.ticket.findUnique({
                where: {
                  id_ticket,
                },
              });

            if (!ticket) {
              throw new NotFoundException(
                'El ticket no existe',
              );
            }

            // Comprobar si admite pagos
            if (
              ticket.estado !== 'reservado' &&
              ticket.estado !== 'pago_en_revision'
            ) {
              throw new ConflictException(
                'El ticket no admite pagos en su estado actual',
              );
            }

            // Comprobar que la reservación no haya vencido
            if (
              ticket.estado === 'reservado' &&
              ticket.expira_en <= new Date()
            ) {
              throw new ConflictException(
                'La reservación ya expiró',
              );
            }

            // Calcular los pagos que ocupan saldo
            const acumulado =
              await tx.pago.aggregate({
                where: {
                  id_ticket,
                  estado: {
                    in: [
                      'pendiente',
                      'verificado',
                    ],
                  },
                },
                _sum: {
                  monto: true,
                },
              });

            const utilizado =
              acumulado._sum.monto ??
              new Prisma.Decimal(0);

            // Impedir pagos mayores al saldo
            if (
              utilizado.plus(monto).gt(ticket.total)
            ) {
              throw new ConflictException(
                'El monto supera el saldo disponible del ticket',
              );
            }

            // Guardar el pago pendiente
            const pago = await tx.pago.create({
              data: {
                id_ticket,
                monto,
                metodo,
                estado: 'pendiente',
                ...(comprobante_url !== undefined
                  ? { comprobante_url }
                  : {}),
              },
            });

            // Actualizar el estado del ticket
            if (ticket.estado === 'reservado') {
              await tx.ticket.update({
                where: {
                  id_ticket,
                },
                data: {
                  estado: 'pago_en_revision',
                },
              });
            }

            return pago;
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel
                .Serializable,
          },
        );
      } catch (error) {
        if (
          this.esErrorPrisma(error, 'P2034') &&
          intento < 2
        ) {
          continue;
        }

        if (this.esErrorPrisma(error, 'P2034')) {
          throw new ConflictException(
            'Conflicto al registrar el pago. Intenta nuevamente',
          );
        }

        throw error;
      }
    }

    throw new ConflictException(
      'No se pudo registrar el pago',
    );
  }

  // READ - Obtener todos los pagos
  async findAll() {
    return this.prisma.pago.findMany({
      include: {
        ticket: {
          select: {
            id_ticket: true,
            total: true,
            estado: true,
          },
        },
        verificador: {
          select: {
            id_persona: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // READ - Obtener pago por ID
  async findOne(id: string) {
    const pago = await this.prisma.pago.findUnique({
      where: {
        id_pago: id,
      },
      include: {
        ticket: {
          select: {
            id_ticket: true,
            total: true,
            estado: true,
          },
        },
      },
    });

    if (!pago) {
      throw new NotFoundException(
        'El pago no existe',
      );
    }

    return pago;
  }

  // UPDATE - Actualizar comprobante
  async update(
    id: string,
    dto: UpdatePagoDto,
  ) {
    const pago = await this.findOne(id);

    if (pago.estado !== 'pendiente') {
      throw new ConflictException(
        'Solo se pueden modificar pagos pendientes',
      );
    }

    if (dto?.comprobante_url === undefined) {
      throw new BadRequestException(
        'Debes enviar comprobante_url para actualizar',
      );
    }

    const comprobante_url =
      this.validarComprobante(
        dto.comprobante_url,
      );

    try {
      return await this.prisma.pago.update({
        where: {
          id_pago: id,
        },
        data: {
          comprobante_url,
        },
      });
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'El pago no existe',
        );
      }

      throw error;
    }
  }

  // DELETE - Eliminar pago pendiente
  async remove(id: string) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const pago = await tx.pago.findUnique({
            where: {
              id_pago: id,
            },
          });

          if (!pago) {
            throw new NotFoundException(
              'El pago no existe',
            );
          }

          if (pago.estado !== 'pendiente') {
            throw new ConflictException(
              'Solo se pueden eliminar pagos pendientes',
            );
          }

          await tx.pago.delete({
            where: {
              id_pago: id,
            },
          });

          // Comprobar si hay otros pagos activos
          const otrosPagos = await tx.pago.count({
            where: {
              id_ticket: pago.id_ticket,
              estado: {
                in: [
                  'pendiente',
                  'verificado',
                ],
              },
            },
          });

          // Restaurar el estado si ya no hay pagos
          if (otrosPagos === 0) {
            await tx.ticket.updateMany({
              where: {
                id_ticket: pago.id_ticket,
                estado: 'pago_en_revision',
              },
              data: {
                estado: 'reservado',
              },
            });
          }

          return {
            mensaje:
              'Pago pendiente eliminado correctamente',
            id_pago: id,
          };
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        },
      );
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2034')) {
        throw new ConflictException(
          'Conflicto al eliminar el pago. Intenta nuevamente',
        );
      }

      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'El pago no existe',
        );
      }

      throw error;
    }
  }
}
