/**
 * Defensive bridge to the *optional* peer dependency
 * `@react-native-community/netinfo`.
 *
 * This package deliberately does NOT invent any reconnection logic on top
 * of network state — that's core-SDK territory (see README "Known
 * Limitations" re: the `'reconnecting'` connection state). All this bridge
 * does is surface raw connectivity info so a consuming app can show its own
 * "you're offline" UI via `useNetworkState()`.
 */

export type NetInfoStateTypeLike = string;

export interface NetInfoStateLike {
  type: NetInfoStateTypeLike;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

export type NetInfoUnsubscribe = () => void;

export interface NetInfoLike {
  addEventListener(listener: (state: NetInfoStateLike) => void): NetInfoUnsubscribe;
  fetch(): Promise<NetInfoStateLike>;
}

let warnedMissing = false;
function warnMissingOnce(): void {
  if (warnedMissing) return;
  warnedMissing = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[@purplecallio/react-native] @react-native-community/netinfo is not installed. ' +
      'useNetworkState() will report { supported: false } and never update. Install it ' +
      'to surface real connectivity state: npm install @react-native-community/netinfo',
  );
}

/**
 * Default loader: defensively requires the real optional native module.
 * Kept as a plain function so `NetInfoBridge` can be constructed with a
 * fake loader in tests, without needing the real native package installed.
 */
export function loadNetInfo(): NetInfoLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-community/netinfo');
    return (mod && mod.default ? mod.default : mod) as NetInfoLike;
  } catch {
    return null;
  }
}

export class NetInfoBridge {
  constructor(private readonly load: () => NetInfoLike | null = loadNetInfo) {}

  private resolve(): NetInfoLike | null {
    const mod = this.load();
    if (!mod) warnMissingOnce();
    return mod;
  }

  isSupported(): boolean {
    return this.resolve() !== null;
  }

  subscribe(listener: (state: NetInfoStateLike) => void): NetInfoUnsubscribe {
    const mod = this.resolve();
    if (!mod) return () => {};
    return mod.addEventListener(listener);
  }

  fetch(): Promise<NetInfoStateLike | null> {
    const mod = this.resolve();
    if (!mod) return Promise.resolve(null);
    return mod.fetch();
  }
}

/** Shared default instance used by `useNetworkState()`. */
export const netInfo = new NetInfoBridge();
