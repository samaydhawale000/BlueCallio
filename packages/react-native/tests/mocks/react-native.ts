import { vi } from 'vitest';

/**
 * Minimal, controllable stand-in for the `react-native` package, registered
 * via `vi.mock('react-native', () => import('./mocks/react-native'))` in
 * spec files. Covers exactly the surface `@purplecallio/react-native`'s
 * source touches: `Platform`, `PermissionsAndroid`, `AppState`, `View`,
 * `StyleSheet`.
 *
 * `View`/`StyleSheet` are string/passthrough stand-ins rather than real
 * native components — `react-test-renderer` doesn't require real host
 * component registration, so this is enough to assert on rendered output.
 */

export const Platform: { OS: 'ios' | 'android' } = { OS: 'ios' };

export const PermissionsAndroid = {
  PERMISSIONS: {
    RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    CAMERA: 'android.permission.CAMERA',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  requestMultiple: vi.fn(async (_permissions: string[]) => ({}) as Record<string, string>),
};

type AppStateListener = (state: string) => void;
const appStateListeners = new Map<string, Set<AppStateListener>>();

export const AppState = {
  currentState: 'active',
  addEventListener: vi.fn((event: string, listener: AppStateListener) => {
    if (!appStateListeners.has(event)) appStateListeners.set(event, new Set());
    appStateListeners.get(event)!.add(listener);
    return {
      remove: vi.fn(() => {
        appStateListeners.get(event)?.delete(listener);
      }),
    };
  }),
};

/** Test helper: simulate the app transitioning to a new AppState status. */
export function emitAppStateChange(state: string): void {
  appStateListeners.get('change')?.forEach((l) => l(state));
}

/** Test helper: reset all mock call history + registered listeners between tests. */
export function resetReactNativeMock(): void {
  Platform.OS = 'ios';
  PermissionsAndroid.requestMultiple.mockClear();
  PermissionsAndroid.requestMultiple.mockImplementation(async () => ({}));
  AppState.addEventListener.mockClear();
  appStateListeners.clear();
}

export const View = 'RNView';

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
};
