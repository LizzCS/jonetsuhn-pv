import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Obligatoria cuando el propio usuario cambia su password o su email
  @IsOptional()
  @IsString({ message: 'password_actual debe ser texto' })
  password_actual?: string;
}
