import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service.js';
import { CorreoService } from '../correo/correo.service.js';
import { UserService } from '../user/user.service.js';
import { minutosDesdeAhora } from '../common/fechas.js';
import {
  MAX_INTENTOS_CODIGO,
  MINUTOS_CODIGO_VERIFICACION,
  SEGUNDOS_ENTRE_CODIGOS,
} from '../common/reglas-negocio.js';
import { RegisterDto } from './dto/register-dto.js';

// Registro en dos pasos: primero se manda un código al correo y la
// cuenta solo se crea cuando el dueño del correo lo escribe. Así nadie
// puede registrarse con el correo de otro (ni quedarse con los pedidos
// que esa persona hizo como invitado).
@Injectable()
export class VerificacionService {
  private readonly secreto: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserService,
    private readonly correo: CorreoService,
    config: ConfigService,
  ) {
    this.secreto = config.getOrThrow<string>('JWT_SECRET');
  }

  // PASO 1 - Guarda el registro pendiente y manda el código
  async iniciarRegistro(dto: RegisterDto) {
    await this.users.exigirCorreoSinCuenta(dto.email);
    await this.exigirEspera(dto.email);

    const codigo = this.generarCodigo();
    const datos = {
      nombre: dto.nombre,
      apellido: dto.apellido,
      telefono: dto.telefono,
      password_hash: await this.users.generarHash(dto.password),
      codigo_hash: this.hashCodigo(dto.email, codigo),
      intentos: 0,
      expira_en: minutosDesdeAhora(MINUTOS_CODIGO_VERIFICACION),
      enviado_en: new Date(),
    };

    await this.prisma.verificacion_correo.upsert({
      where: { email: dto.email },
      create: { email: dto.email, ...datos },
      update: datos,
    });

    await this.enviar(dto.email, dto.nombre, codigo);

    return {
      message: `Te enviamos un código a ${dto.email}. Escríbelo para terminar tu registro`,
      email: dto.email,
      minutos: MINUTOS_CODIGO_VERIFICACION,
    };
  }

  // Manda un código nuevo para el registro pendiente (invalida el anterior)
  async reenviar(email: string) {
    const pendiente = await this.buscarPendiente(email);
    await this.exigirEspera(email);

    const codigo = this.generarCodigo();

    await this.prisma.verificacion_correo.update({
      where: { email },
      data: {
        codigo_hash: this.hashCodigo(email, codigo),
        intentos: 0,
        expira_en: minutosDesdeAhora(MINUTOS_CODIGO_VERIFICACION),
        enviado_en: new Date(),
      },
    });

    await this.enviar(email, pendiente.nombre, codigo);

    return {
      message: `Te enviamos un código nuevo a ${email}`,
      email,
      minutos: MINUTOS_CODIGO_VERIFICACION,
    };
  }

  // PASO 2 - Si el código es correcto, crea la cuenta (o convierte al
  // invitado con ese correo, que conserva sus pedidos) y devuelve el user
  async verificar(email: string, codigo: string) {
    const pendiente = await this.buscarPendiente(email);

    if (pendiente.expira_en <= new Date()) {
      throw new BadRequestException('El código venció. Pide uno nuevo');
    }

    // Se gasta el intento antes de comparar: así dos peticiones
    // simultáneas no pueden pasarse del máximo
    const { count } = await this.prisma.verificacion_correo.updateMany({
      where: { email, intentos: { lt: MAX_INTENTOS_CODIGO } },
      data: { intentos: { increment: 1 } },
    });

    if (count === 0) {
      throw new BadRequestException(
        'Demasiados intentos con este código. Pide uno nuevo',
      );
    }

    if (!this.codigoCorrecto(email, codigo, pendiente.codigo_hash)) {
      const restantes = MAX_INTENTOS_CODIGO - (pendiente.intentos + 1);

      throw new BadRequestException(
        restantes > 0
          ? `Código incorrecto. Te quedan ${restantes} intentos`
          : 'Código incorrecto. Pide un código nuevo',
      );
    }

    // Vuelve a revisar el correo (409 si mientras tanto ya se creó la cuenta)
    const user = await this.users.guardar(
      {
        email,
        nombre: pendiente.nombre,
        apellido: pendiente.apellido,
        telefono: pendiente.telefono,
      },
      pendiente.password_hash,
    );

    await this.prisma.verificacion_correo.deleteMany({ where: { email } });

    return user;
  }

  private async buscarPendiente(email: string) {
    const pendiente = await this.prisma.verificacion_correo.findUnique({
      where: { email },
    });

    if (!pendiente) {
      throw new BadRequestException(
        'No hay un registro pendiente para ese correo. Regístrate de nuevo',
      );
    }

    return pendiente;
  }

  // Un código por minuto por correo, para no llenarle la bandeja a nadie
  private async exigirEspera(email: string) {
    const pendiente = await this.prisma.verificacion_correo.findUnique({
      where: { email },
      select: { enviado_en: true },
    });

    if (!pendiente) return;

    const segundos = Math.ceil(
      SEGUNDOS_ENTRE_CODIGOS -
        (Date.now() - pendiente.enviado_en.getTime()) / 1000,
    );

    if (segundos > 0) {
      throw new HttpException(
        `Espera ${segundos} segundos para pedir otro código`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async enviar(email: string, nombre: string, codigo: string) {
    const enviado = await this.correo.enviarCodigoVerificacion(
      email,
      nombre,
      codigo,
    );

    if (!enviado) {
      // Sin correo no hay forma de verificar: se descarta el pendiente
      // para que pueda intentarlo de nuevo sin esperar
      await this.prisma.verificacion_correo.deleteMany({ where: { email } });

      throw new ServiceUnavailableException(
        'No pudimos enviar el código a tu correo. Intenta de nuevo en unos minutos',
      );
    }
  }

  private generarCodigo(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  // HMAC con el secreto del servidor: si alguien lee la tabla, no puede
  // probar los 6 dígitos sin conocer el secreto
  private hashCodigo(email: string, codigo: string): string {
    return createHmac('sha256', this.secreto)
      .update(`${email}:${codigo}`)
      .digest('hex');
  }

  private codigoCorrecto(email: string, codigo: string, hash: string) {
    const esperado = Buffer.from(hash, 'hex');
    const recibido = Buffer.from(this.hashCodigo(email, codigo), 'hex');

    return (
      esperado.length === recibido.length && timingSafeEqual(esperado, recibido)
    );
  }
}
