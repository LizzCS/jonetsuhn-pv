import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';

@Injectable()
export class CategoriaService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Validar el nombre de la categoría
  private validarNombre(nombre: unknown): string {
    if (typeof nombre !== 'string') {
      throw new BadRequestException(
        'El nombre debe ser un texto',
      );
    }

    const nombreLimpio = nombre.trim();

    if (
      nombreLimpio.length < 2 ||
      nombreLimpio.length > 100
    ) {
      throw new BadRequestException(
        'El nombre debe tener entre 2 y 100 caracteres',
      );
    }

    return nombreLimpio;
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

  // CREATE - Crear una categoría
  async create(dto: CreateCategoriaDto) {
    const nombre = this.validarNombre(dto?.nombre);

    try {
      return await this.prisma.categoria.create({
        data: {
          nombre,
        },
      });
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2002')) {
        throw new ConflictException(
          'Ya existe una categoría con ese nombre',
        );
      }

      throw error;
    }
  }

  // READ - Obtener todas las categorías
  async findAll() {
    return await this.prisma.categoria.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  // READ - Obtener una categoría por ID
  async findOne(id: string) {
    const categoria = await this.prisma.categoria.findUnique({
      where: {
        id_categoria: id,
      },
    });

    if (!categoria) {
      throw new NotFoundException(
        'La categoría no existe',
      );
    }

    return categoria;
  }

  // UPDATE - Actualizar una categoría
  async update(
    id: string,
    dto: UpdateCategoriaDto,
  ) {
    const nombre = this.validarNombre(dto?.nombre);

    await this.findOne(id);

    try {
      return await this.prisma.categoria.update({
        where: {
          id_categoria: id,
        },
        data: {
          nombre,
        },
      });
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2002')) {
        throw new ConflictException(
          'Ya existe una categoría con ese nombre',
        );
      }

      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'La categoría no existe',
        );
      }

      throw error;
    }
  }

  // DELETE - Eliminar una categoría
  async remove(id: string) {
    await this.findOne(id);

    const cantidadProductos =
      await this.prisma.producto.count({
        where: {
          id_categoria: id,
        },
      });

    if (cantidadProductos > 0) {
      throw new ConflictException(
        'No se puede eliminar una categoría que tiene productos asociados',
      );
    }

    try {
      await this.prisma.categoria.delete({
        where: {
          id_categoria: id,
        },
      });

      return {
        mensaje: 'Categoría eliminada correctamente',
      };
    } catch (error) {
      if (this.esErrorPrisma(error, 'P2003')) {
        throw new ConflictException(
          'La categoría tiene registros asociados',
        );
      }

      if (this.esErrorPrisma(error, 'P2025')) {
        throw new NotFoundException(
          'La categoría no existe',
        );
      }

      throw error;
    }
  }
}
