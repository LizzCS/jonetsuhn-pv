import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEventoDto } from './dto/create-evento.dto.js';
import { UpdateEventoDto } from './dto/update-evento.dto.js';

@Injectable()
export class EventoService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Validar campos de texto
  private validarTexto(
    valor: unknown,
    campo: string,
    max = 200,
  ): string {
    if (
      typeof valor !== 'string' ||
      !valor.trim() ||
      valor.trim().length > max
    ) {
      throw new BadRequestException(
        `${campo} debe tener entre 1 y ${max} caracteres`,
      );
    }

    return valor.trim();
  }

  // Validar descripción
  private validarDescripcion(
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
        'La descripción debe ser texto de hasta 2000 caracteres',
      );
    }

    return valor.trim();
  }

  // Validar y convertir la fecha
  private validarFecha(valor: unknown): Date {
    if (
      typeof valor !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
      throw new BadRequestException(
        'La fecha debe tener el formato AAAA-MM-DD',
      );
    }

    const fecha = new Date(
      `${valor}T00:00:00.000Z`,
    );

    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.toISOString().slice(0, 10) !== valor
    ) {
      throw new BadRequestException(
        'La fecha proporcionada no es válida',
      );
    }

    return fecha;
  }

  // Validar el estado activo
  private validarBooleano(
    valor: unknown,
    campo: string,
  ): boolean {
    if (typeof valor !== 'boolean') {
      throw new BadRequestException(
        `${campo} debe ser true o false`,
      );
    }

    return valor;
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

  // CREATE - Crear un evento
  async create(dto: CreateEventoDto) {
    const nombre = this.validarTexto(
      dto?.nombre,
      'nombre',
    );

    const fecha = this.validarFecha(
      dto?.fecha,
    );

    const descripcion =
      dto?.descripcion !== undefined
        ? this.validarDescripcion(dto.descripcion)
        : undefined;

    const activo =
      dto?.activo !== undefined
        ? this.validarBooleano(dto.activo, 'activo')
        : true;

    return this.prisma.evento.create({
      data: {
        nombre,
        descripcion,
        fecha,
        activo,
      },
    });
  }

  // READ - Obtener todos los eventos
  async findAll() {
    return this.prisma.evento.findMany({
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  // READ - Obtener un evento por ID
  async findOne(id: string) {
    const evento = await this.prisma.evento.findUnique({
      where: {
        id_evento: id,
      },
    });

    if (!evento) {
      throw new NotFoundException(
        'El evento no existe',
      );
    }

    return evento;
  }

  // UPDATE - Actualizar un evento
  async update(
    id: string,
    dto: UpdateEventoDto,
  ) {
    await this.findOne(id);

    const data: {
      nombre?: string;
      descripcion?: string | null;
      fecha?: Date;
      activo?: boolean;
    } = {};

    if (dto?.nombre !== undefined) {
      data.nombre = this.validarTexto(
        dto.nombre,
        'nombre',
      );
    }

    if (dto?.descripcion !== undefined) {
      data.descripcion = this.validarDescripcion(
        dto.descripcion,
      );
    }

    if (dto?.fecha !== undefined) {
      data.fecha = this.validarFecha(
        dto.fecha,
      );
    }

    if (dto?.activo !== undefined) {
      data.activo = this.validarBooleano(
        dto.activo,
        'activo',
      );
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'No se enviaron campos para actualizar',
      );
    }

    try {
      return await this.prisma.evento.update({
        where: {
          id_evento: id,
        },
        data,
      });
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'El evento no existe',
        );
      }

      throw error;
    }
  }

  // DELETE - Eliminar un evento
  async remove(id: string) {
    await this.findOne(id);

    const cantidadHorarios =
      await this.prisma.horario.count({
        where: {
          id_evento: id,
        },
      });

    if (cantidadHorarios > 0) {
      throw new ConflictException(
        'No se puede eliminar un evento con horarios asociados',
      );
    }

    try {
      await this.prisma.evento.delete({
        where: {
          id_evento: id,
        },
      });

      return {
        mensaje: 'Evento eliminado correctamente',
      };
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2003')) {
        throw new ConflictException(
          'El evento tiene registros relacionados',
        );
      }

      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'El evento no existe',
        );
      }

      throw error;
    }
  }
}
