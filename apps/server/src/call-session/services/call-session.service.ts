import { Injectable } from '@nestjs/common';

import { randomBytes } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CallSessionService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async createSession(
    callId: string,
  ) {
    const callerToken =
      'bj_session_' +
      randomBytes(32).toString('hex');

    const receiverToken =
      'bj_session_' +
      randomBytes(32).toString('hex');

    const expiresAt =
      new Date(
        Date.now() +
          1000 *
            60 *
            60 *
            24,
      );

    return this.prisma.callSession.create({
      data: {
        callId,
        callerToken,
        receiverToken,
        expiresAt,
      },
    });
  }

  async getByCallerToken(
    token: string,
  ) {
    return this.prisma.callSession.findFirst({
      where: {
        callerToken: token,
      },
      include: {
        call: true,
      },
    });
  }

  async getByReceiverToken(
    token: string,
  ) {
    return this.prisma.callSession.findFirst({
      where: {
        receiverToken: token,
      },
      include: {
        call: true,
      },
    });
  }

  /**
   * Resolve a session by either the caller or receiver token.
   * Used by the unified socket `authenticate` flow and by
   * the join/leave endpoints.
   */
  async getByToken(
    token: string,
  ) {
    return this.prisma.callSession.findFirst({
      where: {
        OR: [
          { callerToken: token },
          { receiverToken: token },
        ],
      },
      include: {
        call: {
          include: {
            project: true,
          },
        },
      },
    });
  }

  async resolveRole(
    token: string,
  ): Promise<'CALLER' | 'RECEIVER' | null> {
    const session = await this.prisma.callSession.findFirst({
      where: {
        OR: [
          { callerToken: token },
          { receiverToken: token },
        ],
      },
      select: {
        callerToken: true,
        receiverToken: true,
      },
    });

    if (!session) return null;
    if (session.callerToken === token) return 'CALLER';
    if (session.receiverToken === token) return 'RECEIVER';
    return null;
  }
}
