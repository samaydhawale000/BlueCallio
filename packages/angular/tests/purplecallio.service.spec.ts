import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeMeeting } from './fake-meeting';

vi.mock('@purplecallio/sdk', async () => {
  const mod = await import('./fake-meeting');
  return { PurpleCallioMeeting: mod.FakeMeeting };
});

// Imported after the mock is registered so the service picks up FakeMeeting.
import { PurpleCallioService } from '../src/lib/purplecallio.service';

function latestEngine(): FakeMeeting {
  const engine = FakeMeeting.instances[FakeMeeting.instances.length - 1];
  if (!engine) throw new Error('No FakeMeeting instance was constructed');
  return engine;
}

function values<T>(obs: { subscribe: (fn: (v: T) => void) => void }): T[] {
  const collected: T[] = [];
  obs.subscribe((v) => collected.push(v));
  return collected;
}

const baseConfig = {
  token: 'participant-token',
  callId: 'call-123',
  signalUrl: 'wss://signal.example.com',
};

describe('PurpleCallioService', () => {
  beforeEach(() => {
    FakeMeeting.instances.length = 0;
  });

  it('throws when used before configure()', () => {
    const service = new PurpleCallioService();
    expect(() => service.camera.enable()).toThrow(/configure\(\)/);
    expect(() => service.microphone.toggle()).toThrow(/configure\(\)/);
    expect(() => service.screenShare.isActive()).toThrow(/configure\(\)/);
  });

  it('configure() lazily constructs the underlying engine with the given config', () => {
    const service = new PurpleCallioService();
    service.configure(baseConfig);

    expect(FakeMeeting.instances).toHaveLength(1);
    const engine = latestEngine();
    expect(engine.config).toMatchObject({
      token: 'participant-token',
      callId: 'call-123',
      signalUrl: 'wss://signal.example.com',
    });
  });

  it('configure() throws if called again while the previous call is still active', () => {
    const service = new PurpleCallioService();
    service.configure(baseConfig);
    latestEngine().setConnectionState('joined');

    expect(() => service.configure(baseConfig)).toThrow(/leave\(\)/);
  });

  it('configure() may be called again once the previous call has ended', () => {
    const service = new PurpleCallioService();
    service.configure(baseConfig);
    latestEngine().setConnectionState('disconnected');

    expect(() => service.configure(baseConfig)).not.toThrow();
    expect(FakeMeeting.instances).toHaveLength(2);
  });

  it('join() delegates to the engine and publishes the local stream once ready', async () => {
    const service = new PurpleCallioService();
    service.configure(baseConfig);
    const engine = latestEngine();

    const localStreams: unknown[] = [];
    service.localStream$.subscribe((s) => localStreams.push(s));

    await service.join();

    expect(engine.joinCalls).toBe(1);
    expect(localStreams.at(-1)).toEqual({ id: 'fake-local-stream' });
  });

  it('leave() delegates to the engine and clears stream/participant state', async () => {
    const service = new PurpleCallioService();
    service.configure(baseConfig);
    const engine = latestEngine();
    await service.join();
    engine.emit('connected', { participantId: 'me', role: 'CALLER' });
    engine.emit('remote.stream', { id: 'fake-remote-stream' });

    await service.leave();

    expect(engine.leaveCalls).toBe(1);
    expect(values(service.localStream$)).toEqual([null]);
    expect(values(service.remoteStream$)).toEqual([null]);
    expect(values(service.participantId$)).toEqual([null]);
  });

  it('leave() is a no-op when never configured', async () => {
    const service = new PurpleCallioService();
    await expect(service.leave()).resolves.toBeUndefined();
  });

  it('connectionState$ reflects engine connection-state changes', () => {
    const service = new PurpleCallioService();
    service.configure(baseConfig);
    const engine = latestEngine();

    const seen: string[] = [];
    service.connectionState$.subscribe((s) => seen.push(s));

    engine.setConnectionState('connecting');
    engine.setConnectionState('joined');

    expect(seen).toEqual(['idle', 'connecting', 'joined']);
  });

  it('participants$ reflects engine participant-list changes', () => {
    const service = new PurpleCallioService();
    service.configure(baseConfig);
    const engine = latestEngine();

    const seen: unknown[][] = [];
    service.participants$.subscribe((p) => seen.push(p));

    const roster = [{ participantId: 'a', role: 'CALLER' }];
    engine.setParticipants(roster);

    expect(seen.at(-1)).toEqual(roster);
  });

  it('participantId$ is set on "connected" and cleared on "disconnected"', () => {
    const service = new PurpleCallioService();
    service.configure(baseConfig);
    const engine = latestEngine();

    const seen: (string | null)[] = [];
    service.participantId$.subscribe((id) => seen.push(id));

    engine.emit('connected', { participantId: 'me', role: 'CALLER' });
    expect(seen.at(-1)).toBe('me');

    engine.emit('disconnected', { reason: 'left' });
    expect(seen.at(-1)).toBeNull();
  });

  it('remoteStream$ is set on "remote.stream" and cleared on "remote.stream.ended"', () => {
    const service = new PurpleCallioService();
    service.configure(baseConfig);
    const engine = latestEngine();

    const seen: unknown[] = [];
    service.remoteStream$.subscribe((s) => seen.push(s));

    const stream = { id: 'remote' };
    engine.emit('remote.stream', stream);
    expect(seen.at(-1)).toBe(stream);

    engine.emit('remote.stream.ended');
    expect(seen.at(-1)).toBeNull();
  });

  it('media$ tracks camera/microphone/screenShare events', () => {
    const service = new PurpleCallioService();
    service.configure({ ...baseConfig, video: true, audio: true });
    const engine = latestEngine();

    const seen: Array<Record<string, boolean>> = [];
    service.media$.subscribe((m) => seen.push({ ...m }));

    engine.emit('camera.disabled');
    engine.emit('microphone.disabled');
    engine.emit('screenShare.started');

    expect(seen.at(-1)).toEqual({
      camera: false,
      microphone: false,
      screenShare: true,
    });

    engine.emit('camera.enabled');
    expect(seen.at(-1)).toMatchObject({ camera: true });
  });

  describe('toggle semantics (regression guard)', () => {
    // @purplecallio/react has a known bug where its "toggleCamera" calls
    // engine.camera.enable() and "toggleMicrophone" calls
    // engine.microphone.disable() instead of using engine.*.toggle(). These
    // tests pin down that PurpleCallioService does NOT repeat that mistake.

    it('camera.toggle() calls engine.camera.toggle(), not enable()/disable()', () => {
      const service = new PurpleCallioService();
      service.configure(baseConfig);
      const engine = latestEngine();

      service.camera.toggle();

      expect(engine.camera.toggle).toHaveBeenCalledTimes(1);
      expect(engine.camera.enable).not.toHaveBeenCalled();
      expect(engine.camera.disable).not.toHaveBeenCalled();
    });

    it('microphone.toggle() calls engine.microphone.toggle(), not enable()/disable()', () => {
      const service = new PurpleCallioService();
      service.configure(baseConfig);
      const engine = latestEngine();

      service.microphone.toggle();

      expect(engine.microphone.toggle).toHaveBeenCalledTimes(1);
      expect(engine.microphone.enable).not.toHaveBeenCalled();
      expect(engine.microphone.disable).not.toHaveBeenCalled();
    });

    it('camera.enable()/disable() still delegate to the matching engine method', () => {
      const service = new PurpleCallioService();
      service.configure(baseConfig);
      const engine = latestEngine();

      service.camera.enable();
      service.camera.disable();

      expect(engine.camera.enable).toHaveBeenCalledTimes(1);
      expect(engine.camera.disable).toHaveBeenCalledTimes(1);
      expect(engine.camera.toggle).not.toHaveBeenCalled();
    });

    it('microphone.enable()/disable() still delegate to the matching engine method', () => {
      const service = new PurpleCallioService();
      service.configure(baseConfig);
      const engine = latestEngine();

      service.microphone.enable();
      service.microphone.disable();

      expect(engine.microphone.enable).toHaveBeenCalledTimes(1);
      expect(engine.microphone.disable).toHaveBeenCalledTimes(1);
      expect(engine.microphone.toggle).not.toHaveBeenCalled();
    });
  });

  it('screenShare.start()/stop() delegate to the engine', async () => {
    const service = new PurpleCallioService();
    service.configure(baseConfig);
    const engine = latestEngine();

    await service.screenShare.start();
    await service.screenShare.stop();

    expect(engine.screenShare.start).toHaveBeenCalledTimes(1);
    expect(engine.screenShare.stop).toHaveBeenCalledTimes(1);
  });
});
