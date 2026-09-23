import { vi } from 'vitest';

/**
 * Minimal in-memory stand-in for `@purplecallio/sdk`'s `PurpleCallioMeeting`.
 * Mirrors just the public surface `PurpleCallioService` depends on, with no
 * real WebRTC/socket activity, so the service can be unit tested in plain
 * Node without a browser.
 */
export class FakeMeeting {
  static instances: FakeMeeting[] = [];

  readonly config: Record<string, unknown>;
  joinCalls = 0;
  leaveCalls = 0;
  localStreamRef: unknown = null;

  private _connectionState = 'idle';
  private _participants: unknown[] = [];

  private readonly listeners = new Map<string, Set<(payload?: unknown) => void>>();
  private readonly connectionStateListeners = new Set<(state: string) => void>();
  private readonly participantsListeners = new Set<(participants: unknown[]) => void>();

  readonly camera = {
    enable: vi.fn(),
    disable: vi.fn(),
    toggle: vi.fn(),
    isEnabled: vi.fn(() => true),
  };

  readonly microphone = {
    enable: vi.fn(),
    disable: vi.fn(),
    toggle: vi.fn(),
    isEnabled: vi.fn(() => true),
  };

  readonly screenShare = {
    start: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    isActive: vi.fn(() => false),
  };

  constructor(config: Record<string, unknown>) {
    this.config = config;
    FakeMeeting.instances.push(this);
  }

  async join(): Promise<void> {
    this.joinCalls += 1;
    this.localStreamRef = { id: 'fake-local-stream' };
    this.setConnectionState('joined');
  }

  async leave(): Promise<void> {
    this.leaveCalls += 1;
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
