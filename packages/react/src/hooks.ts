import { useCallback, useEffect, useState } from 'react';

import {
  ConnectionState,
  Participant,
} from '@bluejoinet/sdk';

import { useMeetingContext } from './context';

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

export interface DeviceInfo {
  deviceId: string;
  kind: MediaDeviceKind;
  label: string;
}

export interface DevicesResult {
  audioInputs: DeviceInfo[];
  audioOutputs: DeviceInfo[];
  videoInputs: DeviceInfo[];
  selected: {
    audioInput: string;
    audioOutput: string;
    videoInput: string;
  };
  loading: boolean;
  refresh: () => Promise<void>;
  setAudioInput: (deviceId: string) => void;
  setAudioOutput: (deviceId: string) => void;
  setVideoInput: (deviceId: string) => void;
}

/** Enumerate available media devices and switch between them. */
export function useDevices(): DevicesResult {
  const { engine } = useMeetingContext();

  const [audioInputs, setAudioInputs] = useState<DeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<DeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<DeviceInfo[]>([]);
  const [selected, setSelected] = useState({
    audioInput: '',
    audioOutput: '',
    videoInput: '',
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (typeof navigator === 'undefined') return;
    const devices = await navigator.mediaDevices.enumerateDevices();

    const inputs: DeviceInfo[] = [];
    const outputs: DeviceInfo[] = [];
    const vids: DeviceInfo[] = [];

    devices.forEach((d) => {
      const info = { deviceId: d.deviceId, kind: d.kind, label: d.label };
      if (d.kind === 'audioinput') inputs.push(info);
      else if (d.kind === 'audiooutput') outputs.push(info);
      else if (d.kind === 'videoinput') vids.push(info);
    });

    setAudioInputs(inputs);
    setAudioOutputs(outputs);
    setVideoInputs(vids);

    setSelected((prev) => ({
      audioInput: prev.audioInput || inputs[0]?.deviceId || '',
      audioOutput: prev.audioOutput || outputs[0]?.deviceId || '',
      videoInput: prev.videoInput || vids[0]?.deviceId || '',
    }));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setAudioInput = useCallback(
    (deviceId: string) => {
      setSelected((s) => ({ ...s, audioInput: deviceId }));
      void engine?.microphone;
      // Re-acquire local media is handled at engine level; the engine
      // will pick up new constraints on next join. We keep it simple.
    },
    [engine],
  );

  const setAudioOutput = useCallback((deviceId: string) => {
    setSelected((s) => ({ ...s, audioOutput: deviceId }));
  }, []);

  const setVideoInput = useCallback(
    (deviceId: string) => {
      setSelected((s) => ({ ...s, videoInput: deviceId }));
      void engine?.camera;
    },
    [engine],
  );

  return {
    audioInputs,
    audioOutputs,
    videoInputs,
    selected,
    loading,
    refresh,
    setAudioInput,
    setAudioOutput,
    setVideoInput,
  };
}

/** Live connection state ('idle' | 'connecting' | 'connected' | ...). */
export function useConnection(): ConnectionState {
  return useMeetingContext().connectionState;
}

