import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';

/**
 * Binds a `MediaStream` (local or remote) to a `<video>` element's
 * `srcObject`, and applies sensible defaults for a video call preview.
 *
 * A directive (rather than a wrapping component) was chosen so it composes
 * with a plain `<video>` element and any attributes/bindings a consumer
 * already puts on it, instead of introducing a second element or requiring
 * a `ng-content` passthrough.
 *
 * Usage:
 * ```html
 * <!-- remote participant -->
 * <video purplecallioVideo [stream]="remoteStream$ | async"></video>
 *
 * <!-- local self-preview: muted so you don't hear your own mic -->
 * <video purplecallioVideo [stream]="localStream$ | async" [muted]="true"></video>
 * ```
 */
@Directive({
  selector: 'video[purplecallioVideo]',
  standalone: true,
})
export class PurpleCallioVideoDirective implements OnChanges, OnDestroy {
  /** The stream to render. Pass `null`/`undefined` to clear the element. */
  @Input() stream: MediaStream | null | undefined = null;

  /**
   * Whether this `<video>` should be muted. Defaults to `true`, which is
   * the safe default for a local self-preview (it prevents echo/feedback);
   * set `[muted]="false"` explicitly for a remote participant's video so
   * their audio is actually heard.
   */
  @Input() muted = true;

  /** Autoplay the stream as soon as it's attached. Defaults to `true`. */
  @Input() autoplay = true;

  /** Inline playback (required on iOS Safari to avoid full-screen takeover). */
  @Input() playsInline = true;

  constructor(private readonly elementRef: ElementRef<HTMLVideoElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    const video = this.elementRef.nativeElement;

    video.autoplay = this.autoplay;
    video.playsInline = this.playsInline;
    video.muted = this.muted;

    if ('stream' in changes) {
      video.srcObject = this.stream ?? null;
    }
  }

  ngOnDestroy(): void {
    this.elementRef.nativeElement.srcObject = null;
  }
}
