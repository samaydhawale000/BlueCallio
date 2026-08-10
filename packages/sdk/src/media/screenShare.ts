/**
 * Screen-share controller.
 *
 * Owns acquiring the display stream and swapping it onto the video sender.
 * It knows nothing about sockets/signaling — the meeting engine forwards
 * state changes over the transport.
 */
export class ScreenShareController {
  private pcProvider: () => RTCPeerConnection | null;
  private cameraStreamProvider: () => MediaStream | null;
  private _active = false;
  private screenStream: MediaStream | null = null;
  private onChangeListener: ((active: boolean) => void) | null = null;

  constructor(
    pcProvider: () => RTCPeerConnection | null,
    cameraStreamProvider: () => MediaStream | null,
  ) {
    this.pcProvider = pcProvider;
    this.cameraStreamProvider = cameraStreamProvider;
  }

  onChange(listener: (active: boolean) => void): void {
    this.onChangeListener = listener;
  }

  isActive(): boolean {
    return this._active;
  }

  async start(): Promise<void> {
    if (this._active) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      this.screenStream = screenStream;

      const sender = this.pcProvider()
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);

      screenTrack.onended = () => this.stop();
      this.setActive(true);
    } catch {
      // User cancelled the picker — no-op.
    }
  }

  async stop(): Promise<void> {
    this.screenStream?.getTracks().forEach((t) => t.stop());
    this.screenStream = null;

    const cameraTrack = this.cameraStreamProvider()?.getVideoTracks()[0];
    const sender = this.pcProvider()
      ?.getSenders()
      .find((s) => s.track?.kind === 'video');
    if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);

    this.setActive(false);
  }

  setActive(active: boolean): void {
    if (this._active === active) return;
    this._active = active;
    this.onChangeListener?.(active);
  }
}
