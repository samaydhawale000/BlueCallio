import { Module } from '@nestjs/common';
import { TurnController } from './turn.controller';
import { TurnService } from './turn.service';
import { CallSessionModule } from '../call-session/call-session.module';
import { CallSessionGuard } from '../common/guards/call-session.guard';

@Module({
  imports: [CallSessionModule],
  controllers: [TurnController],
  providers: [TurnService, CallSessionGuard],
})
export class TurnModule {}
