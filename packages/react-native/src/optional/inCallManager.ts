/**
 * Defensive bridge to the *optional* peer dependency
 * `react-native-incall-manager`, which manages call audio routing
 * (speaker / earpiece / Bluetooth) — something `react-native-webrtc` does
 * not handle on its own.
 *
 * It is listed in package.json as an optional peerDependency
 * (`peerDependenciesMeta.react-native-incall-manager.optional = true`), so
 * consumers who don't need custom audio routing behavior can skip
 * installing it entirely. We load it with `require()` inside a try/catch so
 * a missing install never crashes module evaluation — it just disables
 * automatic audio routing and logs a one-time warning.
 */

export interface InCallManagerLike {
  start(options?: { media?: 'audio' | 'video'; auto?: boolean; ringback?: string }): void;
  stop(options?: { busytone?: string }): void;
  setForceSpeakerphoneOn?(enabled: boolean): void;
  setSpeakerphoneOn?(enabled: boolean): void;
}

let warnedMissing = false;
function warnMissingOnce(): void {
  if (warnedMissing) return;
  warnedMissing = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[@purplecallio/react-native] react-native-incall-manager is not installed. ' +
      'Call audio routing (speaker/earpiece switching on join/leave, setSpeakerphoneOn()) ' +
      'will not be managed automatically. Install it for production call UX: ' +
      'npm install react-native-incall-manager',
  );
}

/**
 * Default loader: defensively requires the real optional native module.
 * Kept as a plain function (rather than inlined) so `InCallManagerBridge`
 * can be constructed with a fake loader in tests, without needing the real
 * native package installed or mocked at the module resolution level.
 */
export function loadInCallManager(): InCallManagerLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-incall-manager');
    return (mod && mod.default ? mod.default : mod) as InCallManagerLike;
  } catch {
    return null;
  }
}

export class InCallManagerBridge {
  constructor(private readonly load: () => InCallManagerLike | null = loadInCallManager) {}

  private resolve(): InCallManagerLike | null {
    const mgr = this.load();
    if (!mgr) warnMissingOnce();
    return mgr;
  }

  /** Called automatically by `<PurpleCallioProvider>` on `join()`. */
  start(media: 'audio' | 'video'): void {
    this.resolve()?.start({ media, auto: true });
  }

  /** Called automatically by `<PurpleCallioProvider>` on `leave()`/unmount. */
  stop(): void {
    this.resolve()?.stop();
  }

  /** Force call audio to the loudspeaker (true) or earpiece/default route (false). */
  setSpeakerphoneOn(enabled: boolean): void {
    const mgr = this.resolve();
    if (!mgr) return;
    if (typeof mgr.setForceSpeakerphoneOn === 'function') {
      mgr.setForceSpeakerphoneOn(enabled);
    } else {
      mgr.setSpeakerphoneOn?.(enabled);
    }
  }
}

/** Shared default instance used by the provider and the standalone `setSpeakerphoneOn` export. */
export const inCallManager = new InCallManagerBridge();
