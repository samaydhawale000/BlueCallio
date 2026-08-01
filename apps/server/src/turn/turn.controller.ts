import { Controller, Get, UseGuards } from '@nestjs/common';
import { CallSessionGuard } from '../common/guards/call-session.guard';
import { TurnService } from './turn.service';

@Controller('turn')
export class TurnController {
  constructor(private turnService: TurnService) {}

  @Get('credentials')
  @UseGuards(CallSessionGuard)
  getCredentials() {
    return this.turnService.getCredentials();
  }
}
