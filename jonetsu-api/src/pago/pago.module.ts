import { Module } from '@nestjs/common';

import { ComprobanteStorageService } from './comprobante-storage.service.js';
import { PagoController } from './pago.controller.js';
import { PagoService } from './pago.service.js';

@Module({
  controllers: [PagoController],
  providers: [PagoService, ComprobanteStorageService],
})
export class PagoModule {}
