import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageSegmentService, Segment } from './usage-segment.service';
import { UsageBillingService } from './usage-billing.service';

export interface RatedSegment extends Segment {
  seconds: number;
  minutes: number; // fractional participant-minutes
  audioMins: number;
  videoMins: number;
  screenShareMins: number;
  costPaise: number;
}

export interface RatedCall {
  callId: string;
  segments: RatedSegment[];
  totals: {
    audioMins: number;
    videoMins: number;
    screenShareMins: number;
    costPaise: number;
  };
}

/**
 * Usage Rating Engine.
 *
 * This is the ONLY place money is calculated. It takes segments (built by the
 * segment builder) and converts them into paise using the current rates:
 *   - Audio:       ₹0.20 / participant-minute
 *   - Video:       ₹0.80 / participant-minute
 *   - Screen share:+₹0.10 / participant-minute (add-on to video)
 *
 * A segment is rated by: duration(seconds / 60) × participantCount × rate.
 * Video segments also include screen-share add-on when screenShare is true.
 */
@Injectable()
export class RatingEngineService {
  private readonly logger = new Logger(RatingEngineService.name);

  constructor(
    private prisma: PrismaService,
    private segments: UsageSegmentService,
    private usageBilling: UsageBillingService,
  ) {}

  /**
   * Rate a single segment into participant-minutes + cost (paise).
   */
  private async rateSegment(seg: Segment): Promise<RatedSegment> {
    const rates = await this.usageBilling.getRates();
    const seconds = Math.max(
      0,
      (seg.endedAt.getTime() - seg.startedAt.getTime()) / 1000,
    );
    const minutes = (seconds / 60) * seg.participantCount;

    let audioMins = 0;
    let videoMins = 0;
    let screenShareMins = 0;

    if (seg.audio) audioMins = minutes;
    if (seg.video) videoMins = minutes;
    // Screen-share is an add-on to video (never charged alone).
    if (seg.video && seg.screenShare) screenShareMins = minutes;

    const costPaise = Math.round(
      audioMins * rates.audioPaise +
        videoMins * rates.videoPaise +
        screenShareMins * rates.screenSharePaise,
    );

    return {
      ...seg,
      seconds,
      minutes,
      audioMins,
      videoMins,
      screenShareMins,
      costPaise,
    };
  }

  /**
   * Rate all segments for a call. Returns the rated timeline + totals.
   */
  async rateCall(callId: string): Promise<RatedCall> {
    const segs = await this.segments.getSegmentsForCall(callId);
    const rated: RatedSegment[] = [];
    let audioMins = 0;
    let videoMins = 0;
    let screenShareMins = 0;
    let costPaise = 0;

    for (const seg of segs) {
      const r = await this.rateSegment({
        startedAt: seg.startedAt,
        endedAt: seg.endedAt,
        participantCount: seg.participantCount,
        audio: seg.audio,
        video: seg.video,
        screenShare: seg.screenShare,
      });
      rated.push(r);
      audioMins += r.audioMins;
      videoMins += r.videoMins;
      screenShareMins += r.screenShareMins;
      costPaise += r.costPaise;
    }

    return {
      callId,
      segments: rated,
      totals: {
        audioMins: Math.round(audioMins),
        videoMins: Math.round(videoMins),
        screenShareMins: Math.round(screenShareMins),
        costPaise,
      },
    };
  }

  /**
   * Rate a list of persisted/aggregated usage segments (admin analytics).
   * Returns totals only.
   */
  async rateSegments(
    segs: { startedAt: Date; endedAt: Date; participantCount: number; audio: boolean; video: boolean; screenShare: boolean; callId?: string }[],
  ): Promise<{ audioMins: number; videoMins: number; screenShareMins: number; costPaise: number; calls: number }> {
    const rates = await this.usageBilling.getRates();
    let audioMins = 0;
    let videoMins = 0;
    let screenShareMins = 0;
    let costPaise = 0;
    const calls = new Set<string>();

    for (const seg of segs) {
      const seconds = Math.max(
        0,
        (seg.endedAt.getTime() - seg.startedAt.getTime()) / 1000,
      );
      const minutes = (seconds / 60) * (seg.participantCount || 1);
      if (seg.audio) audioMins += minutes;
      if (seg.video) videoMins += minutes;
      if (seg.video && seg.screenShare) screenShareMins += minutes;
      costPaise += Math.round(
        (seg.audio ? minutes * rates.audioPaise : 0) +
          (seg.video ? minutes * rates.videoPaise : 0) +
          (seg.video && seg.screenShare ? minutes * rates.screenSharePaise : 0),
      );
      if (seg.callId) calls.add(seg.callId);
    }

    return {
      audioMins: Math.round(audioMins),
      videoMins: Math.round(videoMins),
      screenShareMins: Math.round(screenShareMins),
      costPaise,
      calls: calls.size,
    };
  }

  /**
   * Persist rated cost back onto segments (so invoicing can read it directly).
   */
  async persistRatedCosts(callId: string): Promise<RatedCall> {
    const rated = await this.rateCall(callId);
    for (const seg of rated.segments) {
      await this.prisma.usageSegment.updateMany({
        where: {
          callId,
          startedAt: seg.startedAt,
          endedAt: seg.endedAt,
        },
        data: { costPaise: seg.costPaise },
      });
    }
    return rated;
  }
}
