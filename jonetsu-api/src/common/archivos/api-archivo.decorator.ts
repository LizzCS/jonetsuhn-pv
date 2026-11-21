import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

// Campo de texto del formulario (subconjunto del SchemaObject de OpenAPI,
// que @nestjs/swagger no exporta públicamente)
type CampoFormulario = {
  type: 'string' | 'number' | 'integer' | 'boolean';
  format?: string;
  enum?: string[];
  description?: string;
};

// Documenta en Swagger un endpoint multipart/form-data con un archivo.
// `campo` es el nombre del campo del archivo; `extra` son los demás campos
// del formulario (por ejemplo los del DTO en POST /pagos).
export function ApiArchivo(
  campo: string,
  extra: Record<string, CampoFormulario> = {},
  requeridos: string[] = [],
) {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: [...requeridos, campo],
        properties: {
          ...extra,
          [campo]: { type: 'string', format: 'binary' },
        },
      },
    }),
  );
}
