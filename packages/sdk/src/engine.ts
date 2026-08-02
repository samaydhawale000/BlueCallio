import { io, Socket } from 'socket.io-client';

import type {
  ConnectionState,
  EngineConfig,
  MeetingSnapshot,
  Participant,
  ParticipantRole,
} from './types';

/** Map of event name → payload type (listeners are derived from these). */
export interface EngineEventMap {
  connected: { callId: string; participantId: string; role: ParticipantRole };
  reconnected: { callId: string };
  disconnected: { reason?: string };
  'participant.joined': { callId: string; participantId: string; participants: number };
  'participant.left': { callId: string; participantId: string; participants: number };
  'participant.updated': { callId: string; participantId: string; media?: Participant['media'] };
  'camera.enabled': { callId: string; participantId: string };
  'camera.disabled': { callId: string; participantId: string };
  'microphone.enabled': { callId: string; participantId: string };
  'microphone.disabled': { callId: string; participantId: string };
  'screenShare.started': { callId: string; participantId: string };
  'screenShare.stopped': { callId: string; participantId: string };
  'call.started': { callId: string };
  'call.ended': { callId: string };
  'remote.stream': MediaStream;
  'remote.stream.ended': Record<string, never>;
  offer: { offer: RTCSessionDescriptionInit };
  answer: { answer: RTCSessionDescriptionInit };
  'ice-candidate': { candidate: RTCIceCandidateInit };
}

export type EngineEvents = {
  [K in keyof EngineEventMap]: (payload: EngineEventMap[K]) => void;
};

/**
 * Headless BlueJoinet engine.
 *
 * Manages the WebSocket signaling connection, the RTCPeerConnection,
 * local media acquisition, and the media controls — with no UI.
 *
 * @example
 * const meeting = new BlueJoinet({ token, callId, signalUrl });
 * await meeting.join();
 * meeting.camera.enable();
 * meeting.microphone.disable();
 * meeting.screenShare.start();
 * meeting.leave();
 */
export class BlueJoinetEngine {
  private readonly config: EngineConfig;
  private socket: Socket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;

  private _connectionState: ConnectionState = 'idle';
  private _participants = new Map<string, Participant>();
  private mediaState = { camera: false, microphone: false, screenShare: false };
  private remoteStream: MediaStream | null = null;

  private listeners: {
    [K in keyof EngineEventMap]: Set<(payload: EngineEventMap[K]) => void>;
  } = {
    connected: new Set(),
    reconnected: new Set(),
    disconnected: new Set(),
    'participant.joined': new Set(),
    'participant.left': new Set(),
    'participant.updated': new Set(),
    'camera.enabled': new Set(),
    'camera.disabled': new Set(),
    'microphone.enabled': new Set(),
    'microphone.disabled': new Set(),
    'screenShare.started': new Set(),
    'screenShare.stopped': new Set(),
    'call.started': new Set(),
    'call.ended': new Set(),
    'remote.stream': new Set(),
    'remote.stream.ended': new Set(),
    offer: new Set(),
    answer: new Set(),
    'ice-candidate': new Set(),
  };

  constructor(config: EngineConfig) {
    if (!config.token) throw new Error('BlueJoinet engine: token is required');
    if (!config.callId) throw new Error('BlueJoinet engine: callId is required');
    if (!config.signalUrl) throw new Error('BlueJoinet engine: signalUrl is required');
    this.config = config;
  }

  // ── Public API ───────────────────────────────────────────

  async join(): Promise<void> {
    if (this._connectionState === 'connected') return;

    this._connectionState = 'connecting';
    await this.initLocalMedia();

    this.socket = io(this.config.signalUrl, {
      autoConnect: false,
      transports: ['websocket'],
    });

    this.attachSocketHandlers();

    this.socket.connect();

    await new Promise<void>((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket not initialized'));
      this.socket.once('connect_error', (err) => reject(err));
      this.socket.emit(
        'authenticate',
        { token: this.config.token },
        (res: { success: boolean; role?: ParticipantRole }) => {
          if (!res?.success) {
            reject(new Error('Authentication failed: invalid or expired token'));
            return;
          }
          this._connectionState = 'connected';
          resolve();
        },
      );
    });
  }

  async leave(): Promise<void> {
    this.cleanupMedia();
    this.socket?.emit('leave-call', { callId: this.config.callId });
    this.socket?.disconnect();
    this.socket = null;
    this._connectionState = 'disconnected';
    this.emit('disconnected', { reason: 'left' });
  }

  camera = {
    enable: () => this.setCamera(true),
    disable: () => this.setCamera(false),
  };

  microphone = {
    enable: () => this.setMicrophone(true),
    disable: () => this.setMicrophone(false),
  };

  screenShare = {
    start: () => this.startScreenShare(),
    stop: () => this.stopScreenShare(),
  };

  participants(): Participant[] {
    return [...this._participants.values()];
  }

  connectionState(): ConnectionState {
    return this._connectionState;
  }

  get localStreamRef(): MediaStream | null {
    return this.localStream;
  }

  snapshot(): MeetingSnapshot {
    return {
      callId: this.config.callId,
      participantId: this.config.token,
      participants: this.participants(),
      connectionState: this._connectionState,
      media: { ...this.mediaState },
      remoteStream: this.remoteStream,
    };
  }

  // ── Event emitter ────────────────────────────────────────

  on<K extends keyof EngineEventMap>(
    event: K,
    listener: (payload: EngineEventMap[K]) => void,
  ): () => void {
    this.listeners[event].add(listener as (payload: EngineEventMap[K]) => void);
    return () => this.off(event, listener);
  }

  off<K extends keyof EngineEventMap>(
    event: K,
    listener: (payload: EngineEventMap[K]) => void,
  ): void {
    this.listeners[event].delete(listener as (payload: EngineEventMap[K]) => void);
  }

  private emit<K extends keyof EngineEventMap>(
    event: K,
    payload: EngineEventMap[K],
  ): void {
    const set = this.listeners[event] as Set<(payload: EngineEventMap[K]) => void>;
    set.forEach((l) => l(payload));
  }

  // ── Media controls ───────────────────────────────────────

  private setCamera(enabled: boolean) {
    const track = this.localStream?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = enabled;
    this.mediaState.camera = enabled;
    this.socket?.emit(enabled ? 'camera.enabled' : 'camera.disabled', {
      callId: this.config.callId,
    });
  }

  private setMicrophone(enabled: boolean) {
    const track = this.localStream?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = enabled;
    this.mediaState.microphone = enabled;
    this.socket?.emit(enabled ? 'microphone.enabled' : 'microphone.disabled', {
      callId: this.config.callId,
    });
  }

  private async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      this.screenStream = screenStream;

      const sender = this.pc?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);

      screenTrack.onended = () => this.stopScreenShare();
      this.mediaState.screenShare = true;
      this.socket?.emit('screenShare.started', { callId: this.config.callId });
    } catch {
      // User cancelled the picker — no-op.
    }
  }

  private async stopScreenShare() {
    this.screenStream?.getTracks().forEach((t) => t.stop());
    this.screenStream = null;

    const cameraTrack = this.localStream?.getVideoTracks()[0];
    const sender = this.pc?.getSenders().find((s) => s.track?.kind === 'video');
    if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);

    this.mediaState.screenShare = false;
    this.socket?.emit('screenShare.stopped', { callId: this.config.callId });
  }

  // ── Internal ─────────────────────────────────────────────

  private async initLocalMedia() {
    const [stream, iceServers] = await Promise.all([
      navigator.mediaDevices.getUserMedia({
        audio: this.config.audio ?? true,
        video: this.config.video ?? true,
      }),
      this.fetchIceServers(),
    ]);

    this.localStream = stream;
    this.mediaState.camera = this.config.video ?? true;
    this.mediaState.microphone = this.config.audio ?? true;

    const pc = new RTCPeerConnection({ iceServers });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (event) => {
      const s = event.streams[0];
      this.remoteStream = s;
      this.emit('remote.stream', s);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', { candidate: event.candidate });
      }
    };

    this.pc = pc;
  }

  private async fetchIceServers(): Promise<RTCIceServer[]> {
    try {
      const res = await fetch(`${this.config.signalUrl}/turn/credentials`, {
        headers: { Authorization: `Bearer ${this.config.token}` },
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { iceServers: RTCIceServer[] };
      return data.iceServers;
    } catch {
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }

  private createOffer = async () => {
    if (!this.pc) return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.socket?.emit('offer', { offer });
  };

  private handleOffer = async (payload: { offer: RTCSessionDescriptionInit }) => {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.socket?.emit('answer', { answer });
  };

  private handleAnswer = async (payload: { answer: RTCSessionDescriptionInit }) => {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
  };

  private handleIceCandidate = async (payload: { candidate: RTCIceCandidateInit }) => {
    if (!this.pc) return;
    await this.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
  };

  private attachSocketHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.socket?.emit('authenticate', { token: this.config.token });
    });

    this.socket.on('disconnect', (reason) => {
      this._connectionState = 'disconnected';
      this.emit('disconnected', { reason });
    });

    this.socket.on('connected', (payload) => {
      this._connectionState = 'connected';
      this.emit('connected', payload);
      this.socket?.emit('join-call', { callId: this.config.callId });
    });

    this.socket.on('reconnect', () => {
      this._connectionState = 'connected';
      this.emit('reconnected', { callId: this.config.callId });
    });

    this.socket.on('offer', this.handleOffer);
    this.socket.on('answer', this.handleAnswer);
    this.socket.on('ice-candidate', this.handleIceCandidate);

    this.socket.on('call.accepted', () => {
      this.createOffer();
    });

    this.socket.on('call.started', (payload: { callId: string }) => {
      this.emit('call.started', payload);
    });

    this.socket.on('call.ended', (payload: { callId: string }) => {
      this.emit('call.ended', payload);
      this.cleanupMedia();
    });

    this.socket.on('participant.joined', (payload: { participantId: string }) => {
      const p: Participant = {
        participantId: payload.participantId,
        token: '',
        hostedUrl: '',
        expiresAt: '',
        role: payload.participantId === this.config.token ? 'CALLER' : 'RECEIVER',
      };
      this._participants.set(payload.participantId, p);
      this.emit('participant.joined', {
        callId: this.config.callId,
        participantId: payload.participantId,
        participants: this._participants.size,
      });
    });

    this.socket.on('participant.left', (payload: { participantId: string }) => {
      this._participants.delete(payload.participantId);
      this.emit('participant.left', {
        callId: this.config.callId,
        participantId: payload.participantId,
        participants: this._participants.size,
      });
    });

    this.socket.on('participant.updated', (payload: {
      participantId: string;
      media: Participant['media'];
    }) => {
      const p = this._participants.get(payload.participantId);
      if (p) p.media = payload.media;
      this.emit('participant.updated', {
        callId: this.config.callId,
        participantId: payload.participantId,
        media: payload.media,
      });
    });

    // Relay media events.
    this.socket.on('camera.enabled', (p) => this.emit('camera.enabled', p));
    this.socket.on('camera.disabled', (p) => this.emit('camera.disabled', p));
    this.socket.on('microphone.enabled', (p) => this.emit('microphone.enabled', p));
    this.socket.on('microphone.disabled', (p) => this.emit('microphone.disabled', p));
    this.socket.on('screenShare.started', (p) => this.emit('screenShare.started', p));
    this.socket.on('screenShare.stopped', (p) => this.emit('screenShare.stopped', p));
  }

  private cleanupMedia() {
    this.screenStream?.getTracks().forEach((t) => t.stop());
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.pc?.close();
    this.pc = null;
    this.localStream = null;
    this.screenStream = null;
    this.remoteStream = null;
    this.emit('remote.stream.ended', {});
  }
}

