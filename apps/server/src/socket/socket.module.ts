import { Module } from '@nestjs/common';

import { CallGateway } from './gateways/call.gateway';
import { CallRoomService } from './services/call-room.service';

import { CallSessionModule } from '../call-session/call-session.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    CallSessionModule,
    BillingModule,
  ],

  providers: [
    CallGateway,
    CallRoomService,
  ],

  exports: [
    CallGateway,
    CallRoomService,
  ],
})
export class SocketModule {}
