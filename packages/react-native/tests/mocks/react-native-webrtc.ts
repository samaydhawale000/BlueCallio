import { vi } from 'vitest';

/**
 * Minimal stand-in for `react-native-webrtc`, registered via
 * `vi.mock('react-native-webrtc', () => import('./mocks/react-native-webrtc'))`.
 * Covers exactly what this package's source touches: the `RTCView`
 * component and `mediaDevices.enumerateDevices()`.
 */

// A plain string "type" is enough for react-test-renderer to treat this as
// a host-like element we can assert against via `root.findByType('RTCView')`.
export const RTCView = 'RTCView';

export const mediaDevices = {
  enumerateDevices: vi.fn(async () => [] as Array<{ deviceId: string; kind: string; label: string }>),
};

export function resetWebrtcMock(): void {
  mediaDevices.enumerateDevices.mockClear();
  mediaDevices.enumerateDevices.mockImplementation(async () => []);
}
