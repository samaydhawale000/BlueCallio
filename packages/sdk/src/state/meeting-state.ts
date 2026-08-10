import type { ParticipantMedia, ParticipantRole } from '../types';

export interface MeetingStateSnapshot {
  callId: string;
  participantId: string;
  role: ParticipantRole;
  media: ParticipantMedia;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
}

export type MeetingStateListener = (snapshot: MeetingStateSnapshot) => void;

/**
 * Owns the meeting state that isn't participant tracking:
 * local/remote streams, media toggles, and identity.
 *
 * Emits a full snapshot on every change — UI layers subscribe
 * instead of polling.
 */
export class MeetingState {
  private _callId = '';
  private _participantId = '';
  private _role: ParticipantRole = 'CALLER';
  private _media: ParticipantMedia = {
    camera: false,
    microphone: false,
    screenShare: false,
  };
  private _remoteStream: MediaStream | null = null;
  private _localStream: MediaStream | null = null;
  private listeners = new Set<MeetingStateListener>();

  set identity(value: { callId: string; participantId: string; role: ParticipantRole }) {
    this._callId = value.callId;
    this._participantId = value.participantId;
    this._role = value.role;
    this.emit();
  }

  set localStream(stream: MediaStream | null) {
    if (this._localStream === stream) return;
    this._localStream = stream;
    this.emit();
  }

  get localStream(): MediaStream | null {
    return this._localStream;
  }

  set remoteStream(stream: MediaStream | null) {
    if (this._remoteStream === stream) return;
    this._remoteStream = stream;
    this.emit();
  }

  get remoteStream(): MediaStream | null {
    return this._remoteStream;
  }

  /** Patch one or more media flags and emit. */
  updateMedia(patch: Partial<ParticipantMedia>): void {
    this._media = { ...this._media, ...patch };
    this.emit();
  }

  get media(): ParticipantMedia {
    return { ...this._media };
  }

  onChange(listener: MeetingStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  snapshot(): MeetingStateSnapshot {
    return {
      callId: this._callId,
      participantId: this._participantId,
      role: this._role,
      media: { ...this._media },
      remoteStream: this._remoteStream,
      localStream: this._localStream,
    };
  }

  reset(): void {
    this._callId = '';
    this._participantId = '';
    this._role = 'CALLER';
    this._media = { camera: false, microphone: false, screenShare: false };
    this._remoteStream = null;
    this._localStream = null;
    this.emit();
  }

  private emit(): void {
    const s = this.snapshot();
    this.listeners.forEach((l) => l(s));
  }
}
