import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

import { FakeMeeting } from './fake-meeting';

vi.mock('@purplecallio/sdk', async () => {
  const mod = await import('./fake-meeting');
  return { PurpleCallioMeeting: mod.FakeMeeting };
});

// Imported after the mock is registered so the factory picks up FakeMeeting.
import { createPurpleCallio } from '../src/lib/createPurpleCallio';

function latestEngine(): FakeMeeting {
  const engine = FakeMeeting.instances[FakeMeeting.instances.length - 1];
  if (!engine) throw new Error('No FakeMeeting instance was constructed');
  return engine;
}

const baseConfig = {
  token: 'participant-token',
  callId: 'call-123',
  signalUrl: 'wss://signal.example.com',
};

describe('createPurpleCallio', () => {
  beforeEach(() => {
    FakeMeeting.instances.length = 0;
  });

  it('constructs the underlying engine eagerly with the given config', () => {
    createPurpleCallio(baseConfig);

    expect(FakeMeeting.instances).toHaveLength(1);
    expect(latestEngine().config).toMatchObject({
      token: 'participant-token',
      callId: 'call-123',
      signalUrl: 'wss://signal.example.com',
    });
  });

  it('connectionState store starts at "idle" and reflects engine changes', () => {
    const call = createPurpleCallio(baseConfig);
    const engine = latestEngine();

    const seen: string[] = [];
    const unsubscribe = call.connectionState.subscribe((s) => seen.push(s));

    engine.setConnectionState('connecting');
    engine.setConnectionState('joined');

    expect(seen).toEqual(['idle', 'connecting', 'joined']);
    unsubscribe();
  });

  it('participants store reflects engine participant-list changes', () => {
    const call = createPurpleCallio(baseConfig);
    const engine = latestEngine();

    expect(get(call.participants)).toEqual([]);

    const roster = [{ participantId: 'a', role: 'CALLER' }];
    engine.setParticipants(roster);

    expect(get(call.participants)).toEqual(roster);
  });

  it('participantId store is set on "connected" and cleared on "disconnected"', () => {
    const call = createPurpleCallio(baseConfig);
    const engine = latestEngine();

    expect(get(call.participantId)).toBeNull();

    engine.emit('connected', { participantId: 'me', role: 'CALLER' });
    expect(get(call.participantId)).toBe('me');

    engine.emit('disconnected', { reason: 'left' });
    expect(get(call.participantId)).toBeNull();
  });

  it('remoteStream store is set on "remote.stream" and cleared on "remote.stream.ended"', () => {
    const call = createPurpleCallio(baseConfig);
    const engine = latestEngine();

    const stream = { id: 'remote' };
    engine.emit('remote.stream', stream);
    expect(get(call.remoteStream)).toBe(stream);

    engine.emit('remote.stream.ended');
    expect(get(call.remoteStream)).toBeNull();
  });

  it('media store defaults from config and tracks camera/microphone/screenShare events', () => {
    const call = createPurpleCallio({ ...baseConfig, video: true, audio: true });
    const engine = latestEngine();

    expect(get(call.media)).toEqual({
      camera: true,
      microphone: true,
      screenShare: false,
    });

    engine.emit('camera.disabled');
    engine.emit('microphone.disabled');
    engine.emit('screenShare.started');

    expect(get(call.media)).toEqual({
      camera: false,
      microphone: false,
      screenShare: true,
    });

    engine.emit('camera.enabled');
    expect(get(call.media)).toMatchObject({ camera: true });
  });

  it('join() delegates to the engine and publishes the local stream once ready', async () => {
    const call = createPurpleCallio(baseConfig);
    const engine = latestEngine();

    expect(get(call.localStream)).toBeNull();

    await call.join();

    expect(engine.joinCalls).toBe(1);
    expect(get(call.localStream)).toEqual({ id: 'fake-local-stream' });
  });

  it('leave() delegates to the engine and clears stream/participant state', async () => {
    const call = createPurpleCallio(baseConfig);
    const engine = latestEngine();

    await call.join();
    engine.emit('connected', { participantId: 'me', role: 'CALLER' });
    engine.emit('remote.stream', { id: 'fake-remote-stream' });

    await call.leave();

    expect(engine.leaveCalls).toBe(1);
    expect(get(call.localStream)).toBeNull();
    expect(get(call.remoteStream)).toBeNull();
    expect(get(call.participantId)).toBeNull();
  });

  describe('toggle semantics (regression guard)', () => {
    // @purplecallio/react has a known bug where its "toggleCamera" calls
    // engine.camera.enable() and "toggleMicrophone" calls
    // engine.microphone.disable() instead of using engine.*.toggle(). These
    // tests pin down that createPurpleCallio does NOT repeat that mistake.

    it('camera.toggle() calls engine.camera.toggle(), not enable()/disable()', () => {
      const call = createPurpleCallio(baseConfig);
      const engine = latestEngine();

      call.camera.toggle();

      expect(engine.camera.toggle).toHaveBeenCalledTimes(1);
      expect(engine.camera.enable).not.toHaveBeenCalled();
      expect(engine.camera.disable).not.toHaveBeenCalled();
    });

    it('microphone.toggle() calls engine.microphone.toggle(), not enable()/disable()', () => {
      const call = createPurpleCallio(baseConfig);
      const engine = latestEngine();

      call.microphone.toggle();

      expect(engine.microphone.toggle).toHaveBeenCalledTimes(1);
      expect(engine.microphone.enable).not.toHaveBeenCalled();
      expect(engine.microphone.disable).not.toHaveBeenCalled();
    });

    it('camera.enable()/disable() still delegate to the matching engine method', () => {
      const call = createPurpleCallio(baseConfig);
      const engine = latestEngine();

      call.camera.enable();
      call.camera.disable();

      expect(engine.camera.enable).toHaveBeenCalledTimes(1);
      expect(engine.camera.disable).toHaveBeenCalledTimes(1);
      expect(engine.camera.toggle).not.toHaveBeenCalled();
    });

    it('microphone.enable()/disable() still delegate to the matching engine method', () => {
      const call = createPurpleCallio(baseConfig);
      const engine = latestEngine();

      call.microphone.enable();
      call.microphone.disable();

      expect(engine.microphone.enable).toHaveBeenCalledTimes(1);
      expect(engine.microphone.disable).toHaveBeenCalledTimes(1);
      expect(engine.microphone.toggle).not.toHaveBeenCalled();
    });
  });

  it('screenShare.start()/stop()/isActive() delegate to the engine', async () => {
    const call = createPurpleCallio(baseConfig);
    const engine = latestEngine();

    await call.screenShare.start();
    await call.screenShare.stop();
    call.screenShare.isActive();

    expect(engine.screenShare.start).toHaveBeenCalledTimes(1);
    expect(engine.screenShare.stop).toHaveBeenCalledTimes(1);
    expect(engine.screenShare.isActive).toHaveBeenCalledTimes(1);
  });

  describe('destroy()', () => {
    it('unsubscribes from engine events — stores stop updating after destroy', () => {
      const call = createPurpleCallio(baseConfig);
      const engine = latestEngine();

      call.destroy();

      const seen: string[] = [];
      call.connectionState.subscribe((s) => seen.push(s));
      seen.length = 0; // drop the initial replayed value

      engine.setConnectionState('connecting');
      engine.emit('remote.stream', { id: 'late-stream' });

      expect(seen).toEqual([]);
      expect(get(call.remoteStream)).toBeNull();
    });

    it('calls engine.leave() when still connected at destroy time', async () => {
      const call = createPurpleCallio(baseConfig);
      const engine = latestEngine();

      await call.join();
      expect(engine.connectionState()).toBe('joined');

      call.destroy();
      // leave() is invoked fire-and-forget; flush microtasks.
      await Promise.resolve();
      await Promise.resolve();

      expect(engine.leaveCalls).toBe(1);
    });

    it('does not call engine.leave() again if already disconnected at destroy time', async () => {
      const call = createPurpleCallio(baseConfig);
      const engine = latestEngine();

      await call.join();
      await call.leave();
      expect(engine.leaveCalls).toBe(1);

      call.destroy();
      await Promise.resolve();

      expect(engine.leaveCalls).toBe(1);
    });
  });
});
