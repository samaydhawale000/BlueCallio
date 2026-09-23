import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('@purplecallio/sdk', async () => {
  const mod = await import('./fake-meeting');
  return { PurpleCallioMeeting: mod.FakeMeeting };
});

import { Platform, emitAppStateChange, resetReactNativeMock } from './mocks/react-native';
import { FakeMeeting } from './fake-meeting';
import { PurpleCallioProvider, MeetingContextValue } from '../src/context';
import { PurpleCallioUnsupportedFeatureError } from '../src/errors';
import { inCallManager } from '../src/optional/inCallManager';

function latestEngine(): FakeMeeting {
  const engine = FakeMeeting.instances[FakeMeeting.instances.length - 1];
  if (!engine) throw new Error('No FakeMeeting instance was constructed');
  return engine;
}

const baseProps = {
  token: 'participant-token',
  callId: 'call-123',
  signalUrl: 'wss://signal.example.com',
};

/** Captures the latest context value on every render via onStateChange. */
function renderProvider(extraProps: Partial<React.ComponentProps<typeof PurpleCallioProvider>> = {}) {
  const states: MeetingContextValue[] = [];
  let renderer!: ReturnType<typeof create>;

  act(() => {
    renderer = create(
      <PurpleCallioProvider {...baseProps} {...extraProps} onStateChange={(s) => states.push(s)}>
        <React.Fragment />
      </PurpleCallioProvider>,
    );
  });

  return {
    renderer,
    latest: () => states[states.length - 1],
  };
}

describe('PurpleCallioProvider', () => {
  beforeEach(() => {
    resetReactNativeMock();
    FakeMeeting.instances.length = 0;
    vi.spyOn(inCallManager, 'start').mockImplementation(() => {});
    vi.spyOn(inCallManager, 'stop').mockImplementation(() => {});
    vi.spyOn(inCallManager, 'setSpeakerphoneOn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('join() permission gating', () => {
    it('requests permissions, then joins the engine and starts InCallManager when granted', async () => {
      Platform.OS = 'android';
      const { latest } = renderProvider();
      const engine = latestEngine();

      const { PermissionsAndroid } = await import('./mocks/react-native');
      PermissionsAndroid.requestMultiple.mockResolvedValueOnce({
        [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]: PermissionsAndroid.RESULTS.GRANTED,
        [PermissionsAndroid.PERMISSIONS.CAMERA]: PermissionsAndroid.RESULTS.GRANTED,
      });

      await act(async () => {
        await latest().join();
      });

      expect(engine.joinCalls).toBe(1);
      expect(inCallManager.start).toHaveBeenCalledWith('video');
      expect(latest().permissionsGranted).toBe(true);
    });

    it('throws and never calls engine.join() when permissions are denied', async () => {
      Platform.OS = 'android';
      const { latest } = renderProvider();
      const engine = latestEngine();

      // Force denial via the mocked PermissionsAndroid.
      const { PermissionsAndroid } = await import('./mocks/react-native');
      PermissionsAndroid.requestMultiple.mockResolvedValueOnce({
        [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]: PermissionsAndroid.RESULTS.DENIED,
        [PermissionsAndroid.PERMISSIONS.CAMERA]: PermissionsAndroid.RESULTS.DENIED,
      });

      await act(async () => {
        await expect(latest().join()).rejects.toThrow(/permissions were not granted/);
      });

      expect(engine.joinCalls).toBe(0);
      expect(inCallManager.start).not.toHaveBeenCalled();
      expect(latest().permissionsGranted).toBe(false);
    });

    it('is a no-op permission check on iOS (always granted) and still joins', async () => {
      Platform.OS = 'ios';
      const { latest } = renderProvider();
      const engine = latestEngine();

      await act(async () => {
        await latest().join();
      });

      expect(engine.joinCalls).toBe(1);
    });
  });

  it('leave() stops InCallManager and delegates to the engine', async () => {
    const { latest } = renderProvider();
    const engine = latestEngine();

    await act(async () => {
      await latest().join();
    });
    await act(async () => {
      await latest().leave();
    });

    expect(engine.leaveCalls).toBe(1);
    expect(inCallManager.stop).toHaveBeenCalled();
  });

  describe('toggle semantics (regression guard)', () => {
    // @purplecallio/react has a known bug where its "toggleCamera" calls
    // engine.camera.enable() and "toggleMicrophone" calls
    // engine.microphone.disable() instead of using engine.*.toggle(). These
    // tests pin down that @purplecallio/react-native does NOT repeat that
    // mistake.

    it('toggleCamera() calls engine.camera.toggle(), not enable()/disable()', () => {
      const { latest } = renderProvider();
      const engine = latestEngine();

      act(() => latest().toggleCamera());

      expect(engine.camera.toggle).toHaveBeenCalledTimes(1);
      expect(engine.camera.enable).not.toHaveBeenCalled();
      expect(engine.camera.disable).not.toHaveBeenCalled();
    });

    it('toggleMicrophone() calls engine.microphone.toggle(), not enable()/disable()', () => {
      const { latest } = renderProvider();
      const engine = latestEngine();

      act(() => latest().toggleMicrophone());

      expect(engine.microphone.toggle).toHaveBeenCalledTimes(1);
      expect(engine.microphone.enable).not.toHaveBeenCalled();
      expect(engine.microphone.disable).not.toHaveBeenCalled();
    });
  });

  describe('screen sharing (React Native limitation)', () => {
    it('start() always rejects with PurpleCallioUnsupportedFeatureError', async () => {
      const { latest } = renderProvider();

      await expect(latest().screenShare.start()).rejects.toBeInstanceOf(PurpleCallioUnsupportedFeatureError);
      await expect(latest().screenShare.start()).rejects.toThrow(/not yet available on React Native/);
    });

    it('isActive() always returns false', () => {
      const { latest } = renderProvider();
      expect(latest().screenShare.isActive()).toBe(false);
    });

    it('the underlying engine.screenShare is never invoked', async () => {
      const { latest } = renderProvider();
      const engine = latestEngine();

      await latest().screenShare.start().catch(() => {});
      latest().screenShare.stop();

      expect(engine.screenShare.start).not.toHaveBeenCalled();
      expect(engine.screenShare.stop).not.toHaveBeenCalled();
    });
  });

  describe('switchCamera()', () => {
    it('calls _switchCamera() on the local stream\'s video track', async () => {
      const { latest } = renderProvider();
      Platform.OS = 'ios';

      await act(async () => {
        await latest().join();
      });

      const engine = latestEngine();
      const videoTrack = engine.localStreamRef!.getVideoTracks()[0] as unknown as { _switchCamera: () => void };

      act(() => latest().switchCamera());

      expect(videoTrack._switchCamera).toHaveBeenCalledTimes(1);
    });

    it('does not throw when there is no local stream yet', () => {
      const { latest } = renderProvider();
      expect(() => latest().switchCamera()).not.toThrow();
    });
  });

  describe('setSpeakerphoneOn()', () => {
    it('delegates to the InCallManager bridge', () => {
      const { latest } = renderProvider();

      act(() => latest().setSpeakerphoneOn(true));

      expect(inCallManager.setSpeakerphoneOn).toHaveBeenCalledWith(true);
    });
  });

  describe('AppState background/foreground camera pause', () => {
    it('disables the camera on background and restores it on foreground (default: enabled)', async () => {
      Platform.OS = 'ios';
      const { latest } = renderProvider();
      const engine = latestEngine();

      await act(async () => {
        await latest().join();
      });
      expect(engine.camera.isEnabled()).toBe(true);

      act(() => emitAppStateChange('background'));
      expect(engine.camera.disable).toHaveBeenCalledTimes(1);
      expect(engine.camera.isEnabled()).toBe(false);

      act(() => emitAppStateChange('active'));
      expect(engine.camera.enable).toHaveBeenCalledTimes(1);
      expect(engine.camera.isEnabled()).toBe(true);
    });

    it('does not re-enable the camera on foreground if it was already off before backgrounding', async () => {
      const { latest } = renderProvider();
      const engine = latestEngine();

      await act(async () => {
        await latest().join();
      });
      act(() => latest().disableCamera());
      expect(engine.camera.isEnabled()).toBe(false);

      act(() => emitAppStateChange('background'));
      // Camera was already off — background pause shouldn't fire a second disable().
      expect(engine.camera.disable).toHaveBeenCalledTimes(1);

      act(() => emitAppStateChange('active'));
      // Not paused-by-background, so no automatic re-enable.
      expect(engine.camera.enable).not.toHaveBeenCalled();
      expect(engine.camera.isEnabled()).toBe(false);
    });

    it('does nothing when pauseVideoInBackground is false', async () => {
      const { latest } = renderProvider({ pauseVideoInBackground: false });
      const engine = latestEngine();

      await act(async () => {
        await latest().join();
      });

      act(() => emitAppStateChange('background'));

      expect(engine.camera.disable).not.toHaveBeenCalled();
      expect(engine.camera.isEnabled()).toBe(true);
    });
  });
});
