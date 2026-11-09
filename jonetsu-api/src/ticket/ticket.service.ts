import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

import {
  CreateTicketDto,
  CreateTicketItemDto,
} from './dto/create-ticket.dto.js';

import { UpdateTicketDto } from './dto/update-ticket.dto.js';

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Validar identificadores UUID
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

  // Validar las notas
  private validarNotas(
    valor: unknown,
  ): string | null {
    if (valor === null) {
      return null;
    }

    if (
      typeof valor !== 'string' ||
      valor.length > 2000
    ) {
      throw new BadRequestException(
        'Las notas deben ser texto de hasta 2000 caracteres',
      );
    }

    return valor.trim();
  }

  // Validar los productos del ticket
  private validarItems(
    items: unknown,
  ): CreateTicketItemDto[] {
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 20
    ) {
      throw new BadRequestException(
        'Debe enviar entre 1 y 20 productos',
      );
    }

    const productosRegistrados = new Set<string>();

    return items.map((item: unknown) => {
      if (
        typeof item !== 'object' ||
        item === null
      ) {
        throw new BadRequestException(
          'Cada producto debe ser un objeto',
        );
      }

      const dato = item as Record<string, unknown>;

      const id_producto = this.validarUUID(
        dato.id_producto,
        'id_producto',
      );

      const cantidad = dato.cantidad;

      if (
        typeof cantidad !== 'number' ||
        !Number.isInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > 100
      ) {
        throw new BadRequestException(
          'La cantidad debe ser un entero entre 1 y 100',
        );
      }

      if (productosRegistrados.has(id_producto)) {
        throw new BadRequestException(
          'No se puede repetir un producto dentro del ticket',
        );
      }

      productosRegistrados.add(id_producto);

      return {
        id_producto,
        cantidad,
      };
    });
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

  // CREATE - Crear ticket
  async create(dto: CreateTicketDto) {
    const id_persona = this.validarUUID(
      dto?.id_persona,
      'id_persona',
    );

    const id_horario = this.validarUUID(
      dto?.id_horario,
      'id_horario',
    );

    const items = this.validarItems(dto?.items);

    const notas =
      dto?.notas !== undefined
        ? this.validarNotas(dto.notas)
        : undefined;

    // Reintentar en caso de conflicto de concurrencia
    for (let intento = 0; intento < 3; intento++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // Verificar persona
            const persona = await tx.persona.findUnique({
              where: { id_persona },
            });

            if (!persona) {
              throw new NotFoundException(
                'La persona no existe',
              );
            }

            // Verificar horario y evento
            const horario = await tx.horario.findUnique({
              where: { id_horario },
              include: { evento: true },
            });

            if (!horario) {
              throw new NotFoundException(
                'El horario no existe',
              );
            }

            if (
              !horario.abierto ||
              !horario.evento.activo
            ) {
              throw new ConflictException(
                'El horario o evento está cerrado',
              );
            }

            const productosCalculados: {
              id_producto: string;
              cantidad: number;
              precio_unitario: Prisma.Decimal;
            }[] = [];

            let total = new Prisma.Decimal(0);
            const ahora = new Date();

            // Comprobar cada producto
            for (const item of items) {
              const disponibilidad =
                await tx.horario_producto.findUnique({
                  where: {
                    id_horario_id_producto: {
                      id_horario,
                      id_producto: item.id_producto,
                    },
                  },
                  include: {
                    producto: true,
                  },
                });

              if (
                !disponibilidad ||
                !disponibilidad.producto.activo
              ) {
                throw new BadRequestException(
                  'Producto no disponible para este horario',
                );
              }

              if (disponibilidad.cupo_total < 0) {
                throw new ConflictException(
                  'El cupo configurado no es válido',
                );
              }

              // Contar unidades que ocupan cupo
              const ocupacion =
                await tx.ticket_item.aggregate({
                  where: {
                    id_producto: item.id_producto,
                    ticket: {
                      id_horario,
                      OR: [
                        {
                          estado: {
                            in: [
                              'pago_en_revision',
                              'confirmado',
                              'entregado',
                            ],
                          },
                        },
                        {
                          estado: 'reservado',
                          expira_en: {
                            gt: ahora,
                          },
                        },
                      ],
                    },
                  },
                  _sum: {
                    cantidad: true,
                  },
                });

              const ocupados =
                ocupacion._sum.cantidad ?? 0;

              if (
                ocupados + item.cantidad >
                disponibilidad.cupo_total
              ) {
                throw new ConflictException(
                  'No hay cupos suficientes para el producto solicitado',
                );
              }

              // Guardar los datos calculados
              productosCalculados.push({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario:
                  disponibilidad.producto.precio,
              });

              total = total.plus(
                disponibilidad.producto.precio.mul(
                  item.cantidad,
                ),
              );
            }

            // Crear ticket y sus productos
            return tx.ticket.create({
              data: {
                persona: {
                  connect: { id_persona },
                },
                horario: {
                  connect: { id_horario },
                },
                codigo_acceso: randomUUID(),
                expira_en: new Date(
                  Date.now() + 15 * 60 * 1000,
                ),
                total,
                ...(notas !== undefined
                  ? { notas }
                  : {}),
                items: {
                  create: productosCalculados.map(
                    (producto) => ({
                      producto: {
                        connect: {
                          id_producto:
                            producto.id_producto,
                        },
                      },
                      cantidad: producto.cantidad,
                      precio_unitario:
                        producto.precio_unitario,
                    }),
                  ),
                },
              },
              include: {
                items: true,
              },
            });
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
            'Conflicto al reservar. Intenta nuevamente',
          );
        }

        throw error;
      }
    }

    throw new ConflictException(
      'No se pudo completar la reservación',
    );
  }

  // READ - Obtener todos los tickets
  async findAll() {
    return this.prisma.ticket.findMany({
      select: {
        id_ticket: true,
        id_persona: true,
        id_horario: true,
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
      throw new NotFoundException(
        'El ticket no existe',
      );
    }

    return ticket;
  }

  // UPDATE - Actualizar ticket
  async update(
    id: string,
    dto: UpdateTicketDto,
  ) {
    const ticket = await this.findOne(id);

    const data: {
      notas?: string | null;
      estado?: 'cancelado';
    } = {};

    if (dto?.notas !== undefined) {
      data.notas = this.validarNotas(dto.notas);
    }

    if (dto?.estado !== undefined) {
      if (dto.estado !== 'cancelado') {
        throw new BadRequestException(
          'Solo se permite cambiar el estado a cancelado',
        );
      }

      if (ticket.estado !== 'reservado') {
        throw new ConflictException(
          'Solo se pueden cancelar tickets reservados',
        );
      }

      const pagos = await this.prisma.pago.count({
        where: { id_ticket: id },
      });

      if (pagos > 0) {
        throw new ConflictException(
          'No se puede cancelar un ticket con pagos registrados',
        );
      }

      data.estado = 'cancelado';
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'No se enviaron campos para actualizar',
      );
    }

    try {
      return await this.prisma.ticket.update({
        where: {
          id_ticket: id,
        },
        data,
      });
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'El ticket no existe',
        );
      }

      throw error;
    }
  }

  // DELETE - Eliminar ticket
  async remove(id: string) {
    const ticket = await this.findOne(id);

    if (
      ticket.estado !== 'reservado' &&
      ticket.estado !== 'cancelado'
    ) {
      throw new ConflictException(
        'Solo se pueden eliminar tickets sin confirmar',
      );
    }

    if (ticket.pagos.length > 0) {
      throw new ConflictException(
        'No se puede eliminar un ticket con pagos registrados',
      );
    }

    try {
      await this.prisma.ticket.delete({
        where: {
          id_ticket: id,
        },
      });

      return {
        mensaje: 'Ticket eliminado correctamente',
      };
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'El ticket no existe',
        );
      }

      if (this.esErrorPrisma(error, 'P2003')) {
        throw new ConflictException(
          'El ticket tiene registros relacionados',
        );
      }

      throw error;
    }
  }
}
