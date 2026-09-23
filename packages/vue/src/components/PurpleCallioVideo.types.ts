/**
 * Props for `PurpleCallioVideo.vue`, factored into a plain `.ts` file (rather
 * than declared inline in the SFC's `<script setup>` block) so it can be
 * re-exported cleanly from `src/index.ts` — re-exporting a named type
 * straight out of a `.vue` file's generated declaration is unnecessarily
 * fragile across dts-generation tooling versions.
 */
export interface PurpleCallioVideoProps {
  /**
   * The stream to render — typically `localStream` or `remoteStream` from
   * `usePurpleCallio()`. When `null`/`undefined`, `srcObject` is cleared.
   */
  stream?: MediaStream | null;
  /**
   * Whether this `<video>` should be muted. Defaults to `true`, which is the
   * safe default for a local self-preview (it prevents echo/feedback); pass
   * `:muted="false"` explicitly for a remote participant's video so their
   * audio is actually heard.
   */
  muted?: boolean;
  /** Autoplay the stream as soon as it's attached. Defaults to `true`. */
  autoplay?: boolean;
  /** Inline playback (required on iOS Safari to avoid full-screen takeover). */
  playsInline?: boolean;
}
