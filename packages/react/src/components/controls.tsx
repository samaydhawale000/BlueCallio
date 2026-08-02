import React from 'react';

import { useMeetingContext } from '../context';

// ── Shared button shell ───────────────────────────────────

export interface ControlButtonProps {
  label: string;
  active: boolean;
  activeColor?: string;
  onClick: () => void;
  disabled?: boolean;
  size?: number;
  children: React.ReactNode;
  title?: string;
}

export function ControlButton({
  label,
  active,
  activeColor = '#3F1515',
  onClick,
  disabled,
  size = 48,
  children,
  title,
}: ControlButtonProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title ?? label}
        aria-label={label}
        aria-pressed={active}
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
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {children}
      </button>
      <span style={{ color: '#64748B', fontSize: 11 }}>{label}</span>
    </div>
  );
}

// ── CameraButton ──────────────────────────────────────────

export interface CameraButtonProps {
  labelOn?: string;
  labelOff?: string;
  className?: string;
}

export function CameraButton({ labelOn = 'Camera off', labelOff = 'Camera on' }: CameraButtonProps) {
  const { media, toggleCamera } = useMeetingContext();
  const isOff = !media.camera;
  return (
    <ControlButton
      label={isOff ? labelOn : labelOff}
      active={isOff}
      onClick={toggleCamera}
      title={isOff ? 'Turn camera on' : 'Turn camera off'}
    >
      {isOff ? <VideoOffIcon /> : <VideoIcon />}
    </ControlButton>
  );
}

// ── MicrophoneButton ──────────────────────────────────────

export interface MicrophoneButtonProps {
  labelOn?: string;
  labelOff?: string;
}

export function MicrophoneButton({ labelOn = 'Unmute', labelOff = 'Mute' }: MicrophoneButtonProps) {
  const { media, toggleMicrophone } = useMeetingContext();
  const isMuted = !media.microphone;
  return (
    <ControlButton
      label={isMuted ? labelOn : labelOff}
      active={isMuted}
      onClick={toggleMicrophone}
      title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
    >
      {isMuted ? <MicOffIcon /> : <MicIcon />}
    </ControlButton>
  );
}

// ── ScreenShareButton ─────────────────────────────────────

export function ScreenShareButton() {
  const { media, toggleScreenShare } = useMeetingContext();
  const isSharing = media.screenShare;
  return (
    <ControlButton
      label={isSharing ? 'Stop share' : 'Share screen'}
      active={isSharing}
      activeColor="#1E3A5F"
      onClick={toggleScreenShare}
      title={isSharing ? 'Stop sharing screen' : 'Start sharing screen'}
    >
      <ScreenShareIcon active={isSharing} />
    </ControlButton>
  );
}

// ── LeaveButton ───────────────────────────────────────────

export interface LeaveButtonProps {
  label?: string;
  onLeave?: () => void;
  size?: number;
}

export function LeaveButton({ label = 'End call', onLeave, size = 56 }: LeaveButtonProps) {
  const { leave } = useMeetingContext();

  async function handleClick() {
    await leave();
    onLeave?.();
  }

  return (
    <ControlButton
      label={label}
      active
      activeColor="#7F1D1D"
      onClick={handleClick}
      size={size}
      title="End call"
    >
      <PhoneDownIcon />
    </ControlButton>
  );
}

// ── Icons ─────────────────────────────────────────────────

export function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export function MicOffIcon() {
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

export function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

export function VideoOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34" />
      <polygon points="23 7 16 12 23 17 23 7" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function PhoneDownIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-.85a2 2 0 0 1 2.11-.43 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.44-2.47M6.51 6.51A19.5 19.5 0 0 0 3.07 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 1.82 1.2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.44 2.08L6.51 8.8" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function ScreenShareIcon({ active }: { active: boolean }) {
  const stroke = active ? '#60A5FA' : '#94A3B8';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <polyline points="8 21 12 17 16 21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

