import { io, Socket } from 'socket.io-client';

import {
  SignalingEvents,
  SignalingEvent,
  SignalingEventMap,
} from '../signaling/events';

/**
 * Thin transport wrapper around socket.io.
 *
 * Owns the socket lifecycle and auth handshake. It knows nothing about
 * WebRTC or media — it only deals with the signaling event contract.
 */
export class SignalingTransport {
  private socket: Socket | null = null;
  private readonly events = new SignalingEvents();
  private readonly token: string;
  private readonly signalUrl: string;

  constructor(signalUrl: string, token: string) {
    this.signalUrl = signalUrl;
    this.token = token;
  }

  /** Access to the typed event emitter. */
  get on(): SignalingEvents['on'] {
    return this.events.on.bind(this.events);
  }

  get off(): SignalingEvents['off'] {
    return this.events.off.bind(this.events);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Connect and authenticate. Resolves once the server confirms
   * a successful `authenticate` — authentication happens exactly once.
   */
  connect(): Promise<void> {
    if (this.socket?.connected) return Promise.resolve();

    this.socket = io(this.signalUrl, {
      autoConnect: false,
      transports: ['websocket'],
    });

    this.attach(this.socket);

    return new Promise<void>((resolve, reject) => {
      const s = this.socket;
      if (!s) return reject(new Error('Socket not initialized'));

      const onConnectError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const onAuthenticateResult = (res: { success: boolean }) => {
        if (!res?.success) {
          cleanup();
          reject(new Error('Authentication failed: invalid or expired token'));
          return;
        }
        cleanup();
        resolve();
      };

      const cleanup = () => {
        s.off('connect_error', onConnectError);
        s.off('authenticate-result', onAuthenticateResult);
      };

      s.once('connect_error', onConnectError);
      s.once('authenticate-result', onAuthenticateResult);

      s.connect();
      s.emit('authenticate', { token: this.token });
    });
  }

  emit<K extends SignalingEvent>(event: K, payload: SignalingEventMap[K]): void {
    this.socket?.emit(event, payload);
  }

/** Subscribe to a raw signaling event that the server emits back to us. */
  onServerEvent<K extends SignalingEvent>(
    event: K,
    listener: (payload: SignalingEventMap[K]) => void,
  ): () => void {
    if (!this.socket) return () => {};
    return this.onRaw(event, (payload) => {
      this.events.emit(event, payload as SignalingEventMap[K]);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  /** Dynamically subscribe to a server event (bypasses socket.io's strict map). */
  private onRaw(event: string, handler: (...args: any[]) => void): () => void {
    if (!this.socket) return () => {};
    // socket.io's `on` is overloaded for reserved events; cast to a generic
    // emitter so dynamic signaling event names type-check cleanly.
    const s = this.socket as unknown as {
      on: (e: string, h: (...args: any[]) => void) => void;
      off: (e: string, h: (...args: any[]) => void) => void;
    };
    s.on(event, handler);
    return () => s.off(event, handler);
  }

  private attach(socket: Socket): void {
    // Route server-sent signaling events into the typed emitter.
    socket.on('connected', (p) => this.events.emit('connected', p));
    socket.on('reconnected', (p) => this.events.emit('reconnected', p));
    socket.on('disconnect', (reason) => this.events.emit('disconnected', { reason }));
    socket.on('participant.joined', (p) => this.events.emit('participant.joined', p));
    socket.on('participant.left', (p) => this.events.emit('participant.left', p));
    socket.on('participant.updated', (p) => this.events.emit('participant.updated', p));
    socket.on('camera.enabled', (p) => this.events.emit('camera.enabled', p));
    socket.on('camera.disabled', (p) => this.events.emit('camera.disabled', p));
    socket.on('microphone.enabled', (p) => this.events.emit('microphone.enabled', p));
    socket.on('microphone.disabled', (p) => this.events.emit('microphone.disabled', p));
    socket.on('screenShare.started', (p) => this.events.emit('screenShare.started', p));
    socket.on('screenShare.stopped', (p) => this.events.emit('screenShare.stopped', p));
    socket.on('call.started', (p) => this.events.emit('call.started', p));
    socket.on('call.ended', (p) => this.events.emit('call.ended', p));
    socket.on('offer', (p) => this.events.emit('offer', p));
    socket.on('answer', (p) => this.events.emit('answer', p));
    socket.on('ice-candidate', (p) => this.events.emit('ice-candidate', p));
  }
}
