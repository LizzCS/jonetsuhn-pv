import { Injectable, NotFoundException } from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type CarpetaArchivos = 'comprobantes' | 'productos' | 'eventos';

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const TIPOS_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

// Solo se aceptan claves generadas por este servicio (evita leer otras rutas)
const FORMATO_CLAVE =
  /^(comprobantes|productos|eventos)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

// Guarda imágenes en disco, fuera de cualquier carpeta pública.
// En la base se guarda la clave relativa ("productos/<uuid>.jpg") y el
// archivo se sirve por un endpoint (GET /productos/:id/imagen, etc.).
@Injectable()
export class ArchivosService {
  private readonly raiz =
    process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');

  async guardar(
    carpeta: CarpetaArchivos,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    const extension = EXTENSIONES[mimetype];

    if (!extension) {
      throw new Error(`Tipo de imagen no soportado: ${mimetype}`);
    }

    const clave = `${carpeta}/${randomUUID()}.${extension}`;

    await mkdir(join(this.raiz, carpeta), { recursive: true });
    await writeFile(join(this.raiz, clave), buffer, { flag: 'wx' });

    return clave;
  }

  // Borra sin fallar: si el archivo ya no está, no importa
  async borrar(clave: string | null | undefined): Promise<void> {
    if (!clave || !FORMATO_CLAVE.test(clave)) return;

    await unlink(join(this.raiz, clave)).catch(() => undefined);
  }

  async abrir(clave: string | null | undefined) {
    if (!clave || !FORMATO_CLAVE.test(clave)) {
      throw new NotFoundException('No hay imagen registrada');
    }

    const ruta = join(this.raiz, clave);

    try {
      await access(ruta);
    } catch {
      throw new NotFoundException('No se encontró el archivo de la imagen');
    }

    const extension = clave.slice(clave.lastIndexOf('.') + 1);

    return {
      stream: createReadStream(ruta),
      tipo: TIPOS_POR_EXTENSION[extension],
    };
  }
}
