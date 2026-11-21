import { PartialType } from '@nestjs/swagger';

import { CreateHorarioDto } from './create-horario.dto.js';

export class UpdateHorarioDto extends PartialType(CreateHorarioDto) {}
