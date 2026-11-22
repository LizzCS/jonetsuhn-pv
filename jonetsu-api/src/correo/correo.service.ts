import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { PrismaService } from '../prisma/prisma.service.js';
import { plantillaTicket } from './plantilla-ticket.js';
import type { MotivoCorreoTicket } from './plantilla-ticket.js';
import { plantillaCodigo } from './plantilla-codigo.js';

// Envía los correos del sistema por SMTP (nodemailer).
// Si faltan las variables SMTP_* en .env, el envío se omite con un aviso
// en consola y la API sigue funcionando igual.
@Injectable()
export class CorreoService implements OnModuleInit {
  private readonly logger = new Logger(CorreoService.name);
  private transporter?: Transporter;
  private remitente = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASS): no se enviarán correos',
      );
      return;
    }

    const port = Number(this.config.get<string>('SMTP_PORT') ?? 465);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      // 465 = SSL directo; 587 = STARTTLS
      secure:
        (this.config.get<string>('SMTP_SECURE') ?? String(port === 465)) ===
        'true',
      auth: { user, pass },
    });

    this.remitente =
      this.config.get<string>('MAIL_FROM') ?? `Jonetsu <${user}>`;

    // Solo avisa si las credenciales fallan; no detiene el arranque
    this.transporter
      .verify()
      .then(() => this.logger.log(`SMTP listo (${host}:${port})`))
      .catch((error: unknown) =>
        this.logger.error('No se pudo conectar al servidor SMTP', error),
      );
  }

  // Código para verificar el correo al registrarse. Devuelve true si se
  // envió. Sin SMTP y fuera de producción, el código se muestra en la
  // consola para poder probar el registro en local.
  async enviarCodigoVerificacion(
    email: string,
    nombre: string,
    codigo: string,
  ): Promise<boolean> {
    if (!this.transporter) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `[solo desarrollo, sin SMTP] Código de verificación para ${email}: ${codigo}`,
        );
        return true;
      }

      return false;
    }

    try {
      const { asunto, html, texto } = plantillaCodigo(nombre, codigo);

      await this.transporter.sendMail({
        from: this.remitente,
        to: email,
        subject: asunto,
        html,
        text: texto,
      });

      return true;
    } catch (error) {
      this.logger.error('No se pudo enviar el código de verificación', error);
      return false;
    }
  }

  // Manda al dueño del ticket el resumen del pedido con su código de acceso.
  // Devuelve true si se envió. Nunca lanza: un correo fallido no debe
  // revertir ni bloquear la operación que lo disparó.
  async enviarTicket(
    id_ticket: string,
    motivo: MotivoCorreoTicket = 'confirmado',
  ): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id_ticket },
        include: {
          user: { select: { nombre: true, apellido: true, email: true } },
          horario: { include: { evento: true } },
          items: { include: { producto: { select: { nombre: true } } } },
        },
      });

      if (!ticket) {
        this.logger.warn(`Correo no enviado: el ticket ${id_ticket} no existe`);
        return false;
      }

      const { asunto, html, texto } = plantillaTicket(ticket, motivo);

      await this.transporter.sendMail({
        from: this.remitente,
        to: ticket.user.email,
        subject: asunto,
        html,
        text: texto,
      });

      this.logger.log(
        `Correo "${motivo}" del ticket ${ticket.codigo_acceso} enviado`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo del ticket ${id_ticket}`,
        error,
      );
      return false;
    }
  }
}
