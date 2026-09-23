/**
 * Hand-written, minimal ambient type declarations for this package's two
 * *optional* peer dependencies: `react-native-incall-manager` and
 * `@react-native-community/netinfo`.
 *
 * We deliberately do NOT install these packages as devDependencies (see
 * package.json — they're peerDependencies with peerDependenciesMeta.optional
 * = true, and are `require()`d defensively at runtime, see src/optional/*).
 * That means the real published `.d.ts` files for these packages are not
 * necessarily present in node_modules when this package is built or a
 * consuming app type-checks against it. These local declarations cover only
 * the small slice of each library's API surface that this package actually
 * calls, so `tsc` has something to check against regardless of whether a
 * consumer (or our own CI) has the real packages installed.
 *
 * If a consumer *does* install the real packages, their own richer types
 * simply take precedence for their own code — these ambient declarations
 * only affect how this package's internals are compiled.
 */

declare module 'react-native-incall-manager' {
  interface InCallManagerStartOptions {
    media?: 'audio' | 'video';
    auto?: boolean;
    ringback?: string;
  }

  interface InCallManagerStopOptions {
    busytone?: string;
  }

  interface InCallManagerModule {
    start(options?: InCallManagerStartOptions): void;
    stop(options?: InCallManagerStopOptions): void;
    setForceSpeakerphoneOn(enabled: boolean): void;
    setSpeakerphoneOn(enabled: boolean): void;
  }

  const InCallManager: InCallManagerModule;
  export default InCallManager;
}

declare module '@react-native-community/netinfo' {
  export type NetInfoStateType =
    | 'none'
    | 'unknown'
    | 'cellular'
    | 'wifi'
    | 'bluetooth'
    | 'ethernet'
    | 'wimax'
    | 'vpn'
    | 'other';

  export interface NetInfoState {
    type: NetInfoStateType;
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  }

  export type NetInfoChangeHandler = (state: NetInfoState) => void;
  export type NetInfoSubscription = () => void;

  function addEventListener(listener: NetInfoChangeHandler): NetInfoSubscription;
  function fetch(): Promise<NetInfoState>;

  const NetInfo: {
    addEventListener: typeof addEventListener;
    fetch: typeof fetch;
  };

  export default NetInfo;
  export { addEventListener, fetch };
}
