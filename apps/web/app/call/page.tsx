'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { socket } from '../lib/socket';

// ── Types ─────────────────────────────────────────────────

type CallState =
  | 'connecting'
  | 'waiting'
  | 'incoming'
  | 'in-call'
  | 'rejected'
  | 'missed'
  | 'ended'
  | 'error';

interface IncomingCallData {
  callId: string;
  callerId: string;
  type: 'AUDIO' | 'VIDEO';
}

interface Branding {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  theme: 'LIGHT' | 'DARK';
  waitingRoom: boolean;
}

interface DeviceInfo {
  deviceId: string;
  kind: MediaDeviceKind;
  label: string;
}

const DEFAULT_BRANDING: Branding = {
  companyName: 'BlueJoinet',
  logoUrl: null,
  primaryColor: '#2563EB',
  theme: 'DARK',
  waitingRoom: false,
};

// ── Helpers ───────────────────────────────────────────────

function Avatar({ id, size = 64, color }: { id: string; size?: number; color?: string }) {
  const initials = id.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#1E2D50',
        border: `2px solid ${color ?? '#2563EB'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.35,
        fontFamily: 'ui-monospace, monospace',
        color: '#94A3B8',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function useDurationTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      setSeconds(0);
      ref.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [active]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function useDeviceEnumerate() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(
        list.map((d) => ({ deviceId: d.deviceId, kind: d.kind, label: d.label })),
      );
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const audioInputs = devices.filter((d) => d.kind === 'audioinput');
  const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
  const videoInputs = devices.filter((d) => d.kind === 'videoinput');

  return { devices, audioInputs, audioOutputs, videoInputs, loading, refresh };
}

// ── Main ──────────────────────────────────────────────────

function CallPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const urlCallId = searchParams.get('callId');

  const [state, setState] = useState<CallState>('connecting');
  const [callType, setCallType] = useState<'AUDIO' | 'VIDEO'>('VIDEO');
  const [incomingData, setIncomingData] = useState<IncomingCallData | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [showDevices, setShowDevices] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState({ audio: '', video: '' });
  const [selfName, setSelfName] = useState('You');

  const deviceState = useDeviceEnumerate();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const stateRef = useRef<CallState>('connecting');

  const duration = useDurationTimer(state === 'in-call');
  const isDark = branding.theme === 'DARK';
  const primary = branding.primaryColor;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Fetch branding + participant identity.
  useEffect(() => {
    if (!token || !urlCallId) return;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/calls/${urlCallId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.branding) {
            setBranding({
              companyName: data.branding.companyName ?? 'BlueJoinet',
              logoUrl: data.branding.logoUrl ?? null,
              primaryColor: data.branding.primaryColor ?? '#2563EB',
              theme: data.branding.theme ?? 'DARK',
              waitingRoom: data.branding.waitingRoom ?? false,
            });
          }
          setSelfName(data.participantId ?? 'You');
        }
      } catch {
        // Fall back to defaults.
      }
    })();
  }, [token, urlCallId, apiUrl]);

  const fetchIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    try {
      const res = await fetch(`${apiUrl}/turn/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { iceServers: RTCIceServer[] };
      return data.iceServers;
    } catch {
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }, [token, apiUrl]);

  const initMedia = useCallback(async (video = true) => {
    const constraints: MediaStreamConstraints = { audio: true };
    if (video) {
      constraints.video = selectedDevice.video
        ? { deviceId: { exact: selectedDevice.video } }
        : true;
    }

    const [stream, iceServers] = await Promise.all([
      navigator.mediaDevices.getUserMedia(constraints),
      fetchIceServers(),
    ]);
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const pc = new RTCPeerConnection({ iceServers });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (event) => {
      const s = event.streams[0];
      setRemoteStream(s);
      setHasRemoteVideo(s.getVideoTracks().some((t) => t.enabled));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit('ice-candidate', { candidate: event.candidate });
    };

    pcRef.current = pc;
  }, [selectedDevice.video, fetchIceServers]);

  const createOffer = useCallback(async () => {
    if (!pcRef.current) return;
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socket.emit('offer', { offer });
  }, []);

  const cleanup = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    screenStreamRef.current = null;
  }, []);

  useEffect(() => {
    if (!token || !urlCallId) {
      setState('error');
      return;
    }

    socket.on('incoming-call', (data: IncomingCallData) => {
      setIncomingData(data);
      setCallType(data.type);
      setState('incoming');
    });

    socket.on('call-accepted', async () => {
      await initMedia(callType === 'VIDEO');
      setState('in-call');
      await createOffer();
      socket.emit('call.started', { callId: urlCallId });
    });

socket.on('call-rejected', () => setState('rejected'));

    socket.on('call-missed', () => {
      if (stateRef.current === 'ended' || stateRef.current === 'missed') return;
      cleanup();
      setState('missed');
    });

    socket.on('offer', async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('answer', { answer });
    });

    socket.on('answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!pcRef.current) return;
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('call-ended', () => {
      if (stateRef.current === 'ended') return;
      cleanup();
      setState('ended');
    });

    socket.on('connected', () => {
      socket.emit('authenticate', { token });
    });

    socket.on('connect', () => {
      socket.emit(
        'authenticate',
        { token },
        (response: { success: boolean; role: string }) => {
          if (!response?.success) { setState('error'); return; }
          if (response.role === 'CALLER') setState('waiting');
        },
      );
    });

    socket.connect();

    return () => {
['incoming-call', 'call-accepted', 'call-rejected', 'call-missed', 'offer', 'answer', 'ice-candidate', 'call-ended', 'connected', 'connect']
        .forEach((e) => socket.off(e));
      socket.disconnect();
      cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Apply theme background.
  useEffect(() => {
    document.documentElement.style.background = isDark ? '#060A17' : '#F1F5F9';
    return () => { document.documentElement.style.background = ''; };
  }, [isDark]);

  async function sessionPost(path: string) {
    return fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function acceptCall() {
    if (!incomingData) return;
    await initMedia(incomingData.type === 'VIDEO');
    setCallType(incomingData.type);
    await sessionPost(`/calls/${incomingData.callId}/accept`);
    await sessionPost(`/calls/${incomingData.callId}/join`);
    setState('in-call');
    socket.emit('call.started', { callId: incomingData.callId });
  }

  async function rejectCall() {
    if (!incomingData) return;
    await sessionPost(`/calls/${incomingData.callId}/reject`);
    setState('rejected');
  }

  async function endCall() {
    if (!urlCallId) return;
    socket.emit('call.ended', { callId: urlCallId });
    socket.emit('call-ended');
    await sessionPost(`/calls/${urlCallId}/leave`).catch(() => {});
    await sessionPost(`/calls/${urlCallId}/end`).catch(() => {});
    cleanup();
    setState('ended');
  }

  function toggleMute() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
    socket.emit(track.enabled ? 'microphone.enabled' : 'microphone.disabled', {
      callId: urlCallId,
    });
  }

  function toggleVideo() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
    socket.emit(track.enabled ? 'camera.enabled' : 'camera.disabled', {
      callId: urlCallId,
    });
  }

  async function startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenStreamRef.current = screenStream;

      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);

      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      screenTrack.onended = () => stopScreenShare();

      setIsScreenSharing(true);
      socket.emit('screenShare.started', { callId: urlCallId });
    } catch {
      // User cancelled the picker.
    }
  }

  async function stopScreenShare() {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
    if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setIsScreenSharing(false);
    socket.emit('screenShare.stopped', { callId: urlCallId });
  }

  function selectDevice(kind: 'audio' | 'video', deviceId: string) {
    setSelectedDevice((prev) => ({ ...prev, [kind]: deviceId }));
  }

  // ── Shared screen shell ─────────────────────────────────

  const shellBg = isDark ? '#060A17' : '#F1F5F9';
  const surfaceBg = isDark ? '#0D1425' : '#FFFFFF';
  const borderColor = isDark ? '#1A2240' : '#E2E8F0';
  const textPrimary = isDark ? '#FFFFFF' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';

  function Screen({ children }: { children: React.ReactNode }) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: shellBg }}
      >
        <div className="flex flex-col items-center text-center">
          {children}
        </div>
        <div className="absolute bottom-6 flex items-center gap-2">
          {branding.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt={branding.companyName} style={{ height: 18 }} />
          )}
          <span className="font-mono text-xs" style={{ color: isDark ? '#334155' : '#94A3B8' }}>
            {branding.companyName}
          </span>
        </div>
      </div>
    );
  }

  function Spinner() {
    return (
      <div
        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: primary, borderTopColor: 'transparent' }}
      />
    );
  }

  // ── State screens ────────────────────────────────────────

  if (!token || !urlCallId || state === 'error') {
    return (
      <Screen>
        <p className="text-sm" style={{ color: textSecondary }}>
          Invalid or expired call link.
        </p>
        <p className="text-xs mt-2" style={{ color: isDark ? '#334155' : '#94A3B8' }}>
          Contact the sender for a new link.
        </p>
      </Screen>
    );
  }

  if (state === 'connecting') {
    return (
      <Screen>
        <Spinner />
        <p className="text-sm mt-5" style={{ color: textSecondary }}>Connecting…</p>
      </Screen>
    );
  }

  if (state === 'waiting') {
    return (
      <Screen>
        <div className="relative mb-6">
          <div
            className="w-20 h-20 rounded-full animate-pulse"
            style={{ background: surfaceBg, border: `2px solid ${primary}` }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center font-mono text-xs"
            style={{ color: primary }}
          >
            …
          </span>
        </div>
        <p className="font-medium mb-1" style={{ color: textPrimary }}>Waiting for answer</p>
        <p className="text-sm" style={{ color: textSecondary }}>
          The other participant will join shortly
        </p>
        {branding.waitingRoom && (
          <div className="mt-8 w-full max-w-xs" style={{ background: surfaceBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: 16 }}>
            <p className="text-xs font-semibold mb-3" style={{ color: textSecondary }}>Device setup</p>
            <div className="flex flex-col gap-3">
              <label className="text-xs" style={{ color: textSecondary }}>
                Microphone
                <select
                  value={selectedDevice.audio}
                  onChange={(e) => selectDevice('audio', e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg text-sm"
                  style={{ background: shellBg, color: textPrimary, border: `1px solid ${borderColor}` }}
                >
                  <option value="">Default</option>
                  {deviceState.audioInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 4)}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs" style={{ color: textSecondary }}>
                Camera
                <select
                  value={selectedDevice.video}
                  onChange={(e) => selectDevice('video', e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg text-sm"
                  style={{ background: shellBg, color: textPrimary, border: `1px solid ${borderColor}` }}
                >
                  <option value="">Default</option>
                  {deviceState.videoInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 4)}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </Screen>
    );
  }

  if (state === 'incoming') {
    return (
      <Screen>
        <div className="mb-6">
          <Avatar id={incomingData?.callerId ?? '??'} size={80} color={primary} />
        </div>
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: textSecondary }}>
          Incoming {incomingData?.type === 'VIDEO' ? 'video' : 'audio'} call
        </p>
        <p className="text-2xl font-semibold mb-10" style={{ color: textPrimary }}>
          {incomingData?.callerId}
        </p>
        <div className="flex gap-8">
          <button
            onClick={rejectCall}
            style={{ background: '#3F1515' }}
            className="w-16 h-16 rounded-full flex items-center justify-center hover:brightness-110 transition-all"
            aria-label="Decline"
          >
            <PhoneDownIcon />
          </button>
          <button
            onClick={acceptCall}
            style={{ background: '#0F3D1F' }}
            className="w-16 h-16 rounded-full flex items-center justify-center hover:brightness-110 transition-all"
            aria-label="Accept"
          >
            <PhoneIcon />
          </button>
        </div>
      </Screen>
    );
  }

if (state === 'rejected') {
    return (
      <Screen>
        <p style={{ color: textSecondary }}>Call declined.</p>
      </Screen>
    );
  }

  if (state === 'missed') {
    return (
      <Screen>
        <p className="font-medium mb-1" style={{ color: textPrimary }}>No answer</p>
        <p className="text-sm" style={{ color: textSecondary }}>
          The other participant didn't answer.
        </p>
      </Screen>
    );
  }

  if (state === 'ended') {
    return (
      <Screen>
        <p className="font-medium mb-1" style={{ color: textPrimary }}>Call ended</p>
        <p className="text-sm" style={{ color: textSecondary }}>{duration}</p>
      </Screen>
    );
  }

  // ── In-call ──────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: shellBg }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <span className="flex items-center gap-2 font-mono text-xs tracking-wider" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
          {branding.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt={branding.companyName} style={{ height: 16 }} />
          )}
          {branding.companyName}
        </span>
        <span className="font-mono text-sm tabular-nums" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
          {duration}
        </span>
      </div>

      {/* Video area */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        {callType === 'VIDEO' && hasRemoteVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ background: surfaceBg }}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-4"
            style={{ background: surfaceBg }}
          >
            <Avatar id={incomingData?.callerId ?? 'user'} size={96} color={primary} />
            <p className="text-sm" style={{ color: textSecondary }}>
              {callType === 'AUDIO' ? 'Audio call' : 'Camera off'}
            </p>
          </div>
        )}

        {/* Local PiP */}
        {callType === 'VIDEO' && (
          <div
            className="absolute bottom-4 right-4 overflow-hidden"
            style={{
              width: 160,
              height: 112,
              border: `1px solid ${borderColor}`,
              background: surfaceBg,
              borderRadius: 8,
            }}
          >
            {isVideoOff ? (
              <div className="w-full h-full flex items-center justify-center">
                <Avatar id="me" size={40} color={primary} />
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Device selector overlay */}
        {showDevices && (
          <div
            className="absolute top-4 right-4 rounded-xl p-4"
            style={{
              background: surfaceBg,
              border: `1px solid ${borderColor}`,
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              zIndex: 20,
              width: 240,
            }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: textPrimary }}>
              Devices
            </p>
            <div className="flex flex-col gap-3">
              <label className="text-xs" style={{ color: textSecondary }}>
                Microphone
                <select
                  value={selectedDevice.audio}
                  onChange={(e) => selectDevice('audio', e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg text-sm"
                  style={{ background: shellBg, color: textPrimary, border: `1px solid ${borderColor}` }}
                >
                  <option value="">Default</option>
                  {deviceState.audioInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 4)}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs" style={{ color: textSecondary }}>
                Speaker
                <select
                  className="w-full mt-1 px-2 py-1.5 rounded-lg text-sm"
                  style={{ background: shellBg, color: textPrimary, border: `1px solid ${borderColor}` }}
                >
                  {deviceState.audioOutputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Speaker ${d.deviceId.slice(0, 4)}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs" style={{ color: textSecondary }}>
                Camera
                <select
                  value={selectedDevice.video}
                  onChange={(e) => selectDevice('video', e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg text-sm"
                  style={{ background: shellBg, color: textPrimary, border: `1px solid ${borderColor}` }}
                >
                  <option value="">Default</option>
                  {deviceState.videoInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 4)}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        className="flex justify-center items-center gap-3 sm:gap-4 px-4 sm:px-6 py-5 flex-wrap"
        style={{ borderTop: `1px solid ${borderColor}` }}
      >
        <ControlButton
          active={isMuted}
          activeColor="#3F1515"
          onClick={toggleMute}
          label={isMuted ? 'Unmute' : 'Mute'}
          dark={isDark}
          borderColor={borderColor}
        >
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </ControlButton>

        {callType === 'VIDEO' && (
          <ControlButton
            active={isVideoOff}
            activeColor="#3F1515"
            onClick={toggleVideo}
            label={isVideoOff ? 'Camera on' : 'Camera off'}
            dark={isDark}
            borderColor={borderColor}
          >
            {isVideoOff ? <VideoOffIcon /> : <VideoIcon />}
          </ControlButton>
        )}

        {callType === 'VIDEO' && (
          <ControlButton
            active={isScreenSharing}
            activeColor="#1E3A5F"
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            label={isScreenSharing ? 'Stop share' : 'Share screen'}
            dark={isDark}
            borderColor={borderColor}
          >
            <ScreenShareIcon active={isScreenSharing} />
          </ControlButton>
        )}

        <ControlButton
          active={showDevices}
          activeColor="#1E3A5F"
          onClick={() => setShowDevices((s) => !s)}
          label="Devices"
          dark={isDark}
          borderColor={borderColor}
        >
          <SettingsIcon />
        </ControlButton>

        <ControlButton
          active
          activeColor="#7F1D1D"
          onClick={endCall}
          label="End call"
          size={56}
          dark={isDark}
          borderColor={borderColor}
        >
          <PhoneDownIcon />
        </ControlButton>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function ControlButton({
  children,
  active,
  activeColor,
  onClick,
  label,
  size = 48,
  dark = true,
  borderColor = '#1A2240',
}: {
  children: React.ReactNode;
  active: boolean;
  activeColor: string;
  onClick: () => void;
  label: string;
  size?: number;
  dark?: boolean;
  borderColor?: string;
}) {
  const idleBg = dark ? '#1A2240' : '#E2E8F0';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        aria-label={label}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: active ? activeColor : idleBg,
          border: '1px solid',
          borderColor: active ? 'transparent' : borderColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
          cursor: 'pointer',
        }}
      >
        {children}
      </button>
      <span className="text-xs" style={{ color: dark ? '#64748B' : '#94A3B8' }}>{label}</span>
    </div>
  );
}

// ── Icons (inline SVG, no external deps) ─────────────────

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function VideoOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34" />
      <polygon points="23 7 16 12 23 17 23 7" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 5.51 5.51l1.27-.84a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.2 16l.72.92z" />
    </svg>
  );
}

function PhoneDownIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-.85a2 2 0 0 1 2.11-.43 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.44-2.47M6.51 6.51A19.5 19.5 0 0 0 3.07 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 1.82 1.2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.44 2.08L6.51 8.8" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function ScreenShareIcon({ active }: { active: boolean }) {
  const stroke = active ? '#60A5FA' : '#94A3B8';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <polyline points="8 21 12 17 16 21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// ── Page shell ─────────────────────────────────────────────

export default function CallPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#060A17' }}
        >
          <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <CallPageContent />
    </Suspense>
  );
}

