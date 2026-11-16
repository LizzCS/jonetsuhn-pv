import { Module } from '@nestjs/common';

import { ProductoController } from './producto.controller.js';
import { ProductoService } from './producto.service.js';

@Module({
  controllers: [ProductoController],
  providers: [ProductoService],
})
export class ProductoModule {}
