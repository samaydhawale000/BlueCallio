import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { UsageBillingService } from '../../billing/usage-billing.service';

/**
 * Billing middleware guard (BlueCallio v2 — usage-based).
 *
 * Runs after the ApiKeyGuard (which sets `request.project`). Verifies the
 * project owner's account is not suspended, and — for call-creation requests
 * carrying a media `type` — that the free allowance/payment-method rule
 * (UsageBillingService.canStartCall) is satisfied for that specific media
 * type. Active calls are never interrupted, only new ones.
 *
 * The eligibility check itself lives in UsageBillingService.canStartCall so
 * this guard and CallService (which also creates calls outside the guarded
 * HTTP path, e.g. the playground) can never disagree on the rule.
 */
@Injectable()
export class BillingGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private usageBilling: UsageBillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const project = request.project;
    if (!project?.ownerId) {
      throw new ForbiddenException('No project context for billing check');
    }

    const ownerId = project.ownerId;

    // 1. Account suspended?
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { status: true },
    });
    if (!owner) {
      throw new ForbiddenException('Account not found');
    }
    if (owner.status === 'SUSPENDED') {
      throw new ForbiddenException(
        'Account is suspended. Please contact support to resume service.',
      );
    }

    // 2. Free allowance / payment-method eligibility, per media type.
    const type = request.body?.type;
    if (type === 'AUDIO' || type === 'VIDEO') {
      const eligibility = await this.usageBilling.canStartCall(ownerId, type);
      if (!eligibility.allowed) {
        throw new ForbiddenException(eligibility.reason);
      }
    }

    const status = await this.usageBilling.getFreeAllowanceStatus(ownerId);
    request.billing = {
      ownerId,
      freeAudioRemaining: status.audioRemaining,
      freeVideoRemaining: status.videoRemaining,
    };
    return true;
  }
}
