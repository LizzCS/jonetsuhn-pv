import { Module } from '@nestjs/common';

import { PagoController } from './pago.controller.js';
import { PagoService } from './pago.service.js';

@Module({
  controllers: [PagoController],
  providers: [PagoService],
})
export class PagoModule {}
