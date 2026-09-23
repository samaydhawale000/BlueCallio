import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import {
  PurpleCallioMeeting,
  ConnectionState,
  Participant,
  ParticipantMedia,
} from '@purplecallio/sdk';

/**
 * Configuration accepted by {@link PurpleCallioService.configure}.
 *
 * `token` MUST be a short-lived **participant token** minted by your own
 * backend (which itself calls `@purplecallio/sdk`'s `PurpleCallioClient`
 * server-side). Never obtain or embed a PurpleCallio API key in an Angular
 * app — API keys are server-only secrets.
 */
export interface PurpleCallioServiceConfig {
  /** Participant token issued by your backend. Never an API key. */
  token: string;
  callId: string;
  signalUrl: string;
  /** Default: video on. */
  video?: boolean;
  /** Default: audio on. */
  audio?: boolean;
  /** Custom ICE servers passed through to the engine. */
  iceServers?: RTCIceServer[];
}

const IDLE_MEDIA: ParticipantMedia = {
  camera: false,
  microphone: false,
  screenShare: false,
};

/**
 * Angular-idiomatic wrapper around `@purplecallio/sdk`'s `PurpleCallioMeeting`
 * engine.
 *
 * Unlike `@purplecallio/react`'s `MeetingContextValue`, this service does not
 * leak the raw engine instance to consumers. State is exposed exclusively as
 * RxJS observables and the media controls below, which keeps the public
 * surface small and prevents callers from reaching around the service to
 * call engine methods directly (and, since the service is the only thing
 * that touches the engine, from ending up with the react adapter's
 * enable()-instead-of-toggle() bug — see `camera`/`microphone` below).
 *
 * Registered `providedIn: 'root'`, so a single instance is shared app-wide.
 * Because of that, `ngOnDestroy` only fires when the whole injector (i.e.
 * the app) is torn down — it is a safety net, not a substitute for calling
 * `leave()` yourself when navigating away from a call.
 */
@Injectable({ providedIn: 'root' })
export class PurpleCallioService implements OnDestroy {
  private engine: PurpleCallioMeeting | null = null;
  private engineUnsubscribers: Array<() => void> = [];
  private initialMedia: ParticipantMedia = IDLE_MEDIA;

  private readonly connectionStateSubject =
    new BehaviorSubject<ConnectionState>('idle');
  private readonly participantsSubject = new BehaviorSubject<Participant[]>(
    [],
  );
  private readonly mediaSubject = new BehaviorSubject<ParticipantMedia>(
    IDLE_MEDIA,
  );
  private readonly remoteStreamSubject =
    new BehaviorSubject<MediaStream | null>(null);
  private readonly localStreamSubject =
    new BehaviorSubject<MediaStream | null>(null);
  private readonly participantIdSubject = new BehaviorSubject<string | null>(
    null,
  );

  /** Current connection state (`'idle' | 'connecting' | ... | 'error'`). */
  readonly connectionState$: Observable<ConnectionState> =
    this.connectionStateSubject.asObservable();
  /** Live participant roster, including yourself once joined. */
  readonly participants$: Observable<Participant[]> =
    this.participantsSubject.asObservable();
  /** Local media state: camera / microphone / screen-share on/off. */
  readonly media$: Observable<ParticipantMedia> =
    this.mediaSubject.asObservable();
  /** The remote participant's media stream, or `null` before it arrives. */
  readonly remoteStream$: Observable<MediaStream | null> =
    this.remoteStreamSubject.asObservable();
  /** Your own local media stream, or `null` before `join()` resolves. */
  readonly localStream$: Observable<MediaStream | null> =
    this.localStreamSubject.asObservable();
  /** Your own participant id, or `null` before the call connects. */
  readonly participantId$: Observable<string | null> =
    this.participantIdSubject.asObservable();

  /** Local camera controls. Delegates straight to the underlying engine. */
  readonly camera = {
    enable: (): void => this.requireEngine().camera.enable(),
    disable: (): void => this.requireEngine().camera.disable(),
    toggle: (): void => this.requireEngine().camera.toggle(),
    isEnabled: (): boolean => this.requireEngine().camera.isEnabled(),
  };

  /** Local microphone controls. Delegates straight to the underlying engine. */
  readonly microphone = {
    enable: (): void => this.requireEngine().microphone.enable(),
    disable: (): void => this.requireEngine().microphone.disable(),
    toggle: (): void => this.requireEngine().microphone.toggle(),
    isEnabled: (): boolean => this.requireEngine().microphone.isEnabled(),
  };

  /** Screen-share controls. Delegates straight to the underlying engine. */
  readonly screenShare = {
    start: (): Promise<void> => this.requireEngine().screenShare.start(),
    stop: (): Promise<void> => this.requireEngine().screenShare.stop(),
    isActive: (): boolean => this.requireEngine().screenShare.isActive(),
  };

  /**
   * Create (or, if called again, replace) the underlying meeting engine.
   * Cheap and synchronous — no network activity happens until `join()` is
   * called. Safe to call from a component's `ngOnInit`.
   *
   * Throws if called while a previous configuration is still connected;
   * call `leave()` first if you need to switch rooms.
   */
  configure(config: PurpleCallioServiceConfig): void {
    if (this.engine) {
      const state = this.engine.connectionState();
      const stillActive = !['idle', 'disconnected', 'closed', 'error'].includes(
        state,
      );
      if (stillActive) {
        throw new Error(
          'PurpleCallioService: configure() was called while a previous ' +
            'call was still active. Call leave() before reconfiguring.',
        );
      }
      this.teardownEngine();
    }

    this.initialMedia = {
      camera: config.video ?? true,
      microphone: config.audio ?? true,
      screenShare: false,
    };
    this.mediaSubject.next(this.initialMedia);

    this.engine = new PurpleCallioMeeting({
      token: config.token,
      callId: config.callId,
      signalUrl: config.signalUrl,
      video: config.video,
      audio: config.audio,
      iceServers: config.iceServers,
    });

    this.subscribeToEngine(this.engine);
  }

  /**
   * Connect signaling + WebRTC and join the call. Requires `configure()` to
   * have been called first. Idempotent, mirroring the underlying engine.
   */
  async join(): Promise<void> {
    const engine = this.requireEngine();
    await engine.join();
    this.localStreamSubject.next(engine.localStreamRef);
  }

  /**
   * Leave the call and tear down signaling/WebRTC. Safe to call even if
   * never joined, or after an earlier `leave()`.
   */
  async leave(): Promise<void> {
    if (!this.engine) return;
    await this.engine.leave();
    this.localStreamSubject.next(null);
    this.remoteStreamSubject.next(null);
    this.participantIdSubject.next(null);
  }

  /**
   * `providedIn: 'root'` means this only runs when the app's root injector
   * is destroyed (e.g. the app itself shuts down) — it is a last-resort
   * safety net, not something to rely on between calls or route changes.
   * Always call `leave()` explicitly when a user navigates away from a call.
   */
  ngOnDestroy(): void {
    this.teardownEngine();
  }

  private requireEngine(): PurpleCallioMeeting {
    if (!this.engine) {
      throw new Error(
        'PurpleCallioService: configure() must be called before this ' +
          'method can be used.',
      );
    }
    return this.engine;
  }

  private subscribeToEngine(engine: PurpleCallioMeeting): void {
    const offs: Array<() => void> = [];

    offs.push(
      engine.onConnectionStateChanged((state) =>
        this.connectionStateSubject.next(state as ConnectionState),
      ),
    );
    offs.push(
      engine.onParticipantsChanged((participants) =>
        this.participantsSubject.next(participants),
      ),
    );

    offs.push(
      engine.on('connected', (p) =>
        this.participantIdSubject.next(p.participantId),
      ),
    );
    offs.push(
      engine.on('disconnected', () => this.participantIdSubject.next(null)),
    );

    offs.push(
      engine.on('remote.stream', (stream) =>
        this.remoteStreamSubject.next(stream),
      ),
    );
    offs.push(
      engine.on('remote.stream.ended', () =>
        this.remoteStreamSubject.next(null),
      ),
    );

    offs.push(
      engine.on('camera.enabled', () =>
        this.mediaSubject.next({ ...this.mediaSubject.value, camera: true }),
      ),
    );
    offs.push(
      engine.on('camera.disabled', () =>
        this.mediaSubject.next({ ...this.mediaSubject.value, camera: false }),
      ),
    );
    offs.push(
      engine.on('microphone.enabled', () =>
        this.mediaSubject.next({
          ...this.mediaSubject.value,
          microphone: true,
        }),
      ),
    );
    offs.push(
      engine.on('microphone.disabled', () =>
        this.mediaSubject.next({
          ...this.mediaSubject.value,
          microphone: false,
        }),
      ),
    );
    offs.push(
      engine.on('screenShare.started', () =>
        this.mediaSubject.next({
          ...this.mediaSubject.value,
          screenShare: true,
        }),
      ),
    );
    offs.push(
      engine.on('screenShare.stopped', () =>
        this.mediaSubject.next({
          ...this.mediaSubject.value,
          screenShare: false,
        }),
      ),
    );

    this.engineUnsubscribers = offs;
  }

  private teardownEngine(): void {
    this.engineUnsubscribers.forEach((off) => off());
    this.engineUnsubscribers = [];
    if (this.engine && this.engine.connectionState() !== 'disconnected') {
      // Best-effort cleanup; ignore rejections (e.g. already torn down).
      void this.engine.leave().catch(() => undefined);
    }
    this.engine = null;
    this.connectionStateSubject.next('idle');
    this.participantsSubject.next([]);
    this.mediaSubject.next(IDLE_MEDIA);
    this.remoteStreamSubject.next(null);
    this.localStreamSubject.next(null);
    this.participantIdSubject.next(null);
  }
}
