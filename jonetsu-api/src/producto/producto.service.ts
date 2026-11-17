import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { ArchivosService } from '../common/archivos/archivos.service.js';
import type { ArchivoSubido } from '../common/archivos/imagen.pipe.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';
import { UpdateProductoDto } from './dto/update-producto.dto.js';

@Injectable()
export class ProductoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly archivos: ArchivosService,
  ) {}

  private async validarCategoria(id_categoria: string) {
    const categoria = await this.prisma.categoria.findFirst({
      where: {
        id_categoria,
        activo: true,
      },
    });

    if (!categoria) {
      throw new NotFoundException('La categoría no existe');
    }
  }

  // CREATE
  async create(dto: CreateProductoDto) {
    await this.validarCategoria(dto.id_categoria);

    return this.prisma.producto.create({
      data: {
        id_categoria: dto.id_categoria,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        precio: dto.precio,
      },
      include: {
        categoria: true,
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

  // UPDATE - Cambiar el precio no afecta tickets existentes: cada
  // ticket_item guarda el precio con el que se compró
  async update(id: string, dto: UpdateProductoDto) {
    await this.findOne(id);

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No se enviaron campos para actualizar');
    }

    if (dto.id_categoria !== undefined) {
      await this.validarCategoria(dto.id_categoria);
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
        ...(dto.descripcion !== undefined && {
          descripcion: dto.descripcion,
        }),
        ...(dto.precio !== undefined && {
          precio: dto.precio,
        }),
      },
      include: {
        categoria: true,
      },
    });
  }

  // IMAGEN - Subir o reemplazar (admin)
  async subirImagen(id: string, archivo: ArchivoSubido) {
    const producto = await this.findOne(id);

    const clave = await this.archivos.guardar(
      'productos',
      archivo.buffer,
      archivo.mimetype,
    );

    try {
      const actualizado = await this.prisma.producto.update({
        where: { id_producto: id },
        data: { imagen_url: clave },
        include: { categoria: true },
      });

      await this.archivos.borrar(producto.imagen_url);

      return actualizado;
    } catch (error) {
      await this.archivos.borrar(clave);
      throw error;
    }
  }

  // IMAGEN - Ver
  async imagen(id: string) {
    const producto = await this.findOne(id);
    return this.archivos.abrir(producto.imagen_url);
  }

  // DELETE - Soft delete. Los tickets que ya incluyen este plato se
  // entregan igual; solo deja de ofrecerse en nuevas reservas.
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
