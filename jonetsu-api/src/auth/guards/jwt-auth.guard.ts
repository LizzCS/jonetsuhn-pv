import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Exige la cookie access_token válida (ver JwtStrategy). Si pasa,
// request.user tiene el payload del token: { sub, email, role }.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
