# @purplecallio/angular

Official Angular service, directive and components for [PurpleCallio](https://purplecallio.com) — a developer-first real-time communication platform for integrating voice, video and WebRTC communication into applications.

This package wraps `@purplecallio/sdk`'s headless `PurpleCallioMeeting` engine in an Angular-idiomatic API: an injectable `PurpleCallioService` exposing RxJS observables for state, plus a `purplecallioVideo` directive for rendering media streams.

## Security: never use an API key in this package

`@purplecallio/angular` only ever consumes a short-lived **participant token**. It never touches `@purplecallio/sdk`'s `PurpleCallioClient` (the server-only REST client that requires your PurpleCallio **API key**), the same way `@purplecallio/react` never touches it either.

Your API key must stay on your backend. The typical flow is:

1. Your backend (server-side) uses `@purplecallio/sdk`'s `PurpleCallioClient`, authenticated with your API key, to create a call and mint a participant token for the signed-in user.
2. Your backend hands that participant token (and the `callId` / `signalUrl`) to the Angular app over your own authenticated API.
3. The Angular app passes that token into `PurpleCallioService.configure(...)` — never the API key itself.

If you find yourself importing `PurpleCallioClient` or embedding an API key anywhere in browser-shipped code, stop — that key must never leave your server.

## Install

```bash
npm install @purplecallio/angular @purplecallio/sdk
```

`@angular/core` and `@angular/common` (`>=16.0.0`) and `rxjs` (`>=7.4.0`) are peer dependencies — any Angular app version 16 or newer already has these, so you don't need to install them separately unless your `package.json` is missing them.

## Why a service + directive, and not a copy of `@purplecallio/react`

- **Service instead of a Provider/Context.** Angular already has a first-class DI-based way to share app-wide state — an `@Injectable({ providedIn: 'root' })` service — so there's no need for a `<Module>`-style wrapper component the way React needs `MeetingProvider`.
- **RxJS observables instead of framework state.** `connectionState$`, `participants$`, `media$`, `remoteStream$`, `localStream$` and `participantId$` compose naturally with `async` pipes, `combineLatest`, etc.
- **No raw engine leak.** `@purplecallio/react`'s `MeetingContextValue` exposes `engine: PurpleCallioMeeting | null`, letting consumers reach past the adapter and call the underlying engine directly (which is also how a subtle bug slipped in there — see below). `PurpleCallioService` deliberately keeps the engine private and only exposes the same operations through its own methods, so there is exactly one code path to audit and test.
- **Directive instead of a component for video.** `purplecallioVideo` is a plain attribute directive on your own `<video>` element, so it composes with whatever attributes/classes/bindings you already put there, instead of introducing a wrapper element or an `ng-content` passthrough.

### A bug we deliberately did not copy

At the time of writing, `@purplecallio/react`'s `MeetingContextValue.toggleCamera` calls `engine.camera.enable()` (always turns the camera *on*) instead of `engine.camera.toggle()`, and `toggleMicrophone` calls `engine.microphone.disable()` (always turns the mic *off*) instead of toggling it. `PurpleCallioService.camera.toggle()` / `.microphone.toggle()` call the engine's real `.toggle()` method, and `packages/angular/tests/purplecallio.service.spec.ts` has regression tests pinned specifically against this class of bug.

## Usage

### 1. Provide the service (no NgModule wiring needed)

`PurpleCallioService` is `providedIn: 'root'`, so it's available for injection anywhere without adding it to any module or component `providers` array.

### 2. A complete call component

```ts
// call.component.ts
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PurpleCallioService,
  PurpleCallioVideoDirective,
  type ConnectionState,
} from '@purplecallio/angular';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule, PurpleCallioVideoDirective],
  template: `
    <p>Status: {{ connectionState$ | async }}</p>

    <video purplecallioVideo [stream]="localStream$ | async" [muted]="true"></video>
    <video purplecallioVideo [stream]="remoteStream$ | async" [muted]="false"></video>

    <button (click)="meeting.camera.toggle()">Toggle camera</button>
    <button (click)="meeting.microphone.toggle()">Toggle mic</button>
    <button (click)="leave()">Leave</button>
  `,
})
export class CallComponent implements OnInit, OnDestroy {
  readonly meeting = inject(PurpleCallioService);

  readonly connectionState$: import('rxjs').Observable<ConnectionState> =
    this.meeting.connectionState$;
  readonly localStream$ = this.meeting.localStream$;
  readonly remoteStream$ = this.meeting.remoteStream$;

  async ngOnInit(): Promise<void> {
    // `token`, `callId` and `signalUrl` below come from YOUR backend, which
    // called @purplecallio/sdk's PurpleCallioClient server-side using your
    // API key. Never fetch or construct an API key here.
    const { token, callId, signalUrl } = await this.fetchCallCredentialsFromMyBackend();

    this.meeting.configure({ token, callId, signalUrl, video: true, audio: true });
    await this.meeting.join();
  }

  async leave(): Promise<void> {
    await this.meeting.leave();
  }

  async ngOnDestroy(): Promise<void> {
    // The service is providedIn: 'root', so it is NOT destroyed when this
    // component is — always leave explicitly when navigating away.
    await this.meeting.leave();
  }

  private async fetchCallCredentialsFromMyBackend() {
    const res = await fetch('/api/calls/join', { method: 'POST' });
    return (await res.json()) as {
      token: string;
      callId: string;
      signalUrl: string;
    };
  }
}
```

See `packages/angular/examples/call.component.ts` for the same example as a standalone, runnable file.

## API reference

### `PurpleCallioService`

```ts
configure(config: {
  token: string;       // participant token from YOUR backend — never an API key
  callId: string;
  signalUrl: string;
  video?: boolean;      // default true
  audio?: boolean;      // default true
  iceServers?: RTCIceServer[];
}): void;

join(): Promise<void>;
leave(): Promise<void>;

connectionState$: Observable<ConnectionState>;
participants$: Observable<Participant[]>;
media$: Observable<{ camera: boolean; microphone: boolean; screenShare: boolean }>;
remoteStream$: Observable<MediaStream | null>;
localStream$: Observable<MediaStream | null>;
participantId$: Observable<string | null>;

camera: { enable(): void; disable(): void; toggle(): void; isEnabled(): boolean };
microphone: { enable(): void; disable(): void; toggle(): void; isEnabled(): boolean };
screenShare: { start(): Promise<void>; stop(): Promise<void>; isActive(): boolean };
```

`configure()` throws if called again while a previous call is still active — call `leave()` first if you need to switch rooms. Any method other than `configure()` throws a descriptive error if called before `configure()`.

Because the service is `providedIn: 'root'`, `ngOnDestroy` only runs when the whole app's injector is destroyed (i.e. essentially never, in a normal SPA lifetime) — it is a best-effort safety net, not a substitute for calling `leave()` yourself when the user navigates away from a call.

### `purplecallioVideo` directive

```html
<video purplecallioVideo [stream]="someStream" [muted]="true" [autoplay]="true" [playsInline]="true"></video>
```

Binds `stream` (a `MediaStream | null | undefined`) to the `<video>` element's `srcObject`. `muted` defaults to `true` (safe for a local self-preview); set it to `false` explicitly to hear a remote participant. Clears `srcObject` automatically when the stream changes to `null`/`undefined` or when the host element is destroyed.

## Development

```bash
npm install                          # from the repo root
npm run build -w @purplecallio/angular
npm run test -w @purplecallio/angular
```

Tests use `vitest` and a lightweight fake engine (`tests/fake-meeting.ts`) — no browser, no real WebRTC/socket connections, no Angular `TestBed`/Karma. Angular decorators (`@Injectable`, `@Directive`, etc.) are plain metadata, so the service and directive are instantiated directly with `new` in tests.

## License

MIT
