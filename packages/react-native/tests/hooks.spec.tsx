import React from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-webrtc', () => import('./mocks/react-native-webrtc'));
vi.mock('@purplecallio/sdk', async () => {
  const mod = await import('./fake-meeting');
  return { PurpleCallioMeeting: mod.FakeMeeting };
});

// `vi.mock` factories are hoisted above all other code in this file, so the
// mock object they return must be created via `vi.hoisted` rather than a
// plain top-level `const` (which would still be in the temporal dead zone
// when the hoisted factory runs).
const mockNetInfo = vi.hoisted(() => ({
  isSupported: vi.fn(() => false),
  subscribe: vi.fn((_listener: (s: unknown) => void) => () => {}),
  fetch: vi.fn(async () => null as unknown),
}));
vi.mock('../src/optional/netInfo', () => ({ netInfo: mockNetInfo }));

import { FakeMeeting } from './fake-meeting';
import { mediaDevices } from './mocks/react-native-webrtc';
import { PurpleCallioProvider } from '../src/context';
import { useConnection, useDevices, useNetworkState, useParticipant, useParticipants } from '../src/hooks';

/** Generic probe: renders a hook and reports its latest return value. */
function probeHook<T>(useHook: () => T, wrapper?: (children: React.ReactNode) => React.ReactElement) {
  const values: T[] = [];
  function Probe() {
    values.push(useHook());
    return null;
  }
  const element = wrapper ? wrapper(<Probe />) : <Probe />;
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(element);
  });
  return {
    renderer,
    latest: () => values[values.length - 1],
    count: () => values.length,
  };
}

const baseProps = { token: 't', callId: 'c', signalUrl: 'wss://example.com' };
const withProvider = (children: React.ReactNode) => (
  <PurpleCallioProvider {...baseProps}>{children}</PurpleCallioProvider>
);

describe('useDevices', () => {
  it('splits enumerateDevices() output into audioInputs/videoInputs and keeps audioOutputs empty', async () => {
    mediaDevices.enumerateDevices.mockResolvedValueOnce([
      { deviceId: 'mic-1', kind: 'audioinput', label: 'Built-in mic' },
      { deviceId: 'cam-front', kind: 'videoinput', label: 'Front camera' },
      { deviceId: 'cam-back', kind: 'videoinput', label: 'Back camera' },
      // Even if the underlying platform reported one, we never surface it:
      { deviceId: 'speaker-1', kind: 'audiooutput', label: 'Speaker' },
    ]);

    const { latest } = probeHook(() => useDevices());

    await act(async () => {
      await Promise.resolve();
    });

    expect(latest().audioInputs).toEqual([{ deviceId: 'mic-1', kind: 'audioinput', label: 'Built-in mic' }]);
    expect(latest().videoInputs).toHaveLength(2);
    expect(latest().audioOutputs).toEqual([]);
    expect(latest().loading).toBe(false);
  });
});

describe('useNetworkState', () => {
  it('reports { supported: false } when netinfo is not installed', () => {
    mockNetInfo.isSupported.mockReturnValue(false);
    const { latest } = probeHook(() => useNetworkState());

    expect(latest()).toEqual({
      supported: false,
      isConnected: null,
      isInternetReachable: null,
      type: null,
    });
    expect(mockNetInfo.subscribe).not.toHaveBeenCalled();
  });

  it('subscribes and reflects state when netinfo is installed', async () => {
    mockNetInfo.isSupported.mockReturnValue(true);
    let capturedListener: ((s: unknown) => void) | undefined;
    mockNetInfo.subscribe.mockImplementation((listener: (s: unknown) => void) => {
      capturedListener = listener;
      return () => {};
    });
    mockNetInfo.fetch.mockResolvedValue({ type: 'wifi', isConnected: true, isInternetReachable: true });

    const { latest } = probeHook(() => useNetworkState());

    await act(async () => {
      await Promise.resolve();
    });

    expect(latest()).toEqual({ supported: true, isConnected: true, isInternetReachable: true, type: 'wifi' });

    act(() => {
      capturedListener?.({ type: 'none', isConnected: false, isInternetReachable: false });
    });

    expect(latest()).toEqual({ supported: true, isConnected: false, isInternetReachable: false, type: 'none' });
  });
});

describe('useParticipants / useParticipant / useConnection', () => {
  it('reflect the engine roster and connection state, and useParticipant looks up by id', async () => {
    FakeMeeting.instances.length = 0;

    const { latest: connectionState } = probeHook(() => useConnection(), withProvider);
    expect(connectionState()).toBe('idle');

    const engine = FakeMeeting.instances[0];
    act(() => engine.setConnectionState('joined'));
    expect(connectionState()).toBe('joined');

    const { latest: participants } = probeHook(() => useParticipants(), withProvider);
    const roster = [{ participantId: 'a', role: 'CALLER' }];
    const rosterEngine = FakeMeeting.instances[FakeMeeting.instances.length - 1];
    // The context only refreshes participants off the 'participant.*'
    // signaling events (mirroring @purplecallio/react), not off
    // onParticipantsChanged directly — so the fake engine's internal roster
    // must be set *and* a matching event emitted.
    act(() => {
      rosterEngine.setParticipants(roster);
      rosterEngine.emit('participant.joined', { participantId: 'a' });
    });
    expect(participants()).toEqual(roster);

    const { latest: found } = probeHook(() => useParticipant('a'), withProvider);
    const foundEngine = FakeMeeting.instances[FakeMeeting.instances.length - 1];
    act(() => {
      foundEngine.setParticipants(roster);
      foundEngine.emit('participant.joined', { participantId: 'a' });
    });
    expect(found()).toEqual(roster[0]);
  });
});
