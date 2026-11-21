import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
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

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // POST /users
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

  // GET /users
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // GET /users/:id
  @Get(':id')
  findOne(@Param('id', idValido) id: string) {
    return this.userService.findOne(id);
  }

  // PATCH /users/:id
  @Patch(':id')
  update(@Param('id', idValido) id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  // DELETE /users/:id
  @Delete(':id')
  remove(@Param('id', idValido) id: string) {
    return this.userService.remove(id);
  }
}
