import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEventoDto } from './dto/create-evento.dto.js';
import { UpdateEventoDto } from './dto/update-evento.dto.js';

@Injectable()
export class EventoService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(dto: CreateEventoDto) {
    return this.prisma.evento.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        fecha: new Date(`${dto.fecha}T00:00:00.000Z`),
      },
    });
  }

  // READ - Obtener todos los eventos activos
  async findAll() {
    return this.prisma.evento.findMany({
      where: {
        activo: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  // READ - Obtener evento por ID
  async findOne(id: string) {
    const evento = await this.prisma.evento.findFirst({
      where: {
        id_evento: id,
        activo: true,
      },
    });

    if (!evento) {
      throw new NotFoundException('El evento no existe');
    }

    return evento;
  }

  // UPDATE -- NEED TO CHECK THIS THING
  async update(id: string, dto: UpdateEventoDto) {
    await this.findOne(id);

    return this.prisma.evento.update({
      where: {
        id_evento: id,
      },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.descripcion !== undefined && {
          descripcion: dto.descripcion,
        }),
        ...(dto.fecha !== undefined && {
          fecha: new Date(`${dto.fecha}T00:00:00.000Z`),
        }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });
  }

  // DELETE - Soft delete
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.evento.update({
      where: {
        id_evento: id,
      },
      data: {
        activo: false,
      },
    });

    return {
      mensaje: 'Evento eliminado correctamente',
    };
  }
}
