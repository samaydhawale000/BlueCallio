import { writable, type Readable } from 'svelte/store';

import {
  PurpleCallioMeeting,
  type ConnectionState,
  type EngineConfig,
  type Participant,
  type ParticipantMedia,
} from '@purplecallio/sdk';

/**
 * Local camera/microphone controls. Delegates straight to the underlying
 * engine — `toggle()` calls the engine's own `.toggle()`, it does NOT
 * reimplement toggling via `.enable()`/`.disable()` (see
 * `@purplecallio/react`'s `context.tsx`, which has exactly that bug in its
 * `toggleCamera`/`toggleMicrophone` helpers).
 */
export interface PurpleCallioMediaControls {
  enable(): void;
  disable(): void;
  toggle(): void;
  isEnabled(): boolean;
}

/** Screen-share controls. Delegates straight to the underlying engine. */
export interface PurpleCallioScreenShareControls {
  start(): Promise<void>;
  stop(): Promise<void>;
  isActive(): boolean;
}

/**
 * The object returned by {@link createPurpleCallio}.
 *
 * Each piece of state is its own `Readable` store (rather than one big store
 * of an object) so a `.svelte` file can auto-subscribe per field, e.g.
 * `{$call.connectionState}` / `{$call.participants.length}`.
 *
 * This factory is plain TypeScript, not a Svelte component — it isn't tied
 * to any component's lifecycle. Always call {@link PurpleCallioCall.destroy}
 * from your component's `onDestroy()` (see the README), or the engine's
 * event listeners (and, if still connected, the call itself) will outlive
 * the component that created them.
 */
export interface PurpleCallioCall {
  /** Current connection state (`'idle' | 'connecting' | ... | 'error'`). */
  connectionState: Readable<ConnectionState>;
  /** Live participant roster, including yourself once joined. */
  participants: Readable<Participant[]>;
  /** Local media state: camera / microphone / screen-share on/off. */
  media: Readable<ParticipantMedia>;
  /** The remote participant's media stream, or `null` before it arrives. */
  remoteStream: Readable<MediaStream | null>;
  /** Your own local media stream, or `null` before `join()` resolves. */
  localStream: Readable<MediaStream | null>;
  /** Your own participant id, or `null` before the call connects. */
  participantId: Readable<string | null>;

  /** Connect signaling + WebRTC and join the call. Idempotent. */
  join(): Promise<void>;
  /** Leave the call and tear down signaling/WebRTC. Safe to call repeatedly. */
  leave(): Promise<void>;

  camera: PurpleCallioMediaControls;
  microphone: PurpleCallioMediaControls;
  screenShare: PurpleCallioScreenShareControls;

  /**
   * Unsubscribes from all engine events and, if the call is still connected,
   * best-effort leaves it. This factory has no automatic lifecycle hook of
   * its own (unlike a React provider unmounting, or Angular's DI-scoped
   * service), so **you must call this yourself** — call it from your
   * component's `onDestroy()`. See the README for a full example.
   */
  destroy(): void;
}

const TERMINAL_STATES: ConnectionState[] = [
  'idle',
  'disconnected',
  'closed',
  'error',
];

/**
 * Create a PurpleCallio call bound to Svelte stores.
 *
 * Constructs the underlying `@purplecallio/sdk` engine immediately (cheap and
 * synchronous — no network activity happens until {@link PurpleCallioCall.join}
 * is called) and wires its events into a handful of `writable()` stores,
 * exposing only their read side.
 *
 * `config.token` MUST be a short-lived **participant token** minted by your
 * own backend (which itself calls `@purplecallio/sdk`'s `PurpleCallioClient`
 * server-side). Never obtain or embed a PurpleCallio API key in a Svelte app
 * — API keys are server-only secrets.
 */
export function createPurpleCallio(config: EngineConfig): PurpleCallioCall {
  const engine = new PurpleCallioMeeting(config);

  const initialMedia: ParticipantMedia = {
    camera: config.video ?? true,
    microphone: config.audio ?? true,
    screenShare: false,
  };

  const connectionStateStore = writable<ConnectionState>('idle');
  const participantsStore = writable<Participant[]>([]);
  const mediaStore = writable<ParticipantMedia>(initialMedia);
  const remoteStreamStore = writable<MediaStream | null>(null);
  const localStreamStore = writable<MediaStream | null>(null);
  const participantIdStore = writable<string | null>(null);

  const offs: Array<() => void> = [];

  offs.push(
    engine.onConnectionStateChanged((state) =>
      connectionStateStore.set(state as ConnectionState),
    ),
  );
  offs.push(
    engine.onParticipantsChanged((participants) =>
      participantsStore.set(participants),
    ),
  );

  offs.push(
    engine.on('connected', (p) => participantIdStore.set(p.participantId)),
  );
  offs.push(engine.on('disconnected', () => participantIdStore.set(null)));

  offs.push(engine.on('remote.stream', (stream) => remoteStreamStore.set(stream)));
  offs.push(engine.on('remote.stream.ended', () => remoteStreamStore.set(null)));

  offs.push(
    engine.on('camera.enabled', () =>
      mediaStore.update((m) => ({ ...m, camera: true })),
    ),
  );
  offs.push(
    engine.on('camera.disabled', () =>
      mediaStore.update((m) => ({ ...m, camera: false })),
    ),
  );
  offs.push(
    engine.on('microphone.enabled', () =>
      mediaStore.update((m) => ({ ...m, microphone: true })),
    ),
  );
  offs.push(
    engine.on('microphone.disabled', () =>
      mediaStore.update((m) => ({ ...m, microphone: false })),
    ),
  );
  offs.push(
    engine.on('screenShare.started', () =>
      mediaStore.update((m) => ({ ...m, screenShare: true })),
    ),
  );
  offs.push(
    engine.on('screenShare.stopped', () =>
      mediaStore.update((m) => ({ ...m, screenShare: false })),
    ),
  );

  async function join(): Promise<void> {
    await engine.join();
    localStreamStore.set(engine.localStreamRef);
  }

  async function leave(): Promise<void> {
    await engine.leave();
    localStreamStore.set(null);
    remoteStreamStore.set(null);
    participantIdStore.set(null);
  }

  function destroy(): void {
    offs.forEach((off) => off());
    offs.length = 0;

    const state = engine.connectionState() as ConnectionState;
    if (!TERMINAL_STATES.includes(state)) {
      // Best-effort cleanup; ignore rejections (e.g. already torn down).
      void engine.leave().catch(() => undefined);
    }
  }

  return {
    connectionState: { subscribe: connectionStateStore.subscribe },
    participants: { subscribe: participantsStore.subscribe },
    media: { subscribe: mediaStore.subscribe },
    remoteStream: { subscribe: remoteStreamStore.subscribe },
    localStream: { subscribe: localStreamStore.subscribe },
    participantId: { subscribe: participantIdStore.subscribe },

    join,
    leave,

    camera: {
      enable: () => engine.camera.enable(),
      disable: () => engine.camera.disable(),
      toggle: () => engine.camera.toggle(),
      isEnabled: () => engine.camera.isEnabled(),
    },
    microphone: {
      enable: () => engine.microphone.enable(),
      disable: () => engine.microphone.disable(),
      toggle: () => engine.microphone.toggle(),
      isEnabled: () => engine.microphone.isEnabled(),
    },
    screenShare: {
      start: () => engine.screenShare.start(),
      stop: () => engine.screenShare.stop(),
      isActive: () => engine.screenShare.isActive(),
    },

    destroy,
  };
}
