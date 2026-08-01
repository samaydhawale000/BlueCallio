import { Module } from '@nestjs/common';

import { PlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';

import { CallModule } from '../call/call.module';

@Module({
  imports: [CallModule],
  controllers: [PlaygroundController],
  providers: [PlaygroundService],
})
export class PlaygroundModule {}