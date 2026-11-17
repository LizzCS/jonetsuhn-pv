import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { ArchivosService } from '../common/archivos/archivos.service.js';
import type { ArchivoSubido } from '../common/archivos/imagen.pipe.js';
import { disponibilidadHorario, ticketsPendientes } from '../common/cupos.js';
import {
  ahoraLocal,
  fechaADate,
  fechaHoraEvento,
  hoyLocal,
} from '../common/fechas.js';
import { CreateEventoDto } from './dto/create-evento.dto.js';
import { FiltroEventosDto } from './dto/filtro-eventos.dto.js';
import { UpdateEventoDto } from './dto/update-evento.dto.js';

@Injectable()
export class EventoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly archivos: ArchivosService,
  ) {}

  private validarFechaFutura(fecha: string) {
    if (Number.isNaN(fechaADate(fecha).getTime())) {
      throw new BadRequestException('fecha no es una fecha válida');
    }

    if (fecha < hoyLocal()) {
      throw new BadRequestException('La fecha del servicio ya pasó');
    }
  }

  // Tickets en curso en cualquier horario del evento
  private async contarTicketsPendientes(id_evento: string) {
    return this.prisma.ticket.count({
      where: { horario: { id_evento }, ...ticketsPendientes() },
    });
  }

  // Evento con sus horarios y, por horario, los platos disponibles.
  // Si `soloFuturos`, se omiten los horarios que ya pasaron hoy.
  private async conHorarios<T extends { id_evento: string; fecha: Date }>(
    evento: T,
    soloFuturos: boolean,
  ) {
    const horarios = await this.prisma.horario.findMany({
      where: { id_evento: evento.id_evento, activo: true },
      orderBy: { hora: 'asc' },
    });

    const ahora = ahoraLocal();
    const visibles = soloFuturos
      ? horarios.filter(
          (horario) => fechaHoraEvento(evento.fecha, horario.hora) > ahora,
        )
      : horarios;

    return {
      ...evento,
      horarios: await Promise.all(
        visibles.map(async (horario) => ({
          id_horario: horario.id_horario,
          hora: horario.hora,
          abierto: horario.abierto,
          productos: await disponibilidadHorario(this.prisma, horario.id_horario),
        })),
      ),
    };
  }

  private async buscarActivo(id: string) {
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

  // CREATE
  async create(dto: CreateEventoDto) {
    this.validarFechaFutura(dto.fecha);

    return this.prisma.evento.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        fecha: fechaADate(dto.fecha),
      },
    });
  }

  // READ - Servicios de hoy en adelante, con horarios y platos disponibles.
  // Con ?incluir_pasados=true devuelve también los pasados (panel admin).
  async findAll(filtros: FiltroEventosDto = {}) {
    const incluirPasados = filtros.incluir_pasados === true;

    const eventos = await this.prisma.evento.findMany({
      where: {
        activo: true,
        ...(!incluirPasados && { fecha: { gte: fechaADate(hoyLocal()) } }),
      },
      orderBy: {
        fecha: incluirPasados ? 'desc' : 'asc',
      },
    });

    return Promise.all(
      eventos.map((evento) => this.conHorarios(evento, !incluirPasados)),
    );
  }

  // READ - Evento por ID con todos sus horarios y platos disponibles
  async findOne(id: string) {
    const evento = await this.buscarActivo(id);
    return this.conHorarios(evento, false);
  }

  // UPDATE - No se cambia la fecha si hay pedidos en curso: primero se
  // reagendan uno por uno
  async update(id: string, dto: UpdateEventoDto) {
    const evento = await this.buscarActivo(id);

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No se enviaron campos para actualizar');
    }

    const cambiaFecha =
      dto.fecha !== undefined &&
      dto.fecha !== evento.fecha.toISOString().slice(0, 10);

    if (cambiaFecha && dto.fecha !== undefined) {
      this.validarFechaFutura(dto.fecha);

      if ((await this.contarTicketsPendientes(id)) > 0) {
        throw new ConflictException(
          'El servicio tiene pedidos en curso; reagéndalos antes de cambiar la fecha',
        );
      }
    }

    return this.prisma.evento.update({
      where: {
        id_evento: id,
      },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.descripcion !== undefined && {
          descripcion: dto.descripcion,
        }),
        ...(dto.fecha !== undefined && { fecha: fechaADate(dto.fecha) }),
      },
    });
  }

  // IMAGEN - Subir o reemplazar (admin)
  async subirImagen(id: string, archivo: ArchivoSubido) {
    const evento = await this.buscarActivo(id);

    const clave = await this.archivos.guardar(
      'eventos',
      archivo.buffer,
      archivo.mimetype,
    );

    try {
      const actualizado = await this.prisma.evento.update({
        where: { id_evento: id },
        data: { imagen_url: clave },
      });

      await this.archivos.borrar(evento.imagen_url);

      return actualizado;
    } catch (error) {
      await this.archivos.borrar(clave);
      throw error;
    }
  }

  // IMAGEN - Ver
  async imagen(id: string) {
    const evento = await this.buscarActivo(id);
    return this.archivos.abrir(evento.imagen_url);
  }

  // DELETE - Soft delete del evento, sus horarios y sus cupos.
  // Bloqueado si hay pedidos en curso (primero se reagendan).
  async remove(id: string) {
    await this.buscarActivo(id);

    if ((await this.contarTicketsPendientes(id)) > 0) {
      throw new ConflictException(
        'El servicio tiene pedidos en curso; reagéndalos antes de eliminarlo',
      );
    }

    await this.prisma.$transaction([
      this.prisma.horario_producto.updateMany({
        where: { horario: { id_evento: id } },
        data: { activo: false },
      }),
      this.prisma.horario.updateMany({
        where: { id_evento: id },
        data: { activo: false },
      }),
      this.prisma.evento.update({
        where: { id_evento: id },
        data: { activo: false },
      }),
    ]);

    return {
      mensaje: 'Evento eliminado correctamente',
    };
  }
}
