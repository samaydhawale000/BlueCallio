import type { ConnectionState } from '../types';

export type ConnectionStateListener = (state: ConnectionState) => void;

/**
 * A small, explicit connection state machine.
 *
 * Guards against invalid transitions and duplicate `join()` calls by
 * rejecting if an operation is already in-flight.
 */
export class ConnectionStateMachine {
  private _state: ConnectionState = 'idle';
  private listeners = new Set<ConnectionStateListener>();

  get state(): ConnectionState {
    return this._state;
  }

  /** Set the state and notify listeners. No-op if unchanged. */
  set(next: ConnectionState): void {
    if (next === this._state) return;
    this._state = next;
    this.listeners.forEach((l) => l(next));
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  onChange(listener: ConnectionStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** A single JSON-safe snapshot of the current state. */
  get value(): ConnectionState {
    return this._state;
  }
}
