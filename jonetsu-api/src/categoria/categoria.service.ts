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
  constructor(private readonly prisma: PrismaService) {}

  // CREATE - Si existe una categoría borrada con ese nombre, se reactiva
  async create(dto: CreateCategoriaDto) {
    const existente = await this.prisma.categoria.findUnique({
      where: { nombre: dto.nombre },
    });

    if (existente?.activo) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    if (existente) {
      return this.prisma.categoria.update({
        where: { id_categoria: existente.id_categoria },
        data: { activo: true },
      });
    }

    return this.prisma.categoria.create({
      data: {
        nombre: dto.nombre,
      },
    });
  }

  // READ - Obtener categorías activas
  async findAll() {
    return this.prisma.categoria.findMany({
      where: {
        activo: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  // READ - Obtener categoría por ID
  async findOne(id: string) {
    const categoria = await this.prisma.categoria.findFirst({
      where: {
        id_categoria: id,
        activo: true,
      },
    });

    if (!categoria) {
      throw new NotFoundException('La categoría no existe');
    }

    return categoria;
  }

  // UPDATE
  async update(id: string, dto: UpdateCategoriaDto) {
    await this.findOne(id);

    if (dto.nombre === undefined) {
      throw new BadRequestException('No se enviaron campos para actualizar');
    }

    const repetida = await this.prisma.categoria.findFirst({
      where: { nombre: dto.nombre, NOT: { id_categoria: id } },
    });

    if (repetida) {
      throw new ConflictException(
        repetida.activo
          ? 'Ya existe una categoría con ese nombre'
          : 'Ese nombre es de una categoría eliminada; créala de nuevo para reactivarla',
      );
    }

    return this.prisma.categoria.update({
      where: {
        id_categoria: id,
      },
      data: {
        nombre: dto.nombre,
      },
    });
  }

  // DELETE - Soft delete
  async remove(id: string) {
    await this.findOne(id);

    const productosActivos = await this.prisma.producto.count({
      where: {
        id_categoria: id,
        activo: true,
      },
    });

    if (productosActivos > 0) {
      throw new ConflictException(
        'No se puede eliminar una categoría que tiene productos activos asociados',
      );
    }

    await this.prisma.categoria.update({
      where: {
        id_categoria: id,
      },
      data: {
        activo: false,
      },
    });

    return {
      mensaje: 'Categoría eliminada correctamente',
    };
  }
}
