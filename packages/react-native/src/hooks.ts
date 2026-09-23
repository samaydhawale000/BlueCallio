import { useCallback, useEffect, useState } from 'react';
import { mediaDevices } from 'react-native-webrtc';

import { ConnectionState, Participant } from '@purplecallio/sdk';

import { useMeetingContext } from './context';
import { NetInfoStateLike, netInfo } from './optional/netInfo';

/** Access the full meeting state + controls. */
export function useMeeting() {
  return useMeetingContext();
}

/** Live list of participants (including yourself). */
export function useParticipants(): Participant[] {
  return useMeetingContext().participants;
}

/** Look up a single participant by id. */
export function useParticipant(participantId: string): Participant | undefined {
  const participants = useParticipants();
  return participants.find((p) => p.participantId === participantId);
}

/** Live connection state ('idle' | 'connecting' | 'connected' | ...), passed through verbatim from the engine. */
export function useConnection(): ConnectionState {
  return useMeetingContext().connectionState;
}

export interface DeviceInfo {
  deviceId: string;
  kind: string;
  label: string;
}

export interface DevicesResult {
  audioInputs: DeviceInfo[];
  videoInputs: DeviceInfo[];
  /**
   * Always empty. There is no meaningful `audiooutput` device-selection
   * concept on mobile the way there is on web — call audio routing
   * (speaker/earpiece/Bluetooth) is an OS-level concern, not a `deviceId`
   * you pick. Use `switchCamera()` (front/back camera) and
   * `setSpeakerphoneOn()` (speaker vs. earpiece) instead.
   */
  audioOutputs: DeviceInfo[];
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Enumerate available camera/microphone devices via
 * `react-native-webrtc`'s `mediaDevices.enumerateDevices()`.
 */
export function useDevices(): DevicesResult {
  const [audioInputs, setAudioInputs] = useState<DeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const devices = (await mediaDevices.enumerateDevices()) as Array<{
      deviceId: string;
      kind: string;
      label: string;
    }>;

    const inputs: DeviceInfo[] = [];
    const vids: DeviceInfo[] = [];

    devices.forEach((d) => {
      const info: DeviceInfo = { deviceId: d.deviceId, kind: d.kind, label: d.label };
      if (d.kind === 'audioinput') inputs.push(info);
      else if (d.kind === 'videoinput') vids.push(info);
    });

    setAudioInputs(inputs);
    setVideoInputs(vids);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    audioInputs,
    videoInputs,
    audioOutputs: [],
    loading,
    refresh,
  };
}

export interface NetworkState {
  /** `false` if `@react-native-community/netinfo` is not installed — see README. */
  supported: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
}

const UNSUPPORTED_STATE: NetworkState = {
  supported: false,
  isConnected: null,
  isInternetReachable: null,
  type: null,
};

/**
 * Surfaces device network connectivity via the optional
 * `@react-native-community/netinfo` peer dependency, for a consuming app's
 * own UI (e.g. an "you're offline" banner).
 *
 * This deliberately does NOT drive any reconnection logic — that's
 * core-SDK territory. The engine's own `connectionState()` already reports
 * `'reconnecting'`/`'disconnected'` transitions as the signaling layer sees
 * them; this hook is just a convenience for surfacing *why* that might be
 * happening.
 */
export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>(() =>
    netInfo.isSupported() ? { ...UNSUPPORTED_STATE, supported: true } : UNSUPPORTED_STATE,
  );

  useEffect(() => {
    if (!netInfo.isSupported()) return;

    const apply = (s: NetInfoStateLike) =>
      setState({
        supported: true,
        isConnected: s.isConnected,
        isInternetReachable: s.isInternetReachable,
        type: s.type,
      });

    netInfo.fetch().then((s) => s && apply(s));
    const unsubscribe = netInfo.subscribe(apply);
    return unsubscribe;
  }, []);

  return state;
}
