import { Module } from '@nestjs/common';

import { CallController } from './controllers/call.controller';
import { CallService } from './services/call.service';

import { CallSessionModule } from '../call-session/call-session.module';
import { SocketModule } from '../socket/socket.module';
import { WebhookModule } from '../webhook/webhook.module';
import { BillingModule } from '../billing/billing.module';

import { CallSessionGuard } from '../common/guards/call-session.guard';

@Module({
  imports: [
    CallSessionModule,
    SocketModule,
    WebhookModule,
    BillingModule,
  ],
  controllers: [CallController],
  providers: [
    CallService,
    CallSessionGuard,
  ],
  exports: [
    CallService,
  ],
})
export class CallModule {}