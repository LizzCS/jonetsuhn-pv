import {
  BadRequestException,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';

import {
  COMPROBANTE_MAX_BYTES,
  COMPROBANTE_TIPOS,
} from '../common/reglas-negocio.js';

// Archivo recibido por multer en memoria (sin depender de @types/multer)
export interface ArchivoSubido {
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MB = COMPROBANTE_MAX_BYTES / (1024 * 1024);

// Valida tamaño y tipo real del archivo (revisa los bytes, no solo la extensión)
export const comprobantePipe = new ParseFilePipe({
  fileIsRequired: true,
  validators: [
    new MaxFileSizeValidator({
      maxSize: COMPROBANTE_MAX_BYTES,
      errorMessage: `El comprobante no puede pesar más de ${MB} MB`,
    }),
    new FileTypeValidator({
      fileType: COMPROBANTE_TIPOS,
      overrideMimeType: true,
      errorMessage: 'El comprobante debe ser una imagen JPG, PNG o WEBP',
    }),
  ],
  exceptionFactory: (error) =>
    new BadRequestException(
      error === 'File is required'
        ? 'Debes adjuntar la imagen del comprobante en el campo "comprobante"'
        : error,
    ),
});

// Límite de multer: corta archivos enormes antes de cargarlos en memoria.
// Es mayor que el del validador para que el mensaje en español sea el que salga.
export const opcionesMulterComprobante = {
  limits: { fileSize: COMPROBANTE_MAX_BYTES * 2, files: 1 },
};
