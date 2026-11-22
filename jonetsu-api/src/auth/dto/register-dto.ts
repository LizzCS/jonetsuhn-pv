import { OmitType } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

import { CreateUserDto } from '../../user/dto/create-user.dto.js';

// Mismos campos que POST /users, pero la contraseña es obligatoria
export class RegisterDto extends OmitType(CreateUserDto, [
  'password',
] as const) {
  @IsString({ message: 'password debe ser texto' })
  @Length(8, 128, {
    message: 'La contraseña debe tener entre 8 y 128 caracteres',
  })
  password!: string;
}
