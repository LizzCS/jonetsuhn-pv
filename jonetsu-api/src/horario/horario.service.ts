import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateHorarioDto } from './dto/create-horario.dto.js';
import { UpdateHorarioDto } from './dto/update-horario.dto.js';

@Injectable()
export class HorarioService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(dto: CreateHorarioDto) {
    const evento = await this.prisma.evento.findFirst({
      where: {
        id_evento: dto.id_evento,
        activo: true,
      },
    });

    if (!evento) {
      throw new NotFoundException('El evento no existe');
    }

    return this.prisma.horario.create({
      data: {
        id_evento: dto.id_evento,
        hora: new Date(`1970-01-01T${dto.hora}:00.000Z`),
        abierto: dto.abierto ?? true,
      },
    });
  }

  // READ - Obtener todos los horarios
  async findAll() {
    return this.prisma.horario.findMany({
      where: {
        activo: true,
      },
      include: {
        evento: {
          select: {
            id_evento: true,
            nombre: true,
            fecha: true,
          },
        },
      },
      orderBy: [{ id_evento: 'asc' }, { hora: 'asc' }],
    });
  }

  // READ - Obtener un horario por ID
  async findOne(id: string) {
    const horario = await this.prisma.horario.findUnique({
      where: {
        id_horario: id,
        activo: true,
      },
      include: {
        evento: {
          select: {
            id_evento: true,
            nombre: true,
            fecha: true,
          },
        },
      },
    });

    if (!horario) {
      throw new NotFoundException('El horario no existe');
    }

    return horario;
  }

  // UPDATE
  async update(id: string, dto: UpdateHorarioDto) {
    await this.findOne(id);

    const data = {
      ...(dto.id_evento !== undefined && {
        id_evento: dto.id_evento,
      }),
      ...(dto.hora !== undefined && {
        hora: new Date(`1970-01-01T${dto.hora}:00.000Z`),
      }),
      ...(dto.abierto !== undefined && {
        abierto: dto.abierto,
      }),
    };

    if (dto.id_evento !== undefined) {
      const evento = await this.prisma.evento.findFirst({
        where: {
          id_evento: dto.id_evento,
          activo: true,
        },
      });

      if (!evento) {
        throw new NotFoundException('El evento no existe');
      }
    }

    // Proteger horarios con registros relacionados
    if (dto.id_evento !== undefined || dto.hora !== undefined) {
      const [tickets, productos] = await Promise.all([
        this.prisma.ticket.count({
          where: { id_horario: id },
        }),
        this.prisma.horario_producto.count({
          where: { id_horario: id },
        }),
      ]);

      if (tickets > 0 || productos > 0) {
        throw new ConflictException(
          'No se puede cambiar el evento o la hora de un horario con tickets o productos asociados',
        );
      }
    }

    return this.prisma.horario.update({
      where: {
        id_horario: id,
      },
      data,
    });
  }

  // DELETE
  async remove(id: string) {
    await this.findOne(id);

    const [tickets, productos] = await Promise.all([
      this.prisma.ticket.count({
        where: { id_horario: id },
      }),
      this.prisma.horario_producto.count({
        where: { id_horario: id },
      }),
    ]);

    if (tickets > 0 || productos > 0) {
      throw new ConflictException(
        'No se puede eliminar un horario con tickets o productos asociados',
      );
    }

    await this.prisma.horario.update({
      where: {
        id_horario: id,
      },
      data: {
        activo: false,
      },
    });

    return {
      mensaje: 'Horario eliminado correctamente',
    };
  }
}
