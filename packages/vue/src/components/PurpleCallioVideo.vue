<script setup lang="ts">
/**
 * Binds a `MediaStream` (local or remote) to a `<video>` element's
 * `srcObject`, and applies sensible defaults for a video call preview.
 *
 * Usage:
 * ```vue
 * <!-- remote participant -->
 * <PurpleCallioVideo :stream="remoteStream" />
 *
 * <!-- local self-preview: muted so you don't hear your own mic -->
 * <PurpleCallioVideo :stream="localStream" :muted="true" />
 * ```
 *
 * Implemented as a real `.vue` SFC (not a `defineComponent`/`h()`
 * render-function component) — see the README's "Build tooling" section for
 * why that's a deliberate choice for this package.
 */
import { onMounted, onUnmounted, ref, watch } from 'vue';

import type { PurpleCallioVideoProps } from './PurpleCallioVideo.types';

const props = withDefaults(defineProps<PurpleCallioVideoProps>(), {
  stream: null,
  muted: true,
  autoplay: true,
  playsInline: true,
});

const videoRef = ref<HTMLVideoElement | null>(null);

// Tracked separately from `videoRef` because Vue clears template refs to
// `null` as part of its own unmount teardown, and does so before/around the
// same point `onUnmounted` callbacks run — relying on `videoRef.value`
// inside `onUnmounted` below is not guaranteed to still see the element.
// Keeping our own handle sidesteps that ordering entirely.
let el: HTMLVideoElement | null = null;

function attach(stream: MediaStream | null | undefined): void {
  if (!el) return;
  el.srcObject = stream ?? null;
}

onMounted(() => {
  el = videoRef.value;
  attach(props.stream);
});

watch(() => props.stream, (stream) => attach(stream));

onUnmounted(() => {
  attach(null);
  el = null;
});
</script>

<template>
  <video ref="videoRef" :muted="muted" :autoplay="autoplay" :playsInline="playsInline" />
</template>
