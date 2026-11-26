import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
<<<<<<< HEAD
import { AccionAdminDto } from '../common/dto/accion-admin.dto.js';
import { COMPROBANTE_CAMPO } from '../common/reglas-negocio.js';
=======
import { SoloAdmin } from '../auth/decorators/solo-admin.decorator.js';
import { Usuario } from '../auth/decorators/usuario.decorator.js';
import { ConAcceso } from '../auth/decorators/con-acceso.decorator.js';
import { AccesoActual } from '../auth/acceso.js';
import type { Acceso } from '../auth/acceso.js';
import { ApiArchivo } from '../common/archivos/api-archivo.decorator.js';
import {
  COMPROBANTE_CAMPO,
  METODOS_PAGO_HABILITADOS,
} from '../common/reglas-negocio.js';
>>>>>>> aa7d131 (Acceso por dueño, invitados con cookie y endpoints de admin protegidos)
import { PagoService } from './pago.service.js';
import { CreatePagoDto } from './dto/create-pago.dto.js';
import { FiltroPagosDto } from './dto/filtro-pagos.dto.js';
import { VerificarPagoDto } from './dto/verificar-pago.dto.js';

const comprobantePipe = crearPipeImagen(COMPROBANTE_CAMPO, 'El comprobante');

@Controller('pagos')
export class PagoController {
  constructor(
    private readonly pagoService: PagoService,
  ) {}

  // POST /pagos  (multipart/form-data: id_ticket, metodo?, comprobante)
  @Post()
  @UseInterceptors(
    FileInterceptor(COMPROBANTE_CAMPO, opcionesMulterImagen),
  )
<<<<<<< HEAD
=======
  @ConAcceso()
  @UseInterceptors(FileInterceptor(COMPROBANTE_CAMPO, opcionesMulterImagen))
>>>>>>> aa7d131 (Acceso por dueño, invitados con cookie y endpoints de admin protegidos)
  create(
    @Body() dto: CreatePagoDto,
    @UploadedFile(comprobantePipe) archivo: ArchivoSubido,
    @AccesoActual() acceso: Acceso,
  ) {
    return this.pagoService.create(dto, archivo, acceso);
  }

  // GET /pagos?estado=&id_ticket=  (admin; el cliente ve sus pagos en
  // GET /tickets/:id)
  @Get()
  @SoloAdmin()
  findAll(@Query() filtros: FiltroPagosDto) {
    return this.pagoService.findAll(filtros);
  }

  // GET /pagos/:id  (admin o dueño)
  @Get(':id')
<<<<<<< HEAD
  findOne(
    @Param('id', idValido) id: string,
  ) {
    return this.pagoService.findOne(id);
=======
  @ConAcceso()
  findOne(@Param('id', idValido) id: string, @AccesoActual() acceso: Acceso) {
    return this.pagoService.findOne(id, acceso);
>>>>>>> aa7d131 (Acceso por dueño, invitados con cookie y endpoints de admin protegidos)
  }

  // GET /pagos/:id/comprobante  → devuelve la imagen (admin o dueño)
  @Get(':id/comprobante')
<<<<<<< HEAD
  async comprobante(
    @Param('id', idValido) id: string,
  ) {
    const { stream, tipo } = await this.pagoService.comprobante(id);
=======
  @ConAcceso()
  async comprobante(
    @Param('id', idValido) id: string,
    @AccesoActual() acceso: Acceso,
  ) {
    const { stream, tipo } = await this.pagoService.comprobante(id, acceso);
>>>>>>> aa7d131 (Acceso por dueño, invitados con cookie y endpoints de admin protegidos)
    return new StreamableFile(stream, { type: tipo });
  }

  // PATCH /pagos/:id/comprobante  (multipart: comprobante)
  // Solo mientras el pago esté pendiente y no venza el plazo de la reserva
  @Patch(':id/comprobante')
<<<<<<< HEAD
  @UseInterceptors(
    FileInterceptor(COMPROBANTE_CAMPO, opcionesMulterImagen),
  )
=======
  @ApiArchivo(COMPROBANTE_CAMPO)
  @ConAcceso()
  @UseInterceptors(FileInterceptor(COMPROBANTE_CAMPO, opcionesMulterImagen))
>>>>>>> aa7d131 (Acceso por dueño, invitados con cookie y endpoints de admin protegidos)
  reemplazarComprobante(
    @Param('id', idValido) id: string,
    @UploadedFile(comprobantePipe) archivo: ArchivoSubido,
    @AccesoActual() acceso: Acceso,
  ) {
    return this.pagoService.reemplazarComprobante(id, archivo, acceso);
  }

  // PATCH /pagos/:id/verificar  (admin)
  @Patch(':id/verificar')
  verificar(
    @Param('id', idValido) id: string,
    @Body() dto: VerificarPagoDto,
  ) {
    return this.pagoService.verificar(id, dto);
  }

  // PATCH /pagos/:id/reembolsar  (admin)
  @Patch(':id/reembolsar')
  reembolsar(
    @Param('id', idValido) id: string,
    @Body() dto: AccionAdminDto,
  ) {
    return this.pagoService.reembolsar(id, dto);
  }

  // DELETE /pagos/:id  (admin, solo pagos pendientes)
  @Delete(':id')
<<<<<<< HEAD
  remove(
    @Param('id', idValido) id: string,
  ) {
    return this.pagoService.remove(id);
=======
  @SoloAdmin()
  remove(@Param('id', idValido) id: string, @Usuario('sub') id_admin: string) {
    return this.pagoService.remove(id, id_admin);
>>>>>>> aa7d131 (Acceso por dueño, invitados con cookie y endpoints de admin protegidos)
  }
}
