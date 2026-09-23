import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Build tooling choice (see README "Build tooling" section for the full
// rationale): this package ships a real `.vue` SFC (`PurpleCallioVideo.vue`),
// which plain `tsc` cannot compile — SFCs need `@vue/compiler-sfc` to turn
// `<template>`/`<script setup>` blocks into plain JS/TS first. Vite's library
// mode + `@vitejs/plugin-vue` does that compilation; `vite-plugin-dts` then
// generates `.d.ts` declarations for both the `.ts` composable and the `.vue`
// component (via `@vue/language-core`, the same engine `vue-tsc` itself uses),
// so consumers get accurate prop types for `<PurpleCallioVideo>`, not `any`.
export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      insertTypesEntry: true,
      include: ['src'],
      exclude: ['**/*.spec.ts', 'tests', 'examples'],
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'PurpleCallioVue',
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      // Never bundle Vue or the core SDK into the published package — both
      // are declared as peer/regular dependencies and must be resolved from
      // the consuming app's own install (a single shared Vue instance is
      // required for reactivity/lifecycle hooks to work at all).
      external: ['vue', '@purplecallio/sdk'],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
