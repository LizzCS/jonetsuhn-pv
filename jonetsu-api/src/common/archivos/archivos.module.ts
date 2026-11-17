import { Global, Module } from '@nestjs/common';

import { ArchivosService } from './archivos.service.js';

@Global()
@Module({
  providers: [ArchivosService],
  exports: [ArchivosService],
})
export class ArchivosModule {}
