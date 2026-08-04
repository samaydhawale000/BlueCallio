/**
 * Microphone controller.
 *
 * Owns the enable/disable/toggle logic for the local microphone track.
 * It knows nothing about sockets or signaling.
 */
export class MicrophoneController {
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
    const track = this.streamProvider()?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = true;
    this.setEnabled(true);
  }

  disable(): void {
    const track = this.streamProvider()?.getAudioTracks()[0];
    if (track) track.enabled = false;
    this.setEnabled(false);
  }

  /** Flip the current state. */
  toggle(): void {
    if (this._enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /** Sync internal state with the actual track state. */
  sync(): void {
    const track = this.streamProvider()?.getAudioTracks()[0];
    this.setEnabled(track ? track.enabled : false);
  }

  setEnabled(enabled: boolean): void {
    if (this._enabled === enabled) return;
    this._enabled = enabled;
    this.onChangeListener?.(enabled);
  }
}
