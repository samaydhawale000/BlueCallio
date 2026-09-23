# @purplecallio/svelte

Official Svelte stores and components for [PurpleCallio](https://purplecallio.com), a
developer-focused real-time communication infrastructure platform for voice, video, screen
sharing and WebRTC applications.

This package is a **framework adapter**, not a WebRTC reimplementation: it wraps
[`@purplecallio/sdk`](../sdk)'s headless `PurpleCallioMeeting` engine — used here completely
unmodified — in an idiomatic Svelte API (stores + a small video component). All signaling/WebRTC
logic lives in `@purplecallio/sdk`.

## Why stores, not runes?

Svelte 5 introduced "runes" (`$state`, `$derived`), but runes only work inside Svelte's own
compiled context (`.svelte` / `.svelte.js` files processed by the Svelte compiler) — they cannot
be used as plain exported functions from an ordinary `.ts` module the way a library needs (there
is no way to `export function useCall() { const state = $state(...); return state; }` from a
`.ts` file and have it work for a consumer).

This package therefore targets the **classic Svelte store contract** instead — `writable` from
`svelte/store`, implementing the standard `Readable`/`Writable` interfaces — as its public API.
This is the portable choice: stores work identically, and are fully supported, in both Svelte 4
and Svelte 5 (Svelte 5 kept full store compatibility, including the `$store` auto-subscription
syntax inside `.svelte` files). Hence this package's peer dependency is
`"svelte": "^4.0.0 || ^5.0.0"`.

## Install

```sh
npm install @purplecallio/svelte @purplecallio/sdk
```

`svelte` itself (`^4.0.0 || ^5.0.0`) is a peer dependency — install it if your project doesn't
already have it.

## Security: where does `token` come from?

**Never obtain or embed a PurpleCallio API key in a Svelte app.** API keys are server-only
secrets that authenticate privileged, project-wide REST calls (creating calls, managing
projects, etc.) — see `@purplecallio/sdk`'s `PurpleCallioClient`. This package never touches
that client at all.

`token` here is a short-lived **participant token**, scoped to a single call and participant,
that your own backend mints (via `PurpleCallioClient`) and hands to your Svelte app — e.g. from
an endpoint the client calls right before joining a call. Ship that token to the browser, never
the API key.

## Usage

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createPurpleCallio, PurpleCallioVideo } from '@purplecallio/svelte';

  export let token: string; // from YOUR backend — never an API key
  export let callId: string;
  export let signalUrl: string;

  const call = createPurpleCallio({ token, callId, signalUrl, video: true, audio: true });

  // Destructure the stores for convenient `$`-auto-subscription below.
  const { connectionState, participants, media, remoteStream, localStream } = call;

  // The factory isn't tied to this component's lifecycle automatically
  // (unlike, say, a React provider unmounting) — always destroy it yourself.
  onDestroy(() => {
    call.destroy();
  });
</script>

<p>{$connectionState} · {$participants.length} participant(s)</p>

<PurpleCallioVideo stream={$remoteStream} />
<PurpleCallioVideo stream={$localStream} muted />

{#if $connectionState !== 'connected' && $connectionState !== 'joined'}
  <button on:click={() => call.join()}>Join call</button>
{:else}
  <button on:click={() => call.camera.toggle()}>
    {$media.camera ? 'Turn camera off' : 'Turn camera on'}
  </button>
  <button on:click={() => call.microphone.toggle()}>
    {$media.microphone ? 'Mute' : 'Unmute'}
  </button>
  <button on:click={() => call.leave()}>Leave</button>
{/if}
```

See `packages/svelte/examples/CallView.svelte` for the same flow as a complete, standalone
component (join/leave state, error handling, styling).

## API reference

### `createPurpleCallio(config): PurpleCallioCall`

```ts
interface EngineConfig {
  token: string; // participant token from YOUR backend — never an API key
  callId: string;
  signalUrl: string;
  video?: boolean; // default true
  audio?: boolean; // default true
  iceServers?: RTCIceServer[];
  overrideIceServers?: boolean;
}

interface PurpleCallioCall {
  connectionState: Readable<ConnectionState>;
  participants: Readable<Participant[]>;
  media: Readable<{ camera: boolean; microphone: boolean; screenShare: boolean }>;
  remoteStream: Readable<MediaStream | null>;
  localStream: Readable<MediaStream | null>;
  participantId: Readable<string | null>;

  join(): Promise<void>;
  leave(): Promise<void>;

  camera: { enable(): void; disable(): void; toggle(): void; isEnabled(): boolean };
  microphone: { enable(): void; disable(): void; toggle(): void; isEnabled(): boolean };
  screenShare: { start(): Promise<void>; stop(): Promise<void>; isActive(): boolean };

  destroy(): void;
}
```

`createPurpleCallio` constructs the underlying engine immediately (cheap and synchronous — no
network activity happens until `join()` is called) and returns one `Readable` store per piece of
state, so consumers write `$call.connectionState`, `$call.participants.length`, etc., rather than
subscribing to one combined object store.

**Always call `call.destroy()` from your component's `onDestroy()`.** Because
`createPurpleCallio` is plain TypeScript — not a Svelte component or action — it has no automatic
lifecycle hook of its own. `destroy()` unsubscribes from every engine event listener and, if the
call is still connected, best-effort leaves it. Skipping this leaks the engine's event listeners
(and, if the component unmounts mid-call, the open connection itself) past the component's
lifetime.

### `<PurpleCallioVideo>`

```svelte
<PurpleCallioVideo stream={someStream} muted={false} autoplay={true} playsInline={true} />
```

Binds `stream` (a `MediaStream | null | undefined`) to a `<video>` element's `srcObject`,
reactively, and clears it on destroy. `muted` defaults to `false` (correct for a remote
participant's video, so their audio is heard) — pass `muted` explicitly for a local self-preview
to avoid echo/feedback. Any other prop (`class`, `style`, `id`, ...) is forwarded to the
underlying `<video>` element.

Written with `export let` props (Svelte 4-style), not runes, so the shipped `.svelte` source
compiles correctly under either a Svelte 4 or Svelte 5 toolchain in the consuming app (see "Why
stores, not runes?" above).

## Development

```bash
npm install                          # from the repo root
npm run build -w @purplecallio/svelte
npm run test -w @purplecallio/svelte
```

Built with [`@sveltejs/package`](https://kit.svelte.dev/docs/packaging), the standard tool for
publishing a Svelte library — it copies/preprocesses `src/lib` into `dist`, generating
`.svelte`+`.d.ts` output ready for both bundler-based and CommonJS/Node consumers.

Tests use `vitest` and a lightweight fake engine (`tests/fake-meeting.ts`) — no browser, no real
WebRTC/socket connections. Since `createPurpleCallio`'s stores are plain `svelte/store` values,
they're subscribed to directly in plain Node (`store.subscribe(fn)` / `get(store)`), with no
Svelte compiler involved.

## License

MIT
