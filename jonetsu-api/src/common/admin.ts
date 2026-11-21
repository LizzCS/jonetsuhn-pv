import { ForbiddenException } from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

// Comprueba dentro de la transacción que el user sea un admin activo.
// El id sale del token (@Usuario('sub')) y @SoloAdmin() ya revisa el rol;
// esto es el respaldo: confirma en la BD que siga siendo admin y activo.
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
