// Ambient module declaration so a plain `tsc`/editor type-check knows what a
// `.vue` import resolves to. Not used by the actual build: `vite build` (via
// `vite-plugin-dts`, see vite.config.ts) generates a real, fully-typed
// declaration file for `PurpleCallioVideo.vue` from its `<script setup>`
// block using `@vue/language-core`, so consumers get accurate prop types,
// not the `any`-ish fallback below.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, any>, Record<string, any>, any>;
  export default component;
}
