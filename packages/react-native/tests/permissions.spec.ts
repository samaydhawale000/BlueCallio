import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('./mocks/react-native'));

import { Platform, PermissionsAndroid, resetReactNativeMock } from './mocks/react-native';
import { requestMediaPermissions } from '../src/permissions';

describe('requestMediaPermissions', () => {
  beforeEach(() => {
    resetReactNativeMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('is a no-op that resolves true on iOS, without touching PermissionsAndroid', async () => {
    Platform.OS = 'ios';

    const granted = await requestMediaPermissions({ audio: true, video: true });

    expect(granted).toBe(true);
    expect(PermissionsAndroid.requestMultiple).not.toHaveBeenCalled();
  });

  it('requests both RECORD_AUDIO and CAMERA on Android by default', async () => {
    Platform.OS = 'android';
    PermissionsAndroid.requestMultiple.mockResolvedValueOnce({
      [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]: PermissionsAndroid.RESULTS.GRANTED,
      [PermissionsAndroid.PERMISSIONS.CAMERA]: PermissionsAndroid.RESULTS.GRANTED,
    });

    const granted = await requestMediaPermissions();

    expect(granted).toBe(true);
    expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);
  });

  it('only requests CAMERA when audio is not requested', async () => {
    Platform.OS = 'android';
    PermissionsAndroid.requestMultiple.mockResolvedValueOnce({
      [PermissionsAndroid.PERMISSIONS.CAMERA]: PermissionsAndroid.RESULTS.GRANTED,
    });

    await requestMediaPermissions({ audio: false, video: true });

    expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith([PermissionsAndroid.PERMISSIONS.CAMERA]);
  });

  it('skips the native call entirely when neither audio nor video is requested', async () => {
    Platform.OS = 'android';

    const granted = await requestMediaPermissions({ audio: false, video: false });

    expect(granted).toBe(true);
    expect(PermissionsAndroid.requestMultiple).not.toHaveBeenCalled();
  });

  it('returns false when any requested permission is denied', async () => {
    Platform.OS = 'android';
    PermissionsAndroid.requestMultiple.mockResolvedValueOnce({
      [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]: PermissionsAndroid.RESULTS.GRANTED,
      [PermissionsAndroid.PERMISSIONS.CAMERA]: PermissionsAndroid.RESULTS.DENIED,
    });

    const granted = await requestMediaPermissions({ audio: true, video: true });

    expect(granted).toBe(false);
  });

  it('returns false when a permission is permanently denied ("never ask again")', async () => {
    Platform.OS = 'android';
    PermissionsAndroid.requestMultiple.mockResolvedValueOnce({
      [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]: PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
      [PermissionsAndroid.PERMISSIONS.CAMERA]: PermissionsAndroid.RESULTS.GRANTED,
    });

    const granted = await requestMediaPermissions({ audio: true, video: true });

    expect(granted).toBe(false);
  });
});
