<script lang="ts">
  import { onDestroy } from 'svelte';

  /**
   * Binds a `MediaStream` (local or remote) to a `<video>` element's
   * `srcObject`, reactively, and cleans up on destroy.
   *
   * Usage:
   * ```svelte
   * <!-- remote participant -->
   * <PurpleCallioVideo stream={$call.remoteStream} />
   *
   * <!-- local self-preview: muted so you don't hear your own mic -->
   * <PurpleCallioVideo stream={$call.localStream} muted={true} />
   * ```
   *
   * Any other prop (e.g. `class`, `style`, `id`) is forwarded straight to
   * the underlying `<video>` element via `$$restProps`.
   *
   * Written with `export let` (Svelte 4-style props), not runes, so the
   * compiled output works whether the consuming app is on Svelte 4 or 5 —
   * see the README for why this package targets the classic store/component
   * contract instead of runes.
   */

  /** The stream to render. Pass `null`/`undefined` to clear the element. */
  export let stream: MediaStream | null | undefined = null;

  /**
   * Whether this `<video>` should be muted. Defaults to `false`, which is
   * correct for a remote participant's video (so their audio is actually
   * heard); pass `muted={true}` explicitly for a local self-preview to
   * avoid echo/feedback.
   */
  export let muted = false;

  /** Autoplay the stream as soon as it's attached. Defaults to `true`. */
  export let autoplay = true;

  /** Inline playback (required on iOS Safari to avoid full-screen takeover). */
  export let playsInline = true;

  let videoEl: HTMLVideoElement | undefined;

  $: if (videoEl) {
    videoEl.srcObject = stream ?? null;
  }

  onDestroy(() => {
    if (videoEl) videoEl.srcObject = null;
  });
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<!-- Captions depend on what the remote participant sends (if anything); this
     component has no track to attach, so the a11y warning is suppressed
     rather than papering over it with an empty <track>. -->
<video
  bind:this={videoEl}
  {autoplay}
  {muted}
  playsinline={playsInline}
  {...$$restProps}
></video>
