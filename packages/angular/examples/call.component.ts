/**
 * Example: a realistic, standalone Angular component using
 * `@purplecallio/angular` end to end: configure -> join -> connect -> render
 * local + remote video -> toggle camera/mic -> leave -> cleanup.
 *
 * This file assumes nothing about PurpleCallio internals beyond the public
 * `@purplecallio/angular` API. `fetchCallCredentialsFromMyBackend()` stands
 * in for a call to YOUR OWN backend, which is the only place that should
 * ever hold your PurpleCallio API key (via `@purplecallio/sdk`'s
 * `PurpleCallioClient`, used server-side to mint a short-lived participant
 * token). This component never sees an API key, only that token.
 *
 * Not wired into any build — copy it into an Angular app as a starting
 * point.
 */
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PurpleCallioService,
  PurpleCallioVideoDirective,
} from '@purplecallio/angular';

interface CallCredentials {
  token: string;
  callId: string;
  signalUrl: string;
}

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule, PurpleCallioVideoDirective],
  template: `
    <section class="call">
      <p class="status">Status: {{ meeting.connectionState$ | async }}</p>

      <div class="videos">
        <video
          purplecallioVideo
          [stream]="meeting.localStream$ | async"
          [muted]="true"
          class="video video--local"
        ></video>

        <video
          purplecallioVideo
          [stream]="meeting.remoteStream$ | async"
          [muted]="false"
          class="video video--remote"
        ></video>
      </div>

      <div class="controls" *ngIf="mediaState$ | async as media">
        <button type="button" (click)="meeting.camera.toggle()">
          {{ media.camera ? 'Turn camera off' : 'Turn camera on' }}
        </button>
        <button type="button" (click)="meeting.microphone.toggle()">
          {{ media.microphone ? 'Mute mic' : 'Unmute mic' }}
        </button>
        <button type="button" (click)="leave()">Leave call</button>
      </div>

      <p *ngIf="error" class="error">{{ error }}</p>
    </section>
  `,
})
export class CallComponent implements OnInit, OnDestroy {
  readonly meeting = inject(PurpleCallioService);
  readonly mediaState$ = this.meeting.media$;

  error: string | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const { token, callId, signalUrl } =
        await this.fetchCallCredentialsFromMyBackend();

      this.meeting.configure({
        token,
        callId,
        signalUrl,
        video: true,
        audio: true,
      });

      await this.meeting.join();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to join call';
    }
  }

  async leave(): Promise<void> {
    await this.meeting.leave();
  }

  async ngOnDestroy(): Promise<void> {
    // PurpleCallioService is providedIn: 'root', so it outlives this
    // component. Always leave explicitly when navigating away from a call.
    await this.meeting.leave();
  }

  /**
   * Stands in for a call to your own backend, which uses
   * `@purplecallio/sdk`'s `PurpleCallioClient` (server-side, with your API
   * key) to create/join a call and mint a participant token for the
   * current user. Replace with your real endpoint.
   */
  private async fetchCallCredentialsFromMyBackend(): Promise<CallCredentials> {
    const response = await fetch('/api/calls/join', { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Failed to fetch call credentials: ${response.status}`);
    }
    return (await response.json()) as CallCredentials;
  }
}
