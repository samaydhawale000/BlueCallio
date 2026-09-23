import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { ConnectionState, Participant, PurpleCallioMeeting } from '@purplecallio/sdk';

import { PurpleCallioUnsupportedFeatureError } from './errors';
import { inCallManager } from './optional/inCallManager';
import { requestMediaPermissions } from './permissions';

export interface PurpleCallioProviderProps {
  token: string;
  callId: string;
  signalUrl: string;
  /** Default: video on. */
  video?: boolean;
  /** Default: audio on. */
  audio?: boolean;
  /** Custom ICE servers passed through to the engine. */
  iceServers?: RTCIceServer[];
  /** Override the backend by setting this to true — only custom servers are used. */
  overrideIceServers?: boolean;
  /**
   * Automatically disable the camera when the app is backgrounded and
   * restore it on foreground (video calls shouldn't keep sending camera
   * frames while backgrounded; some app stores flag this too). Default:
   * true. Set to false to manage this yourself.
   */
  pauseVideoInBackground?: boolean;
  onStateChange?: (state: MeetingContextValue) => void;
  children: React.ReactNode;
}

export interface ScreenShareControls {
  /**
   * Always rejects with {@link PurpleCallioUnsupportedFeatureError} on
   * React Native. Screen sharing requires native platform integration
   * (iOS Broadcast Upload Extension / Android MediaProjection) that this
   * package does not implement. See README "Known Limitations".
   */
  start: () => Promise<never>;
  /** No-op — screen sharing can never be active on this platform. */
  stop: () => void;
  /** Always returns `false`. */
  isActive: () => boolean;
}

export interface MeetingContextValue {
  engine: PurpleCallioMeeting | null;
  callId: string;
  participantId: string | null;
  connectionState: ConnectionState;
  participants: Participant[];
  media: {
    camera: boolean;
    microphone: boolean;
    screenShare: boolean;
  };
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  /** `null` until `requestMediaPermissions()` has resolved at least once. */
  permissionsGranted: boolean | null;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  enableCamera: () => void;
  disableCamera: () => void;
  enableMicrophone: () => void;
  disableMicrophone: () => void;
  screenShare: ScreenShareControls;
  /**
   * Switches between the front and back camera. This is a mobile-only
   * concept with no web equivalent (there is no `switchCamera()` on
   * `@purplecallio/react`) — it operates directly on the local video track
   * via `react-native-webrtc`'s native camera-switch API.
   */
  switchCamera: () => void;
  /**
   * Force call audio to the loudspeaker (`true`) or the earpiece/default
   * route (`false`). Requires the optional `react-native-incall-manager`
   * peer dependency to be installed — a no-op (with a one-time console
   * warning) otherwise.
   */
  setSpeakerphoneOn: (enabled: boolean) => void;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

export function useMeetingContext(): MeetingContextValue {
  const ctx = useContext(MeetingContext);
  if (!ctx) {
    throw new Error('useMeeting* hooks must be used within a <PurpleCallioProvider>');
  }
  return ctx;
}

const SCREEN_SHARE_UNSUPPORTED_MESSAGE =
  'Screen sharing is not yet available on React Native — it requires native platform ' +
  'integration (iOS Broadcast Upload Extension / Android MediaProjection) not yet ' +
  'implemented in @purplecallio/react-native.';

export function PurpleCallioProvider({
  token,
  callId,
  signalUrl,
  video = true,
  audio = true,
  iceServers,
  overrideIceServers,
  pauseVideoInBackground = true,
  onStateChange,
  children,
}: PurpleCallioProviderProps) {
  const engineRef = useRef<PurpleCallioMeeting | null>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [media, setMedia] = useState({
    camera: video,
    microphone: audio,
    screenShare: false,
  });
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(null);

  // Create the engine once. @purplecallio/sdk's PurpleCallioMeeting is used
  // unmodified here — this package is purely a framework adapter (lifecycle,
  // permissions, rendering, audio routing), not a WebRTC/signaling
  // reimplementation.
  if (!engineRef.current) {
    engineRef.current = new PurpleCallioMeeting({
      token,
      callId,
      signalUrl,
      video,
      audio,
      iceServers,
      overrideIceServers,
    });
  }
  const engine = engineRef.current;

  // Subscribe to engine events.
  useEffect(() => {
    if (!engine) return;

    const offs: Array<() => void> = [];

    offs.push(
      engine.on('connected', (p) => {
        setConnectionState('connected');
        setParticipantId(p.participantId);
      }),
    );
    offs.push(engine.on('reconnected', () => setConnectionState('connected')));
    offs.push(engine.on('disconnected', () => setConnectionState('disconnected')));
    offs.push(engine.on('remote.stream', (stream) => setRemoteStream(stream)));
    offs.push(engine.on('remote.stream.ended', () => setRemoteStream(null)));
    offs.push(engine.on('participant.joined', () => setParticipants(engine.participants())));
    offs.push(engine.on('participant.left', () => setParticipants(engine.participants())));
    offs.push(engine.on('participant.updated', () => setParticipants(engine.participants())));
    offs.push(engine.on('camera.enabled', () => setMedia((m) => ({ ...m, camera: true }))));
    offs.push(engine.on('camera.disabled', () => setMedia((m) => ({ ...m, camera: false }))));
    offs.push(engine.on('microphone.enabled', () => setMedia((m) => ({ ...m, microphone: true }))));
    offs.push(engine.on('microphone.disabled', () => setMedia((m) => ({ ...m, microphone: false }))));

    // Also poll onConnectionStateChanged directly so states the engine sets
    // without a matching named event (e.g. 'connecting', 'joining') are
    // reflected too — we pass through whatever the core engine reports,
    // faithfully, rather than inventing our own state machine on top of it.
    offs.push(engine.onConnectionStateChanged((state) => setConnectionState(state as ConnectionState)));

    return () => {
      offs.forEach((off) => off());
    };
  }, [engine]);

  // Sync localStream from engine when it becomes available. The engine
  // doesn't emit a dedicated "local stream ready" event, so we poll its
  // getter — mirrors the same pattern @purplecallio/react uses.
  useEffect(() => {
    if (!engine) return;
    const t = setInterval(() => {
      const stream = engine.localStreamRef;
      if (stream !== localStream) setLocalStream(stream);
    }, 250);
    return () => clearInterval(t);
  }, [engine, localStream]);

  // Foreground/background lifecycle: pause the camera while backgrounded.
  const cameraPausedByBackgroundRef = useRef(false);
  useEffect(() => {
    if (!engine || !pauseVideoInBackground) return;

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        if (engine.camera.isEnabled()) {
          cameraPausedByBackgroundRef.current = true;
          engine.camera.disable();
        }
      } else if (nextState === 'active') {
        if (cameraPausedByBackgroundRef.current) {
          cameraPausedByBackgroundRef.current = false;
          engine.camera.enable();
        }
      }
    });

    return () => subscription.remove();
  }, [engine, pauseVideoInBackground]);

  // Cleanup on unmount: the engine already stops local tracks and closes the
  // peer connection in cleanupMedia()/leave(). We additionally make sure our
  // own AppState listener (above, via its own effect cleanup) and
  // InCallManager are torn down.
  useEffect(() => {
    return () => {
      inCallManager.stop();
    };
  }, []);

  const join = useCallback(async () => {
    if (!engine) return;
    const granted = await requestMediaPermissions({ audio, video });
    setPermissionsGranted(granted);
    if (!granted) {
      throw new Error(
        'PurpleCallio: required media permissions were not granted. Camera/microphone ' +
          'access must be allowed (see README for Android manifest / iOS Info.plist setup) ' +
          'before joining a call.',
      );
    }
    await engine.join();
    inCallManager.start(video ? 'video' : 'audio');
  }, [engine, audio, video]);

  const leave = useCallback(async () => {
    if (!engine) return;
    inCallManager.stop();
    await engine.leave();
    setConnectionState('disconnected');
    setRemoteStream(null);
  }, [engine]);

  const toggleCamera = useCallback(() => engine?.camera.toggle(), [engine]);
  const toggleMicrophone = useCallback(() => engine?.microphone.toggle(), [engine]);
  const enableCamera = useCallback(() => engine?.camera.enable(), [engine]);
  const disableCamera = useCallback(() => engine?.camera.disable(), [engine]);
  const enableMicrophone = useCallback(() => engine?.microphone.enable(), [engine]);
  const disableMicrophone = useCallback(() => engine?.microphone.disable(), [engine]);

  const screenShare = useMemo<ScreenShareControls>(
    () => ({
      start: () => Promise.reject(new PurpleCallioUnsupportedFeatureError(SCREEN_SHARE_UNSUPPORTED_MESSAGE)),
      stop: () => {},
      isActive: () => false,
    }),
    [],
  );

  const switchCamera = useCallback(() => {
    const stream = engine?.localStreamRef;
    const videoTrack = stream?.getVideoTracks?.()[0];
    // `_switchCamera` is react-native-webrtc's native camera-switch API. It
    // isn't part of the standard MediaStreamTrack type, hence the cast.
    (videoTrack as unknown as { _switchCamera?: () => void } | undefined)?._switchCamera?.();
  }, [engine]);

  const setSpeakerphoneOn = useCallback((enabled: boolean) => {
    inCallManager.setSpeakerphoneOn(enabled);
  }, []);

  const value = useMemo<MeetingContextValue>(
    () => ({
      engine,
      callId,
      participantId,
      connectionState,
      participants,
      media,
      remoteStream,
      localStream,
      permissionsGranted,
      join,
      leave,
      toggleCamera,
      toggleMicrophone,
      enableCamera,
      disableCamera,
      enableMicrophone,
      disableMicrophone,
      screenShare,
      switchCamera,
      setSpeakerphoneOn,
    }),
    [
      engine,
      callId,
      participantId,
      connectionState,
      participants,
      media,
      remoteStream,
      localStream,
      permissionsGranted,
      join,
      leave,
      toggleCamera,
      toggleMicrophone,
      enableCamera,
      disableCamera,
      enableMicrophone,
      disableMicrophone,
      screenShare,
      switchCamera,
      setSpeakerphoneOn,
    ],
  );

  useEffect(() => {
    onStateChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, onStateChange]);

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
}
