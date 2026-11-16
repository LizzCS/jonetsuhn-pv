import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { idValido } from '../common/id-valido.pipe.js';
import { FileInterceptor } from '@nestjs/platform-express';

import type { ArchivoSubido } from '../common/archivos/imagen.pipe.js';
import {
  crearPipeImagen,
  opcionesMulterImagen,
} from '../common/archivos/imagen.pipe.js';
import { IMAGEN_CAMPO } from '../common/reglas-negocio.js';
import { ProductoService } from './producto.service.js';
import { CreateProductoDto } from './dto/create-producto.dto.js';
import { UpdateProductoDto } from './dto/update-producto.dto.js';

const imagenPipe = crearPipeImagen(IMAGEN_CAMPO, 'La imagen');

@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  // POST /productos
  @Post()
  create(@Body() dto: CreateProductoDto) {
    return this.productoService.create(dto);
  }

  // GET /productos
  @Get()
  findAll() {
    return this.productoService.findAll();
  }

  // GET /productos/:id
  @Get(':id')
  findOne(@Param('id', idValido) id: string) {
    return this.productoService.findOne(id);
  }

  // GET /productos/:id/imagen
  @Get(':id/imagen')
  async imagen(@Param('id', idValido) id: string) {
    const { stream, tipo } = await this.productoService.imagen(id);
    return new StreamableFile(stream, { type: tipo });
  }

  // PATCH /productos/:id/imagen  (multipart: imagen)
  @Patch(':id/imagen')
  @UseInterceptors(FileInterceptor(IMAGEN_CAMPO, opcionesMulterImagen))
  subirImagen(
    @Param('id', idValido) id: string,
    @UploadedFile(imagenPipe) archivo: ArchivoSubido,
  ) {
    return this.productoService.subirImagen(id, archivo);
  }

  // PATCH /productos/:id
  @Patch(':id')
  update(
    @Param('id', idValido) id: string,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productoService.update(id, dto);
  }

  // DELETE /productos/:id
  @Delete(':id')
  remove(@Param('id', idValido) id: string) {
    return this.productoService.remove(id);
  }
}
