import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

import { PrismaService } from '../prisma/prisma.service.js';
import { ticketsPendientes } from '../common/cupos.js';
import { esErrorPrisma } from '../common/prisma-utils.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

const scrypt = promisify(scryptCallback);

// Campos que se pueden devolver en las respuestas (nunca password_hash)
const camposPublicos = {
  id_user: true,
  nombre: true,
  apellido: true,
  telefono: true,
  email: true,
  rol: true,
  created_at: true,
} as const;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Hash seguro de la contraseña (el largo lo valida el DTO)
  private async generarHash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;

    return `scrypt$${salt}$${hash.toString('hex')}`;
  }

  // CREATE - Registro de cliente o datos de invitado.
  // - Correo nuevo: se crea el user (rol siempre cliente).
  // - Correo de un invitado: se reutiliza y se actualizan sus datos; si
  //   viene password, el invitado pasa a ser cuenta y conserva sus pedidos.
  // - Correo de una cuenta activa con contraseña: 409, debe iniciar sesión.
  // - Correo de una cuenta desactivada: se reactiva.
  async create(dto: CreateUserDto) {
    const existente = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id_user: true, password_hash: true, activo: true },
    });

    if (existente?.activo && existente.password_hash !== null) {
      throw new ConflictException(
        'Ya existe una cuenta con ese correo. Inicia sesión',
      );
    }

    const password_hash =
      dto.password !== undefined
        ? await this.generarHash(dto.password)
        : undefined;

    const datos = {
      nombre: dto.nombre,
      apellido: dto.apellido,
      telefono: dto.telefono,
      ...(password_hash !== undefined && { password_hash }),
    };

    if (existente) {
      return this.prisma.user.update({
        where: { id_user: existente.id_user },
        data: { ...datos, activo: true },
        select: camposPublicos,
      });
    }

    try {
      return await this.prisma.user.create({
        data: { ...datos, email: dto.email, rol: 'cliente' },
        select: camposPublicos,
      });
    } catch (error) {
      // Dos registros simultáneos con el mismo correo
      if (esErrorPrisma(error, 'P2002')) {
        throw new ConflictException(
          'Ya existe un usuario con ese correo electrónico',
        );
      }

      throw error;
    }
  }

  // READ - Obtener todos los users activos
  async findAll() {
    return this.prisma.user.findMany({
      where: { activo: true },
      select: camposPublicos,
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // READ - Obtener un user por ID
  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id_user: id,
        activo: true,
      },
      select: camposPublicos,
    });

    if (!user) {
      throw new NotFoundException('El usuario no existe');
    }

    return user;
  }

  // UPDATE - Actualizar datos (nunca el rol)
  // TODO(auth): para cambiar la contraseña pedir la actual
  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No se enviaron campos para actualizar');
    }

    try {
      return await this.prisma.user.update({
        where: {
          id_user: id,
        },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre }),
          ...(dto.apellido !== undefined && { apellido: dto.apellido }),
          ...(dto.telefono !== undefined && { telefono: dto.telefono }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.password !== undefined && {
            password_hash: await this.generarHash(dto.password),
          }),
        },
        select: camposPublicos,
      });
    } catch (error) {
      if (esErrorPrisma(error, 'P2002')) {
        throw new ConflictException(
          'Ya existe un usuario con ese correo electrónico',
        );
      }

      throw error;
    }
  }

  // DELETE - Desactivar la cuenta (se conserva su historial de pedidos).
  // Si vuelve a registrarse con el mismo correo, se reactiva.
  async remove(id: string) {
    await this.findOne(id);

    const pendientes = await this.prisma.ticket.count({
      where: { id_user: id, ...ticketsPendientes() },
    });

    if (pendientes > 0) {
      throw new ConflictException(
        'El usuario tiene pedidos en curso; no se puede desactivar',
      );
    }

    await this.prisma.user.update({
      where: { id_user: id },
      data: { activo: false },
    });

    return {
      mensaje: 'Usuario eliminado correctamente',
    };
  }
}
