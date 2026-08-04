/**
 * Camera controller.
 *
 * Owns the enable/disable/toggle logic for the local camera track.
 * It knows nothing about sockets or signaling — the meeting engine
 * subscribes to `onChange` and forwards events over the transport.
 */
export class CameraController {
  private streamProvider: () => MediaStream | null;
  private _enabled = false;
  private onChangeListener: ((enabled: boolean) => void) | null = null;

  constructor(streamProvider: () => MediaStream | null) {
    this.streamProvider = streamProvider;
  }

  setStreamProvider(provider: () => MediaStream | null): void {
    this.streamProvider = provider;
  }

  onChange(listener: (enabled: boolean) => void): void {
    this.onChangeListener = listener;
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  enable(): void {
    const track = this.streamProvider()?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = true;
    this.setEnabled(true);
  }

  disable(): void {
    const track = this.streamProvider()?.getVideoTracks()[0];
    if (track) track.enabled = false;
    this.setEnabled(false);
  }

  /** Flip the current state. If enabled → disabled, and vice-versa. */
  toggle(): void {
    if (this._enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /** Sync internal state with the actual track state (e.g. after re-acquisition). */
  sync(): void {
    const track = this.streamProvider()?.getVideoTracks()[0];
    this.setEnabled(track ? track.enabled : false);
  }

  setEnabled(enabled: boolean): void {
    if (this._enabled === enabled) return;
    this._enabled = enabled;
    this.onChangeListener?.(enabled);
  }
}
