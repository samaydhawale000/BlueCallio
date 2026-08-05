import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';

import { CallStatus, CallType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CallSessionService } from '../../call-session/services/call-session.service';
import { CallGateway } from '../../socket/gateways/call.gateway';
import { WebhookService } from '../../webhook/webhook.service';

@Injectable()
export class CallService implements OnModuleInit {
  /**
   * How long an unanswered (RINGING) call stays alive before it is
   * automatically marked as MISSED. Configurable via CALL_RING_TIMEOUT_MS.
   */
  private readonly ringTimeoutMs: number;

  constructor(
    private prisma: PrismaService,
    private callSessionService: CallSessionService,
    private callGateway: CallGateway,
    private webhookService: WebhookService,
  ) {
    const parsed = Number(process.env.CALL_RING_TIMEOUT_MS);
    this.ringTimeoutMs =
      Number.isFinite(parsed) && parsed > 0 ? parsed : 15_000;
  }

  onModuleInit() {
    // Clean up any calls that were already stuck (e.g. server restarted
    // while a call was ringing) on boot.
    this.missExpiredCalls();

    // Periodically expire unanswered calls.
    setInterval(() => {
      this.missExpiredCalls();
    }, 10_000).unref();
  }

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

/**
   * Find all calls that are still RINGING and older than the ring timeout,
   * and transition them to MISSED. This is the "auto-disconnect" for calls
   * that nobody answers.
   */
  async missExpiredCalls() {
    const cutoff = new Date(Date.now() - this.ringTimeoutMs);

    const expired = await this.prisma.call.findMany({
      where: {
        status: CallStatus.RINGING,
        createdAt: { lte: cutoff },
      },
    });

const results: Awaited<ReturnType<CallService['missCall']>>[] = [];
    for (const call of expired) {
      try {
        const updated = await this.missCall(call.id);
        results.push(updated);
      } catch (err) {
        // A call may have progressed (accepted/rejected) between the query
        // and the update — that's fine, skip it.
        console.error('Failed to miss call', call.id, err);
      }
    }
    return results;
  }

  /**
   * Mark a ringing call as MISSED (nobody answered within the timeout).
   */
  async missCall(callId: string) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');

    // Only RINGING (or INITIATED) calls can be missed.
    if (
      call.status !== CallStatus.RINGING &&
      call.status !== CallStatus.INITIATED
    ) {
      throw new BadRequestException(
        `Call is already ${call.status.toLowerCase()}`,
      );
    }

    const updated = await this.prisma.call.update({
      where: { id: callId },
      data: { status: CallStatus.MISSED, endedAt: new Date() },
    });

    await this.prisma.callEvent.create({
      data: { callId, event: 'CALL_MISSED' },
    });

this.callGateway.emitToParticipant(callId, 'CALLER', 'call-missed', { callId });
    this.callGateway.emitToParticipant(callId, 'RECEIVER', 'call-missed', { callId });
    this.webhookService.fireForCall(callId, 'call.missed');

    return updated;
  }

  async acceptCall(callId: string) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException('Call not found');

    // Guard against accepting a call that has already been missed/ended.
    if (
      call.status === CallStatus.MISSED ||
      call.status === CallStatus.ENDED ||
      call.status === CallStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot accept a call that is already ${call.status.toLowerCase()}`,
      );
    }

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
