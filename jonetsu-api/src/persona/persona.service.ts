import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePersonaDto } from './dto/create-persona.dto.js';
import { UpdatePersonaDto } from './dto/update-persona.dto.js';

const scrypt = promisify(scryptCallback);

// Campos que se pueden devolver en las respuestas
const camposPublicos = {
  id_persona: true,
  nombre: true,
  apellido: true,
  telefono: true,
  email: true,
  rol: true,
  created_at: true,
} as const;

@Injectable()
export class PersonaService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Validar campos de texto
  private validarTexto(
    valor: unknown,
    campo: string,
    max = 150,
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

  // Validar correo electrónico
  private validarCorreo(valor: unknown): string {
    const email = this.validarTexto(
      valor,
      'email',
      254,
    ).toLowerCase();

    const formato = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formato.test(email)) {
      throw new BadRequestException(
        'El correo electrónico no es válido',
      );
    }

    return email;
  }

  // Generar hash seguro de la contraseña
  private async generarHash(
    password: unknown,
  ): Promise<string> {
    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 128
    ) {
      throw new BadRequestException(
        'La contraseña debe tener entre 8 y 128 caracteres',
      );
    }

    const salt = randomBytes(16).toString('hex');

    const hash = (await scrypt(
      password,
      salt,
      64,
    )) as Buffer;

    return `scrypt$${salt}$${hash.toString('hex')}`;
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

  // CREATE - Crear una persona
  async create(dto: CreatePersonaDto) {
    const nombre = this.validarTexto(
      dto?.nombre,
      'nombre',
    );

    const apellido = this.validarTexto(
      dto?.apellido,
      'apellido',
    );

    const telefono = this.validarTexto(
      dto?.telefono,
      'telefono',
      30,
    );

    const email = this.validarCorreo(dto?.email);

    const password_hash =
      dto?.password !== undefined
        ? await this.generarHash(dto.password)
        : undefined;

    try {
      return await this.prisma.persona.create({
        data: {
          nombre,
          apellido,
          telefono,
          email,
          password_hash,
          rol: 'cliente',
        },
        select: camposPublicos,
      });
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2002')) {
        throw new ConflictException(
          'Ya existe una persona con ese correo electrónico',
        );
      }

      throw error;
    }
  }

  // READ - Obtener todas las personas
  async findAll() {
    return this.prisma.persona.findMany({
      select: camposPublicos,
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // READ - Obtener una persona por ID
  async findOne(id: string) {
    const persona = await this.prisma.persona.findUnique({
      where: {
        id_persona: id,
      },
      select: camposPublicos,
    });

    if (!persona) {
      throw new NotFoundException(
        'La persona no existe',
      );
    }

    return persona;
  }

  // UPDATE - Actualizar una persona
  async update(
    id: string,
    dto: UpdatePersonaDto,
  ) {
    await this.findOne(id);

    const data: {
      nombre?: string;
      apellido?: string;
      telefono?: string;
      email?: string;
      password_hash?: string;
    } = {};

    if (dto?.nombre !== undefined) {
      data.nombre = this.validarTexto(
        dto.nombre,
        'nombre',
      );
    }

    if (dto?.apellido !== undefined) {
      data.apellido = this.validarTexto(
        dto.apellido,
        'apellido',
      );
    }

    if (dto?.telefono !== undefined) {
      data.telefono = this.validarTexto(
        dto.telefono,
        'telefono',
        30,
      );
    }

    if (dto?.email !== undefined) {
      data.email = this.validarCorreo(dto.email);
    }

    if (dto?.password !== undefined) {
      data.password_hash = await this.generarHash(
        dto.password,
      );
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'No se enviaron campos para actualizar',
      );
    }

    try {
      return await this.prisma.persona.update({
        where: {
          id_persona: id,
        },
        data,
        select: camposPublicos,
      });
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2002')) {
        throw new ConflictException(
          'Ya existe una persona con ese correo electrónico',
        );
      }

      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'La persona no existe',
        );
      }

      throw error;
    }
  }

  // DELETE - Eliminar una persona
  async remove(id: string) {
    await this.findOne(id);

    const tickets = await this.prisma.ticket.count({
      where: {
        id_persona: id,
      },
    });

    const pagos = await this.prisma.pago.count({
      where: {
        verificado_por: id,
      },
    });

    if (tickets > 0 || pagos > 0) {
      throw new ConflictException(
        'No se puede eliminar una persona con tickets o pagos asociados',
      );
    }

    try {
      await this.prisma.persona.delete({
        where: {
          id_persona: id,
        },
      });

      return {
        mensaje: 'Persona eliminada correctamente',
      };
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2003')) {
        throw new ConflictException(
          'La persona tiene registros relacionados',
        );
      }

      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'La persona no existe',
        );
      }

      throw error;
    }
  }
}
