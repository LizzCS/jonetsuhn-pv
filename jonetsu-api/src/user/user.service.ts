import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { ticketsPendientes } from '../common/cupos.js';
import { esErrorPrisma } from '../common/prisma-utils.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

const BCRYPT_RONDAS = 10;

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
  constructor(private readonly prisma: PrismaService) {}

  // Hash de la contraseña con bcrypt (el salt va dentro del hash).
  // AuthService.login lo compara con bcrypt.compare. El largo lo valida el DTO.
  generarHash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_RONDAS);
  }

  // 409 si el correo ya es de una cuenta activa con contraseña
  async exigirCorreoSinCuenta(email: string) {
    const existente = await this.prisma.user.findUnique({
      where: { email },
      select: { password_hash: true, activo: true },
    });

    if (existente?.activo && existente.password_hash !== null) {
      throw new ConflictException(
        'Ya existe una cuenta con ese correo. Inicia sesión',
      );
    }
  }

  // CREATE - Invitado (sin password) o cuenta creada por un admin.
  // El registro público pasa por AuthService/VerificacionService, que
  // confirma el correo con un código antes de llamar a guardar().
  async create(dto: CreateUserDto) {
    const password_hash =
      dto.password !== undefined
        ? await this.generarHash(dto.password)
        : undefined;

    return this.guardar(dto, password_hash);
  }

  // Crea o actualiza el user de ese correo:
  // - Correo nuevo: se crea el user (rol siempre cliente).
  // - Correo de un invitado: se reutiliza y se actualizan sus datos; si
  //   viene password_hash, el invitado pasa a ser cuenta y conserva sus pedidos.
  // - Correo de una cuenta activa con contraseña: 409, debe iniciar sesión.
  // - Correo de una cuenta desactivada: se reactiva.
  async guardar(
    dto: Pick<CreateUserDto, 'nombre' | 'apellido' | 'telefono' | 'email'>,
    password_hash?: string,
  ) {
    const existente = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id_user: true, password_hash: true, activo: true },
    });

    if (existente?.activo && existente.password_hash !== null) {
      throw new ConflictException(
        'Ya existe una cuenta con ese correo. Inicia sesión',
      );
    }

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

  // UPDATE - Actualizar datos (nunca el rol).
  // Para cambiar su contraseña o su correo, el usuario debe enviar la
  // contraseña actual. Un admin que edita a otro usuario no la necesita.
  async update(
    id: string,
    dto: UpdateUserDto,
    opciones: { sinPasswordActual?: boolean } = {},
  ) {
    await this.findOne(id);

    const { password_actual, ...cambios } = dto;

    if (Object.keys(cambios).length === 0) {
      throw new BadRequestException('No se enviaron campos para actualizar');
    }

    const cambiaAcceso =
      cambios.password !== undefined || cambios.email !== undefined;

    if (cambiaAcceso && !opciones.sinPasswordActual) {
      await this.exigirPasswordActual(id, password_actual);
    }

    try {
      return await this.prisma.user.update({
        where: {
          id_user: id,
        },
        data: {
          ...(cambios.nombre !== undefined && { nombre: cambios.nombre }),
          ...(cambios.apellido !== undefined && {
            apellido: cambios.apellido,
          }),
          ...(cambios.telefono !== undefined && {
            telefono: cambios.telefono,
          }),
          ...(cambios.email !== undefined && { email: cambios.email }),
          ...(cambios.password !== undefined && {
            password_hash: await this.generarHash(cambios.password),
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

  private async exigirPasswordActual(id: string, password?: string) {
    if (!password) {
      throw new BadRequestException(
        'Para cambiar tu contraseña o tu correo envía password_actual',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id_user: id },
      select: { password_hash: true },
    });

    const valida =
      user?.password_hash !== null &&
      user?.password_hash !== undefined &&
      (await bcrypt.compare(password, user.password_hash));

    if (!valida) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
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
