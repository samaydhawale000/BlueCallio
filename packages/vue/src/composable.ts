import { getCurrentInstance, onUnmounted, ref, shallowRef } from 'vue';
import type { Ref, ShallowRef } from 'vue';

import {
  PurpleCallioMeeting,
  type ConnectionState,
  type EngineConfig,
  type Participant,
  type ParticipantMedia,
} from '@purplecallio/sdk';

/**
 * Config accepted by {@link usePurpleCallio}. Identical to the core SDK's
 * `EngineConfig`.
 *
 * `token` MUST be a short-lived **participant token** minted by your own
 * backend (which itself calls `@purplecallio/sdk`'s server-side
 * `PurpleCallioClient`, using your API key). Never generate a token
 * client-side, and never embed a PurpleCallio API key in a Vue app — API
 * keys are server-only secrets. See the README's "Security" section.
 */
export type UsePurpleCallioOptions = EngineConfig;

/** Camera/microphone controls. Delegates straight to the underlying engine. */
export interface MediaControls {
  enable(): void;
  disable(): void;
  toggle(): void;
  isEnabled(): boolean;
}

/** Screen-share controls. Delegates straight to the underlying engine. */
export interface ScreenShareControls {
  start(): Promise<void>;
  stop(): Promise<void>;
  isActive(): boolean;
}

export interface UsePurpleCallioReturn {
  /** Current connection state (`'idle' | 'connecting' | ... | 'error'`). */
  connectionState: Ref<ConnectionState>;
  /** Live participant roster, including yourself once joined. */
  participants: Ref<Participant[]>;
  /** Local media state: camera / microphone / screen-share on/off. */
  media: Ref<ParticipantMedia>;
  /**
   * The remote participant's media stream, or `null` before it arrives.
   * `shallowRef` on purpose — a `MediaStream` is a native browser object
   * with internal state Vue's deep-reactivity proxy would fight with (and
   * gain nothing from), so only reassignment of the ref itself is tracked.
   */
  remoteStream: ShallowRef<MediaStream | null>;
  /** Your own local media stream, or `null` before `join()` resolves. Also a `shallowRef` — see {@link remoteStream}. */
  localStream: ShallowRef<MediaStream | null>;
  /** Your own participant id, or `null` before the call connects. */
  participantId: Ref<string | null>;
  /** Connect signaling + WebRTC and join the call. Idempotent, mirroring the underlying engine. */
  join(): Promise<void>;
  /** Leave the call and tear down signaling/WebRTC. Safe to call even if never joined. */
  leave(): Promise<void>;
  camera: MediaControls;
  microphone: MediaControls;
  screenShare: ScreenShareControls;
}

/** Module-scoped factory kept separate from the composable body so `usePurpleCallio` itself stays focused on wiring state, not engine construction. */
function createEngine(config: UsePurpleCallioOptions): PurpleCallioMeeting {
  return new PurpleCallioMeeting({
    token: config.token,
    callId: config.callId,
    signalUrl: config.signalUrl,
    video: config.video,
    audio: config.audio,
    iceServers: config.iceServers,
    overrideIceServers: config.overrideIceServers,
  });
}

const NOT_CONNECTED_STATES: string[] = ['idle', 'disconnected', 'closed', 'error'];

/**
 * Vue 3 (Composition API) adapter around `@purplecallio/sdk`'s
 * `PurpleCallioMeeting` engine.
 *
 * Creates a brand-new engine + reactive state every time it is called — it
 * is not a shared singleton, so calling it more than once produces
 * independent calls (mirror the same one-engine-per-call rule
 * `@purplecallio/react`'s `<MeetingProvider>` and
 * `@purplecallio/react-native`'s `<PurpleCallioProvider>` each apply per
 * mounted provider instance).
 *
 * ## Automatic cleanup
 *
 * When called during a component's `setup()`, an `onUnmounted` hook is
 * registered that calls `leave()` as a safety net if the component unmounts
 * while still connected (mirroring the intent of
 * `@purplecallio/angular`'s `PurpleCallioService.ngOnDestroy`). This is a
 * last-resort net, **not** a substitute for calling `leave()` yourself at
 * the right point in your app's own flow (e.g. a "Leave call" button, or a
 * route guard) — relying on unmount alone means the call stays connected
 * for as long as the component is on screen, which is usually not what you
 * want for an explicit "hang up" action.
 *
 * `usePurpleCallio` also works outside a component's `setup()` (e.g. in a
 * Pinia store or a plain composable-of-composables) — `getCurrentInstance()`
 * is used to detect that context and skip registering the unmount hook when
 * there is no component instance to attach it to. In that case, cleanup is
 * entirely your responsibility: call `leave()` yourself when you're done.
 */
export function usePurpleCallio(config: UsePurpleCallioOptions): UsePurpleCallioReturn {
  const engine = createEngine(config);

  const connectionState = ref<ConnectionState>('idle') as Ref<ConnectionState>;
  const participants = ref<Participant[]>([]) as Ref<Participant[]>;
  const media = ref<ParticipantMedia>({
    camera: config.video ?? true,
    microphone: config.audio ?? true,
    screenShare: false,
  }) as Ref<ParticipantMedia>;
  const remoteStream = shallowRef<MediaStream | null>(null);
  const localStream = shallowRef<MediaStream | null>(null);
  const participantId = ref<string | null>(null) as Ref<string | null>;

  const offs: Array<() => void> = [];

  offs.push(engine.on('connected', (p) => { participantId.value = p.participantId; }));
  offs.push(engine.on('disconnected', () => { participantId.value = null; }));

  offs.push(engine.on('remote.stream', (stream) => { remoteStream.value = stream; }));
  offs.push(engine.on('remote.stream.ended', () => { remoteStream.value = null; }));

  offs.push(engine.on('participant.joined', () => { participants.value = engine.participants(); }));
  offs.push(engine.on('participant.left', () => { participants.value = engine.participants(); }));
  offs.push(engine.on('participant.updated', () => { participants.value = engine.participants(); }));

  offs.push(engine.on('camera.enabled', () => { media.value = { ...media.value, camera: true }; }));
  offs.push(engine.on('camera.disabled', () => { media.value = { ...media.value, camera: false }; }));
  offs.push(engine.on('microphone.enabled', () => { media.value = { ...media.value, microphone: true }; }));
  offs.push(engine.on('microphone.disabled', () => { media.value = { ...media.value, microphone: false }; }));
  offs.push(engine.on('screenShare.started', () => { media.value = { ...media.value, screenShare: true }; }));
  offs.push(engine.on('screenShare.stopped', () => { media.value = { ...media.value, screenShare: false }; }));

  // Blanket subscription so state transitions the engine reports without a
  // matching named event above (e.g. 'connecting', 'joining', 'reconnecting')
  // are still reflected — we pass through whatever the core engine reports,
  // faithfully, rather than inventing our own state machine on top of it.
  offs.push(engine.onConnectionStateChanged((state) => { connectionState.value = state as ConnectionState; }));
  offs.push(engine.onParticipantsChanged((next) => { participants.value = next; }));

  function teardownListeners(): void {
    offs.forEach((off) => off());
    offs.length = 0;
  }

  async function join(): Promise<void> {
    await engine.join();
    localStream.value = engine.localStreamRef;
  }

  async function leave(): Promise<void> {
    await engine.leave();
    localStream.value = null;
    remoteStream.value = null;
    participantId.value = null;
  }

  const camera: MediaControls = {
    enable: () => engine.camera.enable(),
    disable: () => engine.camera.disable(),
    // NOTE: this calls `.toggle()`, not `.enable()`/`.disable()`.
    // `@purplecallio/react`'s `context.tsx` has a known bug where its
    // `toggleCamera`/`toggleMicrophone` call the wrong methods — see
    // `tests/composable.spec.ts`'s "toggle semantics" regression guard.
    toggle: () => engine.camera.toggle(),
    isEnabled: () => engine.camera.isEnabled(),
  };

  const microphone: MediaControls = {
    enable: () => engine.microphone.enable(),
    disable: () => engine.microphone.disable(),
    toggle: () => engine.microphone.toggle(),
    isEnabled: () => engine.microphone.isEnabled(),
  };

  const screenShare: ScreenShareControls = {
    start: () => engine.screenShare.start(),
    stop: () => engine.screenShare.stop(),
    isActive: () => engine.screenShare.isActive(),
  };

  // Only register the unmount safety net when there's a component instance
  // to attach it to (see the "Automatic cleanup" doc comment above).
  if (getCurrentInstance()) {
    onUnmounted(() => {
      teardownListeners();
      if (!NOT_CONNECTED_STATES.includes(engine.connectionState())) {
        // Best-effort cleanup; ignore rejections (e.g. already torn down).
        void engine.leave().catch(() => undefined);
      }
    });
  }

  return {
    connectionState,
    participants,
    media,
    remoteStream,
    localStream,
    participantId,
    join,
    leave,
    camera,
    microphone,
    screenShare,
  };
}
