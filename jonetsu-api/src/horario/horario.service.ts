import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateHorarioDto } from './dto/create-horario.dto.js';
import { UpdateHorarioDto } from './dto/update-horario.dto.js';

@Injectable()
export class HorarioService {
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

  // Validar y convertir la hora para Prisma
  private validarHora(valor: unknown): Date {
    if (
      typeof valor !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(valor)
    ) {
      throw new BadRequestException(
        'La hora debe tener formato HH:mm o HH:mm:ss',
      );
    }

    const horaCompleta =
      valor.length === 5 ? `${valor}:00` : valor;

    return new Date(
      `1970-01-01T${horaCompleta}.000Z`,
    );
  }

  // Validar el campo abierto
  private validarBooleano(valor: unknown): boolean {
    if (typeof valor !== 'boolean') {
      throw new BadRequestException(
        'El campo abierto debe ser true o false',
      );
    }

    return valor;
  }

  // Detectar errores de Prisma
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

  // Comprobar que el evento exista
  private async verificarEvento(id: string) {
    const evento = await this.prisma.evento.findUnique({
      where: {
        id_evento: id,
      },
    });

    if (!evento) {
      throw new NotFoundException(
        'El evento indicado no existe',
      );
    }

    return evento;
  }

  // CREATE - Crear un horario
  async create(dto: CreateHorarioDto) {
    const id_evento = this.validarUUID(
      dto?.id_evento,
      'id_evento',
    );

    const hora = this.validarHora(dto?.hora);

    const abierto =
      dto?.abierto !== undefined
        ? this.validarBooleano(dto.abierto)
        : true;

    await this.verificarEvento(id_evento);

    try {
      return await this.prisma.horario.create({
        data: {
          id_evento,
          hora,
          abierto,
        },
      });
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2002')) {
        throw new ConflictException(
          'El evento ya tiene un horario registrado a esa hora',
        );
      }

      if (this.esErrorPrisma(error, 'P2003')) {
        throw new NotFoundException(
          'El evento indicado no existe',
        );
      }

      throw error;
    }
  }

  // READ - Obtener todos los horarios
  async findAll() {
    return this.prisma.horario.findMany({
      include: {
        evento: {
          select: {
            id_evento: true,
            nombre: true,
            fecha: true,
          },
        },
      },
      orderBy: [
        { id_evento: 'asc' },
        { hora: 'asc' },
      ],
    });
  }

  // READ - Obtener un horario por ID
  async findOne(id: string) {
    const horario = await this.prisma.horario.findUnique({
      where: {
        id_horario: id,
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
      throw new NotFoundException(
        'El horario no existe',
      );
    }

    return horario;
  }

  // UPDATE - Actualizar un horario
  async update(
    id: string,
    dto: UpdateHorarioDto,
  ) {
    await this.findOne(id);

    const data: {
      id_evento?: string;
      hora?: Date;
      abierto?: boolean;
    } = {};

    if (dto?.id_evento !== undefined) {
      data.id_evento = this.validarUUID(
        dto.id_evento,
        'id_evento',
      );

      await this.verificarEvento(data.id_evento);
    }

    if (dto?.hora !== undefined) {
      data.hora = this.validarHora(dto.hora);
    }

    if (dto?.abierto !== undefined) {
      data.abierto = this.validarBooleano(
        dto.abierto,
      );
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'No se enviaron campos para actualizar',
      );
    }

    // Proteger horarios con registros relacionados
    if (
      data.id_evento !== undefined ||
      data.hora !== undefined
    ) {
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

    try {
      return await this.prisma.horario.update({
        where: {
          id_horario: id,
        },
        data,
      });
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2002')) {
        throw new ConflictException(
          'El evento ya tiene un horario registrado a esa hora',
        );
      }

      if (this.esErrorPrisma(error, 'P2003')) {
        throw new NotFoundException(
          'El evento indicado no existe',
        );
      }

      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'El horario no existe',
        );
      }

      throw error;
    }
  }

  // DELETE - Eliminar un horario
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

    try {
      await this.prisma.horario.delete({
        where: {
          id_horario: id,
        },
      });

      return {
        mensaje: 'Horario eliminado correctamente',
      };
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2003')) {
        throw new ConflictException(
          'El horario tiene registros relacionados',
        );
      }

      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'El horario no existe',
        );
      }

      throw error;
    }
  }
}
