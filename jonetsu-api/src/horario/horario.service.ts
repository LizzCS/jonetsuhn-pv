import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  disponibilidadHorario,
  ticketsPendientes,
  unidadesOcupadas,
} from '../common/cupos.js';
import { ahoraLocal, fechaHoraEvento, horaADate } from '../common/fechas.js';
import { AsignarProductoDto, UpdateCupoDto } from './dto/cupo-producto.dto.js';
import { CreateHorarioDto } from './dto/create-horario.dto.js';
import { FiltroHorariosDto } from './dto/filtro-horarios.dto.js';
import { UpdateHorarioDto } from './dto/update-horario.dto.js';

const incluirEvento = {
  evento: {
    select: {
      id_evento: true,
      nombre: true,
      fecha: true,
    },
  },
} as const;

@Injectable()
export class HorarioService {
  constructor(private readonly prisma: PrismaService) {}

  // El evento debe existir y la nueva fecha/hora no puede haber pasado
  private async validarEventoYHora(id_evento: string, hora: Date) {
    const evento = await this.prisma.evento.findFirst({
      where: {
        id_evento,
        activo: true,
      },
    });

    if (!evento) {
      throw new NotFoundException('El evento no existe');
    }

    if (fechaHoraEvento(evento.fecha, hora) <= ahoraLocal()) {
      throw new BadRequestException('Esa fecha y hora ya pasaron');
    }
  }

  private async contarTicketsPendientes(id_horario: string) {
    return this.prisma.ticket.count({
      where: { id_horario, ...ticketsPendientes() },
    });
  }

  // CREATE - Si existe un horario borrado a esa hora, se reactiva
  async create(dto: CreateHorarioDto) {
    const hora = horaADate(dto.hora);

    await this.validarEventoYHora(dto.id_evento, hora);

    const existente = await this.prisma.horario.findUnique({
      where: {
        id_evento_hora: { id_evento: dto.id_evento, hora },
      },
    });

    if (existente?.activo) {
      throw new ConflictException('El evento ya tiene un horario a esa hora');
    }

    if (existente) {
      return this.prisma.horario.update({
        where: { id_horario: existente.id_horario },
        data: { activo: true, abierto: dto.abierto ?? true },
        include: incluirEvento,
      });
    }

    return this.prisma.horario.create({
      data: {
        id_evento: dto.id_evento,
        hora,
        abierto: dto.abierto ?? true,
      },
      include: incluirEvento,
    });
  }

  // READ - Obtener horarios (opcionalmente de un evento)
  async findAll(filtros: FiltroHorariosDto = {}) {
    return this.prisma.horario.findMany({
      where: {
        activo: true,
        ...(filtros.id_evento !== undefined && {
          id_evento: filtros.id_evento,
        }),
      },
      include: incluirEvento,
      orderBy: [{ evento: { fecha: 'asc' } }, { hora: 'asc' }],
    });
  }

  // READ - Obtener un horario por ID
  async findOne(id: string) {
    const horario = await this.prisma.horario.findFirst({
      where: {
        id_horario: id,
        activo: true,
      },
      include: incluirEvento,
    });

    if (!horario) {
      throw new NotFoundException('El horario no existe');
    }

    return horario;
  }

  // UPDATE - "abierto" se cambia siempre; la hora o el evento solo si no
  // hay pedidos en curso (primero se reagendan uno por uno)
  async update(id: string, dto: UpdateHorarioDto) {
    const horario = await this.findOne(id);

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No se enviaron campos para actualizar');
    }

    const id_evento = dto.id_evento ?? horario.id_evento;
    const hora = dto.hora !== undefined ? horaADate(dto.hora) : horario.hora;

    const cambiaHoraOEvento =
      id_evento !== horario.id_evento ||
      hora.getTime() !== horario.hora.getTime();

    if (cambiaHoraOEvento) {
      await this.validarEventoYHora(id_evento, hora);

      if ((await this.contarTicketsPendientes(id)) > 0) {
        throw new ConflictException(
          'El horario tiene pedidos en curso; reagéndalos antes de cambiar la hora',
        );
      }

      const repetido = await this.prisma.horario.findUnique({
        where: { id_evento_hora: { id_evento, hora } },
      });

      if (repetido) {
        throw new ConflictException(
          repetido.activo
            ? 'El evento ya tiene un horario a esa hora'
            : 'Hay un horario eliminado a esa hora; créalo de nuevo para reactivarlo',
        );
      }
    }

    return this.prisma.horario.update({
      where: {
        id_horario: id,
      },
      data: {
        ...(cambiaHoraOEvento && { id_evento, hora }),
        ...(dto.abierto !== undefined && { abierto: dto.abierto }),
      },
      include: incluirEvento,
    });
  }

  // DELETE - Soft delete del horario y sus cupos, si no hay pedidos en curso
  async remove(id: string) {
    await this.findOne(id);

    if ((await this.contarTicketsPendientes(id)) > 0) {
      throw new ConflictException(
        'El horario tiene pedidos en curso; reagéndalos antes de eliminarlo',
      );
    }

    await this.prisma.$transaction([
      this.prisma.horario_producto.updateMany({
        where: { id_horario: id },
        data: { activo: false },
      }),
      this.prisma.horario.update({
        where: { id_horario: id },
        data: { activo: false },
      }),
    ]);

    return {
      mensaje: 'Horario eliminado correctamente',
    };
  }

  // ---- Cupos por plato (horario_producto) ----

  // GET - Platos del horario con cupo total, ocupados y disponibles
  async productos(id: string) {
    await this.findOne(id);
    return disponibilidadHorario(this.prisma, id);
  }

  // POST - Asignar un plato con su cupo (reactiva si estaba quitado)
  async asignarProducto(id: string, dto: AsignarProductoDto) {
    await this.findOne(id);

    const producto = await this.prisma.producto.findFirst({
      where: { id_producto: dto.id_producto, activo: true },
    });

    if (!producto) {
      throw new NotFoundException('El producto no existe');
    }

    const existente = await this.prisma.horario_producto.findUnique({
      where: {
        id_horario_id_producto: {
          id_horario: id,
          id_producto: dto.id_producto,
        },
      },
    });

    if (existente?.activo) {
      throw new ConflictException(
        'El plato ya está asignado a este horario; cambia su cupo con PATCH',
      );
    }

    await this.validarCupoMinimo(id, dto.id_producto, dto.cupo_total);

    if (existente) {
      await this.prisma.horario_producto.update({
        where: {
          id_horario_id_producto: {
            id_horario: id,
            id_producto: dto.id_producto,
          },
        },
        data: { activo: true, cupo_total: dto.cupo_total },
      });
    } else {
      await this.prisma.horario_producto.create({
        data: {
          id_horario: id,
          id_producto: dto.id_producto,
          cupo_total: dto.cupo_total,
        },
      });
    }

    return disponibilidadHorario(this.prisma, id);
  }

  // PATCH - Cambiar el cupo; no puede quedar por debajo de lo ya vendido
  async actualizarCupo(id: string, id_producto: string, dto: UpdateCupoDto) {
    await this.buscarAsignacion(id, id_producto);
    await this.validarCupoMinimo(id, id_producto, dto.cupo_total);

    await this.prisma.horario_producto.update({
      where: {
        id_horario_id_producto: { id_horario: id, id_producto },
      },
      data: { cupo_total: dto.cupo_total },
    });

    return disponibilidadHorario(this.prisma, id);
  }

  // DELETE - Quitar el plato del horario si no hay pedidos en curso con él
  async quitarProducto(id: string, id_producto: string) {
    await this.buscarAsignacion(id, id_producto);

    const pedidos = await this.prisma.ticket_item.count({
      where: {
        id_producto,
        ticket: { id_horario: id, ...ticketsPendientes() },
      },
    });

    if (pedidos > 0) {
      throw new ConflictException(
        'Hay pedidos en curso con este plato en este horario; no se puede quitar',
      );
    }

    await this.prisma.horario_producto.update({
      where: {
        id_horario_id_producto: { id_horario: id, id_producto },
      },
      data: { activo: false },
    });

    return {
      mensaje: 'Plato quitado del horario correctamente',
    };
  }

  private async buscarAsignacion(id_horario: string, id_producto: string) {
    await this.findOne(id_horario);

    const asignacion = await this.prisma.horario_producto.findFirst({
      where: { id_horario, id_producto, activo: true },
    });

    if (!asignacion) {
      throw new NotFoundException('El plato no está asignado a este horario');
    }

    return asignacion;
  }

  private async validarCupoMinimo(
    id_horario: string,
    id_producto: string,
    cupo_total: number,
  ) {
    const ocupados = await unidadesOcupadas(
      this.prisma,
      id_horario,
      id_producto,
    );

    if (cupo_total < ocupados) {
      throw new ConflictException(
        `Ya hay ${ocupados} unidades vendidas o apartadas; el cupo no puede ser menor`,
      );
    }
  }
}
