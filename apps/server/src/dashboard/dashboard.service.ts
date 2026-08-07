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

  /**
   * Aggregate stats for the dashboard hero / stat cards.
   */
  async getOverview(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return {
        projects: 0,
        activeCalls: 0,
        calls: 0,
        minutesUsed: 0,
        apiKeys: 0,
      };
    }

    const [apiKeys, calls] = await Promise.all([
      this.prisma.apiKey.count({
        where: { project: { ownerId: userId } },
      }),
      this.prisma.call.findMany({
        where: { projectId: { in: projectIds } },
        select: { status: true, startedAt: true, endedAt: true },
      }),
    ]);

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

    return {
      projects: projects.length,
      activeCalls,
      calls: calls.length,
      minutesUsed,
      apiKeys,
    };
  }

  /**
   * Daily usage chart data for the last N days (default 7).
   * Returns [{ date, label, minutes, calls }] ordered ascending.
   */
  async getUsageChart(userId: string, days = 7) {
    const projectIds = await this.userProjectIds(userId);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const calls = projectIds.length
      ? await this.prisma.call.findMany({
          where: {
            projectId: { in: projectIds },
            startedAt: { gte: start },
          },
          select: { startedAt: true, endedAt: true },
        })
      : [];

    const buckets: Record<string, { minutes: number; calls: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { minutes: 0, calls: 0 };
    }

    const now = Date.now();
    for (const c of calls) {
      if (!c.startedAt) continue;
      const key = new Date(c.startedAt).toISOString().slice(0, 10);
      if (!buckets[key]) continue;
      buckets[key].calls += 1;
      const end = c.endedAt ? c.endedAt.getTime() : now;
      const startMs = c.startedAt.getTime();
      if (end > startMs) {
        buckets[key].minutes += Math.floor((end - startMs) / 60000);
      }
    }

    return Object.entries(buckets).map(([date, v]) => ({
      date,
      label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
      }),
      minutes: v.minutes,
      calls: v.calls,
    }));
  }
}

