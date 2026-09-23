import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { FakeMeeting } from './fake-meeting';

vi.mock('@purplecallio/sdk', async () => {
  const mod = await import('./fake-meeting');
  return { PurpleCallioMeeting: mod.FakeMeeting };
});

// Imported after the mock is registered so the composable picks up FakeMeeting.
import { usePurpleCallio, type UsePurpleCallioReturn } from '../src/composable';

const baseConfig = {
  token: 'participant-token',
  callId: 'call-123',
  signalUrl: 'wss://signal.example.com',
};

function latestEngine(): FakeMeeting {
  const engine = FakeMeeting.instances[FakeMeeting.instances.length - 1];
  if (!engine) throw new Error('No FakeMeeting instance was constructed');
  return engine;
}

/** Mounts a throwaway host component so `usePurpleCallio` runs inside a real component's `setup()` (needed for the `onUnmounted` safety net to register). */
function mountComposable(config: Parameters<typeof usePurpleCallio>[0]) {
  let result!: UsePurpleCallioReturn;
  const TestComponent = defineComponent({
    setup() {
      result = usePurpleCallio(config);
      return () => h('div');
    },
  });
  const wrapper = mount(TestComponent);
  return { wrapper, result };
}

describe('usePurpleCallio', () => {
  beforeEach(() => {
    FakeMeeting.instances.length = 0;
  });

  it('constructs the underlying engine with the given config', () => {
    mountComposable(baseConfig);

    expect(FakeMeeting.instances).toHaveLength(1);
    expect(latestEngine().config).toMatchObject({
      token: 'participant-token',
      callId: 'call-123',
      signalUrl: 'wss://signal.example.com',
    });
  });

  it('starts with idle connection state and no participants', () => {
    const { result } = mountComposable(baseConfig);

    expect(result.connectionState.value).toBe('idle');
    expect(result.participants.value).toEqual([]);
    expect(result.remoteStream.value).toBeNull();
    expect(result.localStream.value).toBeNull();
    expect(result.participantId.value).toBeNull();
  });

  it('join() delegates to the engine and publishes the local stream once ready', async () => {
    const { result } = mountComposable(baseConfig);
    const engine = latestEngine();

    await result.join();

    expect(engine.joinCalls).toBe(1);
    expect(result.localStream.value).toEqual({ id: 'fake-local-stream' });
  });

  it('leave() delegates to the engine and clears stream/participant state', async () => {
    const { result } = mountComposable(baseConfig);
    const engine = latestEngine();

    await result.join();
    engine.emit('connected', { participantId: 'me', role: 'CALLER' });
    engine.emit('remote.stream', { id: 'fake-remote-stream' });

    await result.leave();

    expect(engine.leaveCalls).toBe(1);
    expect(result.localStream.value).toBeNull();
    expect(result.remoteStream.value).toBeNull();
    expect(result.participantId.value).toBeNull();
  });

  it('leave() is a no-op-safe call even if never joined', async () => {
    const { result } = mountComposable(baseConfig);
    await expect(result.leave()).resolves.toBeUndefined();
  });

  it('connectionState updates as the engine reports state changes', () => {
    const { result } = mountComposable(baseConfig);
    const engine = latestEngine();

    engine.setConnectionState('connecting');
    expect(result.connectionState.value).toBe('connecting');

    engine.setConnectionState('joined');
    expect(result.connectionState.value).toBe('joined');
  });

  it('participants updates on participant.joined/left/updated and onParticipantsChanged', () => {
    const { result } = mountComposable(baseConfig);
    const engine = latestEngine();

    const roster = [{ participantId: 'a', role: 'CALLER' }];
    engine.setParticipants(roster);

    expect(result.participants.value).toEqual(roster);
  });

  it('participantId is set on "connected" and cleared on "disconnected"', () => {
    const { result } = mountComposable(baseConfig);
    const engine = latestEngine();

    engine.emit('connected', { participantId: 'me', role: 'CALLER' });
    expect(result.participantId.value).toBe('me');

    engine.emit('disconnected', { reason: 'left' });
    expect(result.participantId.value).toBeNull();
  });

  it('remoteStream is set on "remote.stream" and cleared on "remote.stream.ended"', () => {
    const { result } = mountComposable(baseConfig);
    const engine = latestEngine();

    const stream = { id: 'remote' };
    engine.emit('remote.stream', stream);
    expect(result.remoteStream.value).toBe(stream);

    engine.emit('remote.stream.ended');
    expect(result.remoteStream.value).toBeNull();
  });

  it('media tracks camera/microphone/screenShare events', () => {
    const { result } = mountComposable({ ...baseConfig, video: true, audio: true });
    const engine = latestEngine();

    engine.emit('camera.disabled');
    engine.emit('microphone.disabled');
    engine.emit('screenShare.started');

    expect(result.media.value).toEqual({
      camera: false,
      microphone: false,
      screenShare: true,
    });

    engine.emit('camera.enabled');
    expect(result.media.value).toMatchObject({ camera: true });
  });

  describe('toggle semantics (regression guard)', () => {
    // @purplecallio/react has a known bug where its "toggleCamera" calls
    // engine.camera.enable() and "toggleMicrophone" calls
    // engine.microphone.disable() instead of using engine.*.toggle(). These
    // tests pin down that usePurpleCallio does NOT repeat that mistake.

    it('camera.toggle() calls engine.camera.toggle(), not enable()/disable()', () => {
      const { result } = mountComposable(baseConfig);
      const engine = latestEngine();

      result.camera.toggle();

      expect(engine.camera.toggle).toHaveBeenCalledTimes(1);
      expect(engine.camera.enable).not.toHaveBeenCalled();
      expect(engine.camera.disable).not.toHaveBeenCalled();
    });

    it('microphone.toggle() calls engine.microphone.toggle(), not enable()/disable()', () => {
      const { result } = mountComposable(baseConfig);
      const engine = latestEngine();

      result.microphone.toggle();

      expect(engine.microphone.toggle).toHaveBeenCalledTimes(1);
      expect(engine.microphone.enable).not.toHaveBeenCalled();
      expect(engine.microphone.disable).not.toHaveBeenCalled();
    });

    it('camera.enable()/disable() still delegate to the matching engine method', () => {
      const { result } = mountComposable(baseConfig);
      const engine = latestEngine();

      result.camera.enable();
      result.camera.disable();

      expect(engine.camera.enable).toHaveBeenCalledTimes(1);
      expect(engine.camera.disable).toHaveBeenCalledTimes(1);
      expect(engine.camera.toggle).not.toHaveBeenCalled();
    });

    it('microphone.enable()/disable() still delegate to the matching engine method', () => {
      const { result } = mountComposable(baseConfig);
      const engine = latestEngine();

      result.microphone.enable();
      result.microphone.disable();

      expect(engine.microphone.enable).toHaveBeenCalledTimes(1);
      expect(engine.microphone.disable).toHaveBeenCalledTimes(1);
      expect(engine.microphone.toggle).not.toHaveBeenCalled();
    });
  });

  it('screenShare.start()/stop() delegate to the engine', async () => {
    const { result } = mountComposable(baseConfig);
    const engine = latestEngine();

    await result.screenShare.start();
    await result.screenShare.stop();

    expect(engine.screenShare.start).toHaveBeenCalledTimes(1);
    expect(engine.screenShare.stop).toHaveBeenCalledTimes(1);
  });

  describe('automatic cleanup on unmount', () => {
    it('calls engine.leave() when the host component unmounts while still connected', async () => {
      const { wrapper, result } = mountComposable(baseConfig);
      const engine = latestEngine();

      await result.join();
      expect(engine.connectionState()).toBe('joined');

      wrapper.unmount();

      expect(engine.leaveCalls).toBe(1);
    });

    it('does not call engine.leave() again when the component unmounts already disconnected', () => {
      const { wrapper } = mountComposable(baseConfig);
      const engine = latestEngine();

      // Never joined — engine starts and stays 'idle'.
      wrapper.unmount();

      expect(engine.leaveCalls).toBe(0);
    });

    it('stops forwarding engine events to the (now-unmounted) refs', () => {
      const { wrapper, result } = mountComposable(baseConfig);
      const engine = latestEngine();

      wrapper.unmount();
      engine.emit('remote.stream', { id: 'late-arrival' });

      expect(result.remoteStream.value).toBeNull();
    });
  });

  describe('usage outside component context', () => {
    it('does not throw when called outside setup(), and skips the unmount safety net', () => {
      expect(() => usePurpleCallio(baseConfig)).not.toThrow();
      // No component instance exists here, so there is nothing to attach an
      // onUnmounted hook to — cleanup is the caller's own responsibility in
      // this mode (documented in the composable's doc comment and README).
    });
  });
});
