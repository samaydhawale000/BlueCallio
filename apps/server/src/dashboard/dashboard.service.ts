import { Injectable, NotFoundException } from '@nestjs/common';
import { CallStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private async userProjectIds(userId: string): Promise<string[]> {
    const projects = await this.prisma.project.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    return projects.map((p) => p.id);
  }

  async getCalls(userId: string, projectId?: string) {
    const projectIds = projectId
      ? [projectId]
      : await this.userProjectIds(userId);

    if (projectIds.length === 0) return [];

    return this.prisma.call.findMany({
      where: { projectId: { in: projectIds } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getCallDetails(userId: string, callId: string) {
    const projectIds = await this.userProjectIds(userId);
    if (projectIds.length === 0) {
      throw new NotFoundException('Call not found');
    }

    const call = await this.prisma.call.findFirst({
      where: { id: callId, projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!call) throw new NotFoundException('Call not found');
    return call;
  }

  async getUsage(userId: string) {
    const projectIds = await this.userProjectIds(userId);
    if (projectIds.length === 0) {
      return { totalCalls: 0, activeCalls: 0, minutesUsed: 0, calls: [] };
    }

    const calls = await this.prisma.call.findMany({
      where: { projectId: { in: projectIds } },
      select: { status: true, startedAt: true, endedAt: true },
    });

    const totalCalls = calls.length;
    const activeCalls = calls.filter(
      (c) =>
        c.status === CallStatus.ACCEPTED ||
        c.status === CallStatus.RINGING ||
        c.status === CallStatus.INITIATED,
    ).length;

    let minutesUsed = 0;
    const now = Date.now();

    for (const c of calls) {
      if (!c.startedAt) continue;
      const end = c.endedAt ? c.endedAt.getTime() : now;
      const start = c.startedAt.getTime();
      if (end > start) minutesUsed += Math.floor((end - start) / 60000);
    }

    return { totalCalls, activeCalls, minutesUsed, calls };
  }
}

