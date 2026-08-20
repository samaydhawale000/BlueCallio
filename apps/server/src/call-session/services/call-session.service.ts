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

  /** Fetch the session for a call (used to look up existing tokens/URLs
   * for a call that already exists, e.g. duplicate-call-attempt handling). */
  async getByCallId(callId: string) {
    return this.prisma.callSession.findUnique({ where: { callId } });
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

}
