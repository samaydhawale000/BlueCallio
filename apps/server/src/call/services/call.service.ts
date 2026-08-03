import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CallStatus, CallType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CallSessionService } from '../../call-session/services/call-session.service';
import { CallGateway } from '../../socket/gateways/call.gateway';
import { WebhookService } from '../../webhook/webhook.service';

@Injectable()
export class CallService {
  constructor(
    private prisma: PrismaService,
    private callSessionService: CallSessionService,
    private callGateway: CallGateway,
    private webhookService: WebhookService,
  ) {}

async createCall(
  data: {
    projectId: string;
    callerId: string;
    receiverId: string;
    type: CallType;
  },
  options?: {
    skipWebhook?: boolean;
  },
) {
    const call = await this.prisma.call.create({
      data: {
        projectId: data.projectId,
        callerId: data.callerId,
        receiverId: data.receiverId,
        type: data.type,
        status: CallStatus.RINGING,
      },
    });

    await this.prisma.callEvent.create({
      data: { callId: call.id, event: 'CALL_CREATED' },
    });

    const session = await this.callSessionService.createSession(call.id);

    if (!options?.skipWebhook) {
  this.webhookService.fireForCall(call.id, 'call.created');
}

const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';

    const callerToken = session.callerToken;
    const receiverToken = session.receiverToken;

    const hostedUrl = `${frontend}/call?token=${callerToken}&callId=${call.id}`;

    return {
      callId: call.id,
      call,
      hostedUrl,
      participants: [
        {
          participantId: data.callerId,
          token: callerToken,
          hostedUrl,
          expiresAt: session.expiresAt,
        },
        {
          participantId: data.receiverId,
          token: receiverToken,
          hostedUrl: `${frontend}/call?token=${receiverToken}&callId=${call.id}`,
          expiresAt: session.expiresAt,
        },
      ],
      // Backwards-compatible fields (still used by the playground)
      callerToken,
      receiverToken,
      callerUrl: hostedUrl,
      receiverUrl: `${frontend}/call?token=${receiverToken}&callId=${call.id}`,
    };
  }

  async acceptCall(callId: string) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: { status: CallStatus.ACCEPTED, startedAt: new Date() },
    });

    await this.prisma.callEvent.create({
      data: { callId, event: 'CALL_ACCEPTED' },
    });

    this.callGateway.emitToParticipant(callId, 'CALLER', 'call-accepted', { callId });
    this.webhookService.fireForCall(callId, 'call.accepted');

    return updated;
  }

  async rejectCall(callId: string) {
    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: { status: CallStatus.REJECTED },
    });

    await this.prisma.callEvent.create({
      data: { callId, event: 'CALL_REJECTED' },
    });

    this.callGateway.emitToParticipant(callId, 'CALLER', 'call-rejected', { callId });
    this.webhookService.fireForCall(callId, 'call.rejected');

    return updated;
  }

  async endCall(callId: string) {
    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: { status: CallStatus.ENDED, endedAt: new Date() },
    });

    await this.prisma.callEvent.create({
      data: { callId, event: 'CALL_ENDED' },
    });

    this.webhookService.fireForCall(callId, 'call.ended');

    return updated;
  }

  async getCall(callId: string) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');
    return call;
  }

  /**
   * Full call details including project branding and the
   * participant token (resolved from the caller's session token).
   * Used by the hosted UI to theme the room.
   */
  async getCallDetails(callId: string, session: any) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { project: true },
    });
    if (!call) throw new NotFoundException('Call not found');

const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const isCaller = session?.callerToken;
    const token = isCaller ? session.callerToken : session.receiverToken;

    return {
      callId: call.id,
      type: call.type,
      status: call.status,
      callerId: call.callerId,
      receiverId: call.receiverId,
      participantId: isCaller ? call.callerId : call.receiverId,
      token,
      hostedUrl: `${frontend}/call?token=${token}&callId=${call.id}`,
      expiresAt: session?.expiresAt ?? null,
      branding: {
        companyName: call.project.companyName ?? call.project.name,
        logoUrl: call.project.logoUrl,
        primaryColor: call.project.primaryColor,
        theme: call.project.theme,
        waitingRoom: call.project.waitingRoom,
      },
    };
  }

  /**
   * Record a participant joining an active call.
   */
  async joinCall(callId: string, session: any) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');

    await this.prisma.callEvent.create({
      data: { callId, event: 'PARTICIPANT_JOINED' },
    });

    return {
      callId,
      status: call.status,
      joined: true,
      participantId: session?.callerToken ? call.callerId : call.receiverId,
    };
  }

  /**
   * Record a participant leaving an active call.
   */
  async leaveCall(callId: string, session: any) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');

    await this.prisma.callEvent.create({
      data: { callId, event: 'PARTICIPANT_LEFT' },
    });

    return {
      callId,
      left: true,
      participantId: session?.callerToken ? call.callerId : call.receiverId,
    };
  }

  async getCalls(projectId: string) {
    return this.prisma.call.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
