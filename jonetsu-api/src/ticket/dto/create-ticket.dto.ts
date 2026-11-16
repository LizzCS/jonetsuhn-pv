import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketItemDto {
  @IsNotEmpty()
  @IsString()
  id_producto!: string;

  @IsNotEmpty()
  cantidad!: number;
}

export class CreateTicketDto {
  @IsNotEmpty()
  @IsString()
  id_persona!: string;

  @IsNotEmpty()
  @IsString()
  id_horario!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketItemDto)
  items!: CreateTicketItemDto[];

  @IsOptional()
  @IsString()
  notas?: string | null;
}
