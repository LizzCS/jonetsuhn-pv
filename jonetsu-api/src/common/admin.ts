import { ForbiddenException } from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

// Comprueba dentro de la transacción que el user sea un admin activo.
// TODO(auth): cuando exista el login, el id sale del token y esta
// comprobación pasa a un guard de rol; se puede mantener como respaldo.
export async function exigirAdmin(
  tx: Prisma.TransactionClient,
  id_user: string,
) {
  const admin = await tx.user.findFirst({
    where: { id_user, rol: 'admin', activo: true },
    select: { id_user: true },
  });

  if (!admin) {
    throw new ForbiddenException(
      'Solo un administrador puede realizar esta acción',
    );
  }

  return admin;
}
