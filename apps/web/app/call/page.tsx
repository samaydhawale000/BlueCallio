'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { socket } from '../lib/socket';

type CallState =
  | 'connecting'
  | 'waiting'
  | 'incoming'
  | 'in-call'
  | 'rejected'
  | 'ended'
  | 'error';

interface IncomingCallData {
  callId: string;
  callerId: string;
  type: 'AUDIO' | 'VIDEO';
}

function Avatar({ id, size = 64 }: { id: string; size?: number }) {
  const initials = id.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#1E2D50',
        border: '2px solid #2563EB',
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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const stateRef = useRef<CallState>('connecting');

  const duration = useDurationTimer(state === 'in-call');

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const fetchIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
      const res = await fetch(`${apiUrl}/turn/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { iceServers: RTCIceServer[] };
      return data.iceServers;
    } catch {
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }, [token]);

  const initMedia = useCallback(async (video = true) => {
    const [stream, iceServers] = await Promise.all([
      navigator.mediaDevices.getUserMedia({ audio: true, video }),
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
  }, []);

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
    });

    socket.on('call-rejected', () => setState('rejected'));

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
      ['incoming-call', 'call-accepted', 'call-rejected', 'offer', 'answer', 'ice-candidate', 'call-ended', 'connect']
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

  async function sessionPost(path: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
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
    setState('in-call');
  }

  async function rejectCall() {
    if (!incomingData) return;
    await sessionPost(`/calls/${incomingData.callId}/reject`);
    setState('rejected');
  }

  async function endCall() {
    if (!urlCallId) return;
    socket.emit('call-ended');
    await sessionPost(`/calls/${urlCallId}/end`).catch(() => {});
    cleanup();
    setState('ended');
  }

  function toggleMute() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  }

  function toggleVideo() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
  }

  async function startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenStreamRef.current = screenStream;

      // Replace video sender track with screen track
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);

      // Show screen in local PiP
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

      // When user stops via browser's native "Stop sharing" button
      screenTrack.onended = () => stopScreenShare();

      setIsScreenSharing(true);
    } catch {
      // User cancelled the picker — do nothing
    }
  }

  async function stopScreenShare() {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    // Switch sender back to camera track
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
    if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);

    // Restore camera in local PiP
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setIsScreenSharing(false);
  }

  // ── State screens ──────────────────────────────────────────

  if (!token || !urlCallId || state === 'error') {
    return (
      <Screen>
        <p className="text-slate-400 text-sm">Invalid or expired call link.</p>
        <p className="text-slate-600 text-xs mt-2">
          Contact the sender for a new link.
        </p>
      </Screen>
    );
  }

  if (state === 'connecting') {
    return (
      <Screen>
        <Spinner />
        <p className="text-slate-400 text-sm mt-5">Connecting…</p>
      </Screen>
    );
  }

  if (state === 'waiting') {
    return (
      <Screen>
        <div className="relative mb-6">
          <div
            className="w-20 h-20 rounded-full border-2 border-blue-600 animate-pulse"
            style={{ background: '#1E2D50' }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center font-mono text-blue-400 text-xs"
          >
            …
          </span>
        </div>
        <p className="text-white font-medium mb-1">Waiting for answer</p>
        <p className="text-slate-500 text-sm">
          The other participant will join shortly
        </p>
      </Screen>
    );
  }

  if (state === 'incoming') {
    return (
      <Screen>
        <div className="mb-6">
          <Avatar id={incomingData?.callerId ?? '??'} size={80} />
        </div>
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
          Incoming {incomingData?.type === 'VIDEO' ? 'video' : 'audio'} call
        </p>
        <p className="text-white text-2xl font-semibold mb-10">
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
        <p className="text-slate-400">Call declined.</p>
      </Screen>
    );
  }

  if (state === 'ended') {
    return (
      <Screen>
        <p className="text-white font-medium mb-1">Call ended</p>
        <p className="text-slate-500 text-sm">{duration}</p>
      </Screen>
    );
  }

  // ── In-call ────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#060A17' }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid #1A2240' }}
      >
        <span className="font-mono text-slate-500 text-xs tracking-wider">
          BlueCall
        </span>
        <span className="font-mono text-slate-400 text-sm tabular-nums">
          {duration}
        </span>
      </div>

      {/* Video area */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        {/* Remote */}
        {callType === 'VIDEO' && hasRemoteVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ background: '#0D1425' }}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-4"
            style={{ background: '#0D1425' }}
          >
            <Avatar id={incomingData?.callerId ?? 'user'} size={96} />
            <p className="text-slate-500 text-sm">
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
              border: '1px solid #1A2240',
              background: '#0D1425',
            }}
          >
            {isVideoOff ? (
              <div className="w-full h-full flex items-center justify-center">
                <Avatar id="me" size={40} />
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
      </div>

      {/* Controls */}
      <div
        className="flex justify-center items-center gap-4 px-6 py-5"
        style={{ borderTop: '1px solid #1A2240' }}
      >
        <ControlButton
          active={isMuted}
          activeColor="#3F1515"
          onClick={toggleMute}
          label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </ControlButton>

        {callType === 'VIDEO' && (
          <ControlButton
            active={isVideoOff}
            activeColor="#3F1515"
            onClick={toggleVideo}
            label={isVideoOff ? 'Camera on' : 'Camera off'}
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
          >
            <ScreenShareIcon active={isScreenSharing} />
          </ControlButton>
        )}

        <ControlButton
          active={true}
          activeColor="#7F1D1D"
          onClick={endCall}
          label="End call"
          size={56}
        >
          <PhoneDownIcon />
        </ControlButton>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#060A17' }}
    >
      <div className="flex flex-col items-center text-center px-6">
        {children}
      </div>
      <div className="absolute bottom-6">
        <span className="font-mono text-slate-700 text-xs">BlueCall</span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div
      className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"
    />
  );
}

function ControlButton({
  children,
  active,
  activeColor,
  onClick,
  label,
  size = 48,
}: {
  children: React.ReactNode;
  active: boolean;
  activeColor: string;
  onClick: () => void;
  label: string;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        aria-label={label}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: active ? activeColor : '#1A2240',
          border: '1px solid',
          borderColor: active ? 'transparent' : '#2D3F6B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
          cursor: 'pointer',
        }}
      >
        {children}
      </button>
      <span className="text-slate-600 text-xs">{label}</span>
    </div>
  );
}

// ── Icons (inline SVG, no external deps) ───────────────────

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
