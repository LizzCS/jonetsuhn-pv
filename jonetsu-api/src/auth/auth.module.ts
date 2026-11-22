import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { AccesoService } from './acceso.service.js';
import { VerificacionService } from './verificacion.service.js';
import { AccesoGuard } from './guards/acceso.guard.js';
import { UserModule } from '../user/user.module.js';

// Global: tickets y pagos usan AccesoGuard (necesita JwtService)
@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    UserModule,

    // Loads the JWT secret from the .env file.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AccesoService,
    AccesoGuard,
    VerificacionService,
  ],
  exports: [JwtModule, AccesoService, AccesoGuard],
})
export class AuthModule {}
