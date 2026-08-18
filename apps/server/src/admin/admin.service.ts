import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CallGateway } from '../socket/gateways/call.gateway';
import { TurnService } from '../turn/turn.service';
import { UsageBillingService } from '../billing/usage-billing.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private callGateway: CallGateway,
    private turnService: TurnService,
    private usageBilling: UsageBillingService,
  ) {}

  // ── Overview ──────────────────────────────────────────
  async getOverview() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

const [totalUsers, paidUsers, totalProjects, activeCalls] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.subscription.count({
          where: { plan: { slug: { not: 'free' } } },
        }),
        this.prisma.project.count(),
        this.prisma.call.count({ where: { status: { in: ['RINGING', 'ACCEPTED', 'INITIATED'] } } }),
      ]);

    const freeUsers = Math.max(0, totalUsers - paidUsers);

    const [callsEndedToday, callsEndedMonth] = await Promise.all([
      this.prisma.call.findMany({
        where: { startedAt: { not: null }, endedAt: { gte: startOfDay } },
        select: { startedAt: true, endedAt: true },
      }),
      this.prisma.call.findMany({
        where: { startedAt: { not: null }, endedAt: { gte: startOfMonth } },
        select: { startedAt: true, endedAt: true },
      }),
    ]);

    // "Platform minutes": wall-clock call duration (start→end), NOT the same
    // thing as billing. Kept separate from participantMinutesMonth below,
    // which is the actual per-participant-minute billing basis.
    const minutesToday = Math.round(
      callsEndedToday.reduce((sum, c) => sum + this.diffMinutes(c.startedAt!, c.endedAt!), 0),
    );
    const minutesMonth = Math.round(
      callsEndedMonth.reduce((sum, c) => sum + this.diffMinutes(c.startedAt!, c.endedAt!), 0),
    );

    // Real concurrent participant count from the socket gateway, not a
    // guessed "2 per call" — a call can have 1 participant waiting or more
    // than 2 once group calls/screen share are involved.
    const activeParticipants = this.callGateway.getMetrics().inCall;

    // Real billing numbers (participant-minutes + rated revenue), sourced
    // from the same rating engine that actually bills customers — distinct
    // from the platform-minutes figures above.
    const billingSummary = await this.usageBilling.summarizeAdminUsage(startOfMonth);
    const participantMinutesMonth =
      billingSummary.lineItems.audioMinutes +
      billingSummary.lineItems.videoMinutes +
      billingSummary.lineItems.screenShareMinutes;
    const billableRevenuePaise = billingSummary.lineItems.costPaise;

    return {
      stats: {
        totalCompanies: totalUsers,
        freeUsers,
        paidUsers,
        totalProjects,
        activeCalls,
        activeParticipants,
        minutesToday,
        minutesMonth,
        participantMinutesMonth,
        billableRevenuePaise,
      },
      charts: await this.getCharts(),
    };
  }

  private async getCharts() {
    const now = new Date();

    const calls7d = await this.prisma.call.findMany({
      where: { createdAt: { gte: this.daysAgo(7) } },
      select: { createdAt: true },
    });
    const callsByDay = this.groupByDay(calls7d.map((c) => c.createdAt), 7);

    const ended7d = await this.prisma.call.findMany({
      where: { startedAt: { not: null }, endedAt: { gte: this.daysAgo(7) } },
      select: { startedAt: true, endedAt: true },
    });
    const minutesByDay = this.groupByDayMinutes(ended7d, 7);

    const users30d = await this.prisma.user.findMany({
      where: { createdAt: { gte: this.daysAgo(30) } },
      select: { createdAt: true },
    });
    const usersByDay = this.groupByDay(users30d.map((u) => u.createdAt), 30);

    return {
      calls: callsByDay,
      minutes: minutesByDay,
      newUsers: usersByDay,
    };
  }

  // ── Customers ────────────────────────────────────────
  async getCustomers() {
const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        projects: {
          include: { apiKeys: true, calls: true },
        },
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { plan: true },
        },
      },
    });

    return Promise.all(
      users.map(async (u) => {
        const projects = u.projects;
        const totalMinutes = projects.flatMap((p) => p.calls).reduce(
          (sum, c) =>
            sum + (c.startedAt && c.endedAt ? this.diffMinutes(c.startedAt, c.endedAt) : 0),
          0,
        );
        const sub = u.subscriptions?.[0];
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          plan: sub?.plan?.slug || 'free',
          planName: sub?.plan?.name || 'Free',
          status: u.status,
          role: u.role,
          createdAt: u.createdAt,
          lastActiveAt: u.lastActiveAt,
          projects: projects.map((p) => ({
            id: p.id,
            name: p.name,
            apiKeys: p.apiKeys.length,
            calls: p.calls.length,
          })),
          projectCount: projects.length,
          minutesUsed: Math.round(totalMinutes),
        };
      }),
    );
  }

  async updateCustomerStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    await this.logAudit(
      status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_RESUMED',
      userId,
      { userId, status },
    );
    return user;
  }

  async updateCustomerPlan(userId: string, planSlug: string) {
    const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      throw new Error('Plan not found');
    }
    const existing = await this.prisma.subscription.findFirst({
      where: { companyId: userId },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: { planId: plan.id, status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: periodEnd },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          companyId: userId,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }
    await this.logAudit('PLAN_CHANGED', userId, { userId, plan: planSlug });
    return { userId, plan: planSlug };
  }

  // ── Live calls ───────────────────────────────────────
async getLiveCalls() {
    const calls = await this.prisma.call.findMany({
      where: { status: { in: ['RINGING', 'ACCEPTED', 'INITIATED'] } },
      orderBy: { createdAt: 'desc' },
      include: { project: { include: { owner: true } } },
    });

    return calls.map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      startedAt: c.startedAt,
      createdAt: c.createdAt,
      company: c.project?.owner?.name || c.project?.owner?.email || 'Unknown',
      participants: this.callGateway.getRoomParticipantCount(c.id),
      duration: c.startedAt ? this.nowDiffMinutes(c.startedAt) : 0,
    }));
  }

  async endCall(callId: string) {
    return this.prisma.call.update({
      where: { id: callId },
      data: { status: 'ENDED', endedAt: new Date() },
    });
  }

  // ── Usage ────────────────────────────────────────────
  async getUsage() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [callsToday, callsMonth, endedToday, endedMonth] = await Promise.all([
      this.prisma.call.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.call.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.call.findMany({
        where: { startedAt: { not: null }, endedAt: { gte: startOfDay } },
        select: { startedAt: true, endedAt: true },
      }),
      this.prisma.call.findMany({
        where: { startedAt: { not: null }, endedAt: { gte: startOfMonth } },
        select: { startedAt: true, endedAt: true },
      }),
    ]);

    const minutesToday = Math.round(endedToday.reduce((s, c) => s + this.diffMinutes(c.startedAt!, c.endedAt!), 0));
    const minutesMonth = Math.round(endedMonth.reduce((s, c) => s + this.diffMinutes(c.startedAt!, c.endedAt!), 0));

    const totalDuration = endedMonth.reduce((s, c) => s + this.diffMinutes(c.startedAt!, c.endedAt!), 0);
    const avgDuration = callsMonth > 0 ? Math.round(totalDuration / callsMonth) : 0;

    return {
      minutesToday,
      minutesMonth,
      callsToday,
      callsMonth,
      avgDuration,
    };
  }

  // ── Health ───────────────────────────────────────────
  async getHealth() {
    let dbOk = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbOk = false;
    }

    const memory = process.memoryUsage();
    const ws = this.callGateway.getMetrics();
    // Real check: is TURN configured, and does credential generation
    // actually work — not a hardcoded "healthy". This does not verify the
    // TURN server is reachable over the network.
    const turn = this.turnService.getHealthStatus();

    return {
      node: { status: 'healthy', uptime: process.uptime() },
      database: { status: dbOk ? 'healthy' : 'unhealthy' },
      turn: {
        status: !turn.configured
          ? 'not_configured'
          : turn.credentialGeneration === 'ok'
            ? 'healthy'
            : 'unhealthy',
        configured: turn.configured,
        credentialGeneration: turn.credentialGeneration,
      },
      websocket: { clients: ws.clients, inCall: ws.inCall, rooms: ws.rooms },
      // No real CPU/network metrics here — those need to come from the VPS
      // monitoring layer. `process.cpuUsage()` is cumulative CPU-seconds
      // since process start, not a percentage of anything, so it isn't
      // reported here rather than showing a number that looks like one.
      memory: {
        usage: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
      },
    };
  }

  // ── Alerts ───────────────────────────────────────────
  async getAlerts() {
    const memPct = Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100);
    const alerts: { id: string; type: string; severity: string; message: string }[] = [];
    const turn = this.turnService.getHealthStatus();
    if (!turn.configured) {
      alerts.push({
        id: 'turn',
        type: 'TURN not configured',
        severity: 'warning',
        message: 'TURN_SECRET is not set — calls behind restrictive NATs/firewalls may fail to connect.',
      });
    } else if (turn.credentialGeneration !== 'ok') {
      alerts.push({
        id: 'turn',
        type: 'TURN credential generation failing',
        severity: 'critical',
        message: 'TURN is configured but credential generation is failing — check TURN_SECRET/TURN_SERVER.',
      });
    }

    if (memPct > 80) {
      alerts.push({ id: 'memory', type: 'Memory > 80%', severity: 'warning', message: `Memory usage is ${memPct}%` });
    }
    return alerts;
  }

  // ── Audit logs ───────────────────────────────────────
  async getAuditLogs() {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { actor: { select: { name: true, email: true } } },
    });
    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      actor: l.actor?.name || l.actor?.email || 'System',
      metadata: l.metadata,
      createdAt: l.createdAt,
    }));
  }

  // ── Settings ─────────────────────────────────────────
async getSettings() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        monthlyPrice: true,
        includedMinutes: true,
        status: true,
        displayOrder: true,
      },
    });

    const maintenanceMode = await this.getSetting<boolean>('maintenanceMode');
    const announcement = await this.getSetting<string | null>('announcement');

    return {
      plans,
      maintenanceMode: maintenanceMode ?? false,
      announcement: announcement ?? null,
    };
  }

  async updateSettings(body: any) {
    if (typeof body.maintenanceMode === 'boolean') {
      await this.setSetting('maintenanceMode', body.maintenanceMode);
    }
    if (body.announcement !== undefined) {
      await this.setSetting('announcement', body.announcement ?? null);
    }
    return {
      maintenanceMode:
        (await this.getSetting<boolean>('maintenanceMode')) ?? false,
      announcement: await this.getSetting<string | null>('announcement'),
    };
  }

  private async getSetting<T>(key: string): Promise<T | null> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key } });
    return (row?.value as T | null) ?? null;
  }

  private async setSetting(key: string, value: unknown) {
    await this.prisma.platformSetting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
  }

  // ── Helpers ──────────────────────────────────────────
  private async logAudit(action: any, actorId: string, metadata: any) {
    await this.prisma.auditLog.create({ data: { action, actorId, metadata } });
  }

  private diffMinutes(start: Date, end: Date): number {
    return (end.getTime() - start.getTime()) / 60000;
  }

  private nowDiffMinutes(start: Date): number {
    return Math.max(0, (Date.now() - start.getTime()) / 60000);
  }

  private daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  }

  private groupByDay(dates: Date[], days: number) {
    const result: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const count = dates.filter(
        (dt) =>
          dt.getDate() === d.getDate() &&
          dt.getMonth() === d.getMonth() &&
          dt.getFullYear() === d.getFullYear(),
      ).length;
      result.push({ label, value: count });
    }
    return result;
  }

  private groupByDayMinutes(calls: { startedAt: Date | null; endedAt: Date | null }[], days: number) {
    const result: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const minutes = calls
        .filter((c) => c.endedAt && (
          c.endedAt.getDate() === d.getDate() &&
          c.endedAt.getMonth() === d.getMonth() &&
          c.endedAt.getFullYear() === d.getFullYear()
        ))
        .reduce((s, c) => s + (c.startedAt && c.endedAt ? this.diffMinutes(c.startedAt, c.endedAt) : 0), 0);
      result.push({ label, value: Math.round(minutes) });
    }
    return result;
  }
}
