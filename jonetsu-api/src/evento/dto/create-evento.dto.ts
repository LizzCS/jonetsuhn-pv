import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateEventoDto {
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @IsNotEmpty()
  @IsString()
  fecha!: string;
}
