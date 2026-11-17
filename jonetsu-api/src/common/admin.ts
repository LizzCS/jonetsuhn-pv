import { ForbiddenException } from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

// Comprueba dentro de la transacción que la persona sea un admin activo.
// TODO(auth): cuando exista el login, el id sale del token y esta
// comprobación pasa a un guard de rol; se puede mantener como respaldo.
export async function exigirAdmin(
  tx: Prisma.TransactionClient,
  id_persona: string,
) {
  const admin = await tx.persona.findFirst({
    where: { id_persona, rol: 'admin', activo: true },
    select: { id_persona: true },
  });

  if (!admin) {
    throw new ForbiddenException(
      'Solo un administrador puede realizar esta acción',
    );
  }

  return admin;
}
