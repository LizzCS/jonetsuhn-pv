import { Injectable, NotFoundException } from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

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

const CARPETA = 'comprobantes';

// Solo se aceptan claves generadas por este servicio (evita leer otras rutas)
const FORMATO_CLAVE =
  /^comprobantes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

// Guarda los comprobantes en disco, fuera de cualquier carpeta pública.
// En pago.comprobante_url se guarda la clave relativa ("comprobantes/<uuid>.jpg");
// el archivo se sirve por GET /pagos/:id/comprobante.
@Injectable()
export class ComprobanteStorageService {
  private readonly raiz = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');

  async guardar(buffer: Buffer, mimetype: string): Promise<string> {
    const extension = EXTENSIONES[mimetype];

    if (!extension) {
      throw new Error(`Tipo de comprobante no soportado: ${mimetype}`);
    }

    const clave = `${CARPETA}/${randomUUID()}.${extension}`;

    await mkdir(join(this.raiz, CARPETA), { recursive: true });
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
      throw new NotFoundException('El pago no tiene comprobante');
    }

    const ruta = join(this.raiz, clave);

    try {
      await access(ruta);
    } catch {
      throw new NotFoundException('No se encontró el archivo del comprobante');
    }

    const extension = clave.slice(clave.lastIndexOf('.') + 1);

    return {
      stream: createReadStream(ruta),
      tipo: TIPOS_POR_EXTENSION[extension],
    };
  }
}
