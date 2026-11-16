import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

// GET /eventos?incluir_pasados=true  (para el panel del admin)
export class FiltroEventosDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'incluir_pasados debe ser true o false' })
  incluir_pasados?: boolean;
}
