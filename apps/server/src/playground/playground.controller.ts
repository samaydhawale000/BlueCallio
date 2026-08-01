import { Controller, Post, UseGuards, Req } from '@nestjs/common';

import { JwtGuard } from '../auth/guards/jwt.guard';

import { PlaygroundService } from './playground.service';

@Controller('playground')
@UseGuards(JwtGuard)
export class PlaygroundController {
  constructor(
    private readonly playgroundService: PlaygroundService,
  ) {}

  @Post('video')
  async createVideo(@Req() req: any) {
    return this.playgroundService.createVideoCall(req.user);
  }
}