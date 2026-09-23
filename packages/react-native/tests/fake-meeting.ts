import { vi } from 'vitest';

export function createFakeVideoTrack() {
  return { kind: 'video', _switchCamera: vi.fn() };
}

export function createFakeStream(tracks: Array<{ kind: string; _switchCamera?: () => void }> = [createFakeVideoTrack()]) {
  return {
    id: 'fake-local-stream',
    getVideoTracks: () => tracks.filter((t) => t.kind === 'video'),
    getTracks: () => tracks,
    toURL: () => 'fake-stream-url://local',
  };
}

/**
 * Minimal in-memory stand-in for `@purplecallio/sdk`'s `PurpleCallioMeeting`,
 * with just enough real state (camera/microphone enabled flags) to exercise
 * `<PurpleCallioProvider>`'s toggle semantics and AppState background/
 * foreground pause logic, without any real WebRTC/socket activity.
 */
export class FakeMeeting {
  static instances: FakeMeeting[] = [];

  readonly config: Record<string, unknown>;
  joinCalls = 0;
  leaveCalls = 0;
  localStreamRef: ReturnType<typeof createFakeStream> | null = null;

  private _connectionState = 'idle';
  private _participants: unknown[] = [];
  private _cameraEnabled: boolean;
  private _microphoneEnabled: boolean;

  private readonly listeners = new Map<string, Set<(payload?: unknown) => void>>();
  private readonly connectionStateListeners = new Set<(state: string) => void>();
  private readonly participantsListeners = new Set<(participants: unknown[]) => void>();

  readonly camera = {
    enable: vi.fn(() => this.setCamera(true)),
    disable: vi.fn(() => this.setCamera(false)),
    toggle: vi.fn(() => this.setCamera(!this._cameraEnabled)),
    isEnabled: vi.fn(() => this._cameraEnabled),
  };

  readonly microphone = {
    enable: vi.fn(() => this.setMicrophone(true)),
    disable: vi.fn(() => this.setMicrophone(false)),
    toggle: vi.fn(() => this.setMicrophone(!this._microphoneEnabled)),
    isEnabled: vi.fn(() => this._microphoneEnabled),
  };

  // Present so tests can confirm @purplecallio/react-native's own
  // context.screenShare (which never delegates here) is used instead of
  // this engine-level control.
  readonly screenShare = {
    start: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    isActive: vi.fn(() => false),
  };

  constructor(config: Record<string, unknown>) {
    this.config = config;
    this._cameraEnabled = config.video !== false;
    this._microphoneEnabled = config.audio !== false;
    FakeMeeting.instances.push(this);
  }

  private setCamera(enabled: boolean): void {
    if (this._cameraEnabled === enabled) return;
    this._cameraEnabled = enabled;
    this.emit(enabled ? 'camera.enabled' : 'camera.disabled');
  }

  private setMicrophone(enabled: boolean): void {
    if (this._microphoneEnabled === enabled) return;
    this._microphoneEnabled = enabled;
    this.emit(enabled ? 'microphone.enabled' : 'microphone.disabled');
  }

  async join(): Promise<void> {
    this.joinCalls += 1;
    this.localStreamRef = createFakeStream();
    this.setConnectionState('joined');
  }

  async leave(): Promise<void> {
    this.leaveCalls += 1;
    this.localStreamRef = null;
    this.setConnectionState('disconnected');
  }

  participants(): unknown[] {
    return this._participants;
  }

  connectionState(): string {
    return this._connectionState;
  }

  on(event: string, listener: (payload?: unknown) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  off(event: string, listener: (payload?: unknown) => void): void {
    this.listeners.get(event)?.delete(listener);
  }

  onConnectionStateChanged(listener: (state: string) => void): () => void {
    this.connectionStateListeners.add(listener);
    return () => this.connectionStateListeners.delete(listener);
  }

  onParticipantsChanged(listener: (participants: unknown[]) => void): () => void {
    this.participantsListeners.add(listener);
    return () => this.participantsListeners.delete(listener);
  }

  // ── Test-only helpers to simulate engine-originated activity ──────────

  setConnectionState(state: string): void {
    this._connectionState = state;
    this.connectionStateListeners.forEach((l) => l(state));
  }

  setParticipants(participants: unknown[]): void {
    this._participants = participants;
    this.participantsListeners.forEach((l) => l(participants));
  }

  emit(event: string, payload?: unknown): void {
    this.listeners.get(event)?.forEach((l) => l(payload));
  }
}
