import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';
import { UpdateProductoDto } from './dto/update-producto.dto.js';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(dto: CreateProductoDto) {
    const categoria = await this.prisma.categoria.findFirst({
      where: {
        id_categoria: dto.id_categoria,
        activo: true,
      },
    });

    if (!categoria) {
      throw new NotFoundException('La categoría no existe');
    }

    return this.prisma.producto.create({
      data: {
        id_categoria: dto.id_categoria,
        nombre: dto.nombre,
        precio: dto.precio,
      },
    });
  }

  // READ ALL
  async findAll() {
    return this.prisma.producto.findMany({
      where: { activo: true },
      include: {
        categoria: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  // READ ONE
  async findOne(id: string) {
    const producto = await this.prisma.producto.findFirst({
      where: {
        id_producto: id,
        activo: true,
      },
      include: {
        categoria: true,
      },
    });

    if (!producto) {
      throw new NotFoundException('El producto no existe');
    }

    return producto;
  }

  // UPDATE
  async update(id: string, dto: UpdateProductoDto) {
    await this.findOne(id);

    if (dto.id_categoria !== undefined) {
      const categoria = await this.prisma.categoria.findFirst({
        where: {
          id_categoria: dto.id_categoria,
          activo: true,
        },
      });

      if (!categoria) {
        throw new NotFoundException('La categoría no existe');
      }
    }

    return this.prisma.producto.update({
      where: {
        id_producto: id,
      },
      data: {
        ...(dto.id_categoria !== undefined && {
          id_categoria: dto.id_categoria,
        }),
        ...(dto.nombre !== undefined && {
          nombre: dto.nombre,
        }),
        ...(dto.precio !== undefined && {
          precio: dto.precio,
        }),
      },
    });
  }

  // DELETE - Soft delete
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.producto.update({
      where: {
        id_producto: id,
      },
      data: {
        activo: false,
      },
    });

    return {
      mensaje: 'Producto eliminado correctamente',
    };
  }
}
