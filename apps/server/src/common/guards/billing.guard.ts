import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { UsageBillingService } from '../../billing/usage-billing.service';

/**
 * Billing middleware guard (BlueJoinet v2 — usage-based).
 *
 * Runs after the ApiKeyGuard (which sets `request.project`). Verifies the
 * project owner's account is not suspended and that they have free allowance
 * remaining for AUDIO/VIDEO calls. Screen-share is always billable (no
 * free allowance), so it is never blocked here.
 *
 * When the free audio/video allowance is exhausted, the user must add a
 * payment method to continue. That policy is enforced here by requiring an
 * active, non-dunning billing state (or a saved payment method) before new
 * calls are allowed. Active calls are never interrupted.
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

    // 2. Check free allowance for audio/video. Screen share is always billable.
    const status = await this.usageBilling.getFreeAllowanceStatus(ownerId);
    const needsPayment =
      status.audioExhausted && status.videoExhausted;

    // If free allowance is exhausted for both audio and video, require a
    // saved payment method OR an active subscription (legacy) before allowing
    // new calls. This never interrupts active calls — only new ones.
    if (needsPayment) {
      const hasPaymentMethod = await this.hasPaymentMethod(ownerId);
      if (!hasPaymentMethod) {
        throw new ForbiddenException(
          'Your free audio and video allowance is used up. Add a payment method to continue making calls.',
        );
      }
    }

    request.billing = {
      ownerId,
      freeAudioRemaining: status.audioRemaining,
      freeVideoRemaining: status.videoRemaining,
      needsPayment,
    };
    return true;
  }

private async hasPaymentMethod(ownerId: string): Promise<boolean> {
    // Legacy subscription (still ACTIVE) counts as a billing relationship.
    const sub = await this.prisma.subscription.findFirst({
      where: { companyId: ownerId },
      orderBy: { createdAt: 'desc' },
    });
    if (sub && sub.status === 'ACTIVE') {
      return true;
    }
    // A saved Razorpay customer id + saved-card token counts as a billing
    // relationship.
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { razorpayCustomerId: true, razorpayTokenId: true },
    });
    return !!user?.razorpayCustomerId && !!user?.razorpayTokenId;
  }
}
