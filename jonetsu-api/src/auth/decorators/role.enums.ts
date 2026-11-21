import { rol_user } from '../../generated/prisma/enums.js';

// Mismos valores que el enum rol_user de Prisma ('admin' | 'cliente'),
// que es lo que viaja en el token (payload.role).
export const Role = rol_user;
export type Role = rol_user;
