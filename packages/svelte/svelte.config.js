import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/package').Config} */
export default {
  // Lets .svelte files use <script lang="ts"> (PurpleCallioVideo.svelte).
  // `svelte-preprocess` (rather than `@sveltejs/vite-plugin-svelte`'s
  // `vitePreprocess`) is used here deliberately: this package has no Vite
  // build step of its own (`@sveltejs/package` + `vitest` only), and pulling
  // in `@sveltejs/vite-plugin-svelte` would drag a hard `vite` peer
  // dependency in just for its TS preprocessing.
  preprocess: sveltePreprocess({ typescript: true }),
};
