import {
  BadRequestException,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';

import { IMAGEN_MAX_BYTES, IMAGEN_TIPOS } from '../reglas-negocio.js';

// Archivo recibido por multer en memoria (sin depender de @types/multer)
export interface ArchivoSubido {
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MB = IMAGEN_MAX_BYTES / (1024 * 1024);

// Valida tamaño y tipo real del archivo (revisa los bytes, no solo la extensión).
// `campo` es el nombre del campo multipart y `nombre` cómo se le llama en los mensajes.
export function crearPipeImagen(campo: string, nombre: string) {
  return new ParseFilePipe({
    fileIsRequired: true,
    validators: [
      new MaxFileSizeValidator({
        maxSize: IMAGEN_MAX_BYTES,
        errorMessage: `${nombre} no puede pesar más de ${MB} MB`,
      }),
      new FileTypeValidator({
        fileType: IMAGEN_TIPOS,
        overrideMimeType: true,
        errorMessage: `${nombre} debe ser una imagen JPG, PNG o WEBP`,
      }),
    ],
    exceptionFactory: (error) =>
      new BadRequestException(
        error === 'File is required'
          ? `Debes adjuntar ${nombre.toLowerCase()} en el campo "${campo}"`
          : error,
      ),
  });
}

// Límite de multer: corta archivos enormes antes de cargarlos en memoria.
// Es mayor que el del validador para que el mensaje en español sea el que salga.
export const opcionesMulterImagen = {
  limits: { fileSize: IMAGEN_MAX_BYTES * 2, files: 1 },
};
