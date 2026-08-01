import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { TestController } from './test.controller';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { CallModule } from './call/call.module';
import { SocketModule } from './socket/socket.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { CallSessionModule } from './call-session/call-session.module';
import { TurnModule } from './turn/turn.module';
import { WebhookModule } from './webhook/webhook.module';
import { PlaygroundModule } from './playground/playground.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ProjectModule,
    CallModule,
    SocketModule,
    ApiKeyModule,
    CallSessionModule,
    TurnModule,
    WebhookModule,
    PlaygroundModule
  ],
  controllers: [TestController],
})
export class AppModule {}