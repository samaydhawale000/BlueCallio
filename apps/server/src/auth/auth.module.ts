import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthMeController } from './auth.me.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    JwtModule.register({}),
    BillingModule,
  ],

  controllers: [
    AuthController,
      AuthMeController,
  ],

  providers: [
    AuthService,
    JwtStrategy,
  ],

  exports: [
    AuthService,
  ],
})
export class AuthModule {}