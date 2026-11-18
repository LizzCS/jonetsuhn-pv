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

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  // POST /users
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  // GET /users
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // GET /users/:id
  @Get(':id')
  findOne(
    @Param('id', idValido) id: string,
  ) {
    return this.userService.findOne(id);
  }

  // PATCH /users/:id
  @Patch(':id')
  update(
    @Param('id', idValido) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, dto);
  }

  // DELETE /users/:id
  @Delete(':id')
  remove(
    @Param('id', idValido) id: string,
  ) {
    return this.userService.remove(id);
  }
}
