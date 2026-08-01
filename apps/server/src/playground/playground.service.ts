import { Injectable } from '@nestjs/common';
import { CallType } from '@prisma/client';

import { CallService } from '../call/services/call.service';
import { PrismaService } from '../prisma/prisma.service';

const PLAYGROUND_PROJECT_NAME = 'BlueJoinet Playground';

@Injectable()
export class PlaygroundService {
  constructor(
    private readonly callService: CallService,
    private readonly prisma: PrismaService,
  ) {}

  async createVideoCall(user: any) {
    let project = await this.prisma.project.findFirst({
      where: { name: PLAYGROUND_PROJECT_NAME, ownerId: user.userId },
    });

    if (!project) {
      project = await this.prisma.project.create({
        data: { name: PLAYGROUND_PROJECT_NAME, ownerId: user.userId },
      });
    }

    const callerId = `playground_${Date.now()}`;

    const receiverId = `playground_${Date.now()}_receiver`;

    const result = await this.callService.createCall(
      {
        projectId: project.id,
        callerId,
        receiverId,
        type: CallType.VIDEO,
      },
      {
        skipWebhook: true,
      },
    );

    const frontend =
      process.env.FRONTEND_URL ||
      'http://localhost:3000';

    return {
      success: true,

      callId: result.call.id,

      callerToken: result.callerToken,

      receiverToken: result.receiverToken,

      callerUrl:
        `${frontend}/call?token=${result.callerToken}&callId=${result.call.id}`,

      receiverUrl:
        `${frontend}/call?token=${result.receiverToken}&callId=${result.call.id}`,
    };
  }
}