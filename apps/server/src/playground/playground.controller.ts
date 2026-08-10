import { Controller, Post, UseGuards, Req, Body } from '@nestjs/common';

import { JwtGuard } from '../auth/guards/jwt.guard';

import { PlaygroundService } from './playground.service';

@Controller('playground')
@UseGuards(JwtGuard)
export class PlaygroundController {
  constructor(
    private readonly playgroundService: PlaygroundService,
  ) {}

@Post('create')
  async createDemo(@Req() req: any, @Body() body: { type?: 'AUDIO' | 'VIDEO' }) {
    return this.playgroundService.createDemoCall(req.user, body?.type ?? 'VIDEO');
  }
}
