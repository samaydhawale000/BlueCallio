import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type WebhookEvent =
  | 'call.created'
  | 'call.accepted'
  | 'call.rejected'
  | 'call.ended'
  | 'call.missed';

export interface WebhookPayload {
  event: WebhookEvent;
  callId: string;
  projectId: string;
  callerId: string;
  receiverId: string;
  type: string;
  status: string;
  timestamp: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async fireForCall(callId: string, event: WebhookEvent): Promise<void> {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { project: true },
    });

    if (!call || !call.project.webhookUrl) return;

    const payload: WebhookPayload = {
      event,
      callId: call.id,
      projectId: call.projectId,
      callerId: call.callerId,
      receiverId: call.receiverId,
      type: call.type,
      status: call.status,
      timestamp: new Date().toISOString(),
    };

    await this.deliver(call.project.webhookUrl, call.project.webhookSecret, payload);
  }

  private async deliver(
    url: string,
    secret: string | null,
    payload: WebhookPayload,
  ): Promise<void> {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-BlueCall-Event': payload.event,
    };

    if (secret) {
      const sig = createHmac('sha256', secret).update(body).digest('hex');
      headers['X-BlueCall-Signature'] = `sha256=${sig}`;
    }

    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      if (!res.ok) {
        this.logger.warn(`Webhook delivery failed for ${payload.event}: HTTP ${res.status} → ${url}`);
      }
    } catch (err) {
      this.logger.error(`Webhook delivery error for ${payload.event}: ${err.message} → ${url}`);
    }
  }
}
