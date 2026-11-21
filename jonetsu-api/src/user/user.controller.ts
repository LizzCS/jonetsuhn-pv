import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { ForbiddenException } from '@nestjs/common';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { idValido } from '../common/id-valido.pipe.js';

import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Usuario } from '../auth/decorators/usuario.decorator.js';
import type { UsuarioToken } from '../auth/decorators/usuario.decorator.js';
import { SoloAdmin } from '../auth/decorators/solo-admin.decorator.js';
import { Role } from '../auth/decorators/role.enums.js';

// La misma persona o un admin
function exigirMismoUsuario(usuario: UsuarioToken, id: string) {
  if (usuario.sub !== id && usuario.role !== Role.admin) {
    throw new ForbiddenException('No puedes acceder a otro usuario');
  }
}

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // POST /users  (registro público, igual que /auth/register)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  // GET /users/profile  → datos del token de la sesión actual
  @Get('profile')
  @ApiCookieAuth()
  @UseGuards(JwtAuthGuard)
  getProfile(@Usuario() usuario: UsuarioToken) {
    return usuario;
  }

  // GET /users  (admin)
  @Get()
  @SoloAdmin()
  findAll() {
    return this.userService.findAll();
  }

  // GET /users/:id  (la misma persona o admin)
  @Get(':id')
  @ApiCookieAuth()
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', idValido) id: string, @Usuario() usuario: UsuarioToken) {
    exigirMismoUsuario(usuario, id);
    return this.userService.findOne(id);
  }

  // PATCH /users/:id  (la misma persona o admin)
  @Patch(':id')
  @ApiCookieAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', idValido) id: string,
    @Body() dto: UpdateUserDto,
    @Usuario() usuario: UsuarioToken,
  ) {
    exigirMismoUsuario(usuario, id);
    return this.userService.update(id, dto);
  }

  // DELETE /users/:id  (desactivar; la misma persona o admin)
  @Delete(':id')
  @ApiCookieAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', idValido) id: string, @Usuario() usuario: UsuarioToken) {
    exigirMismoUsuario(usuario, id);
    return this.userService.remove(id);
  }
}
