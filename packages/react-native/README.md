# @purplecallio/react-native

Official React Native components and hooks for [PurpleCallio](https://purplecallio.com), a
developer-first real-time communication platform for integrating voice, video and WebRTC
communication into applications.

This package is a **framework adapter**, not a WebRTC reimplementation: it wraps
[`@purplecallio/sdk`](../sdk)'s headless `PurpleCallioMeeting` engine — used here completely
unmodified — with the things that are genuinely different about React Native: runtime
permissions, app lifecycle, native video rendering, camera switching, and call audio routing.
The actual signaling/WebRTC logic all lives in `@purplecallio/sdk`, running against
[`react-native-webrtc`](https://github.com/jitsi/react-native-webrtc)'s polyfilled globals.

## How this works

`PurpleCallioMeeting` is written directly against bare global WebRTC APIs
(`navigator.mediaDevices.getUserMedia`, `RTCPeerConnection`, `MediaStream`, ...) — it doesn't
import them from anywhere, it assumes they exist as globals. `react-native-webrtc`'s
`registerGlobals()` installs native-backed implementations of exactly those globals (the same
pattern used by LiveKit, Twilio Video, Daily, etc.), so the same engine that powers
`@purplecallio/react` on web runs unmodified on React Native.

## Install

```sh
npm install @purplecallio/react-native @purplecallio/sdk react-native-webrtc
```

Optional, but recommended for production call UX:

```sh
npm install react-native-incall-manager @react-native-community/netinfo
```

### 1. `react-native-webrtc` setup

Follow [react-native-webrtc's installation guide](https://github.com/jitsi/react-native-webrtc)
for your RN version (autolinking + a `pod install` on iOS). Then, **once, at your app's entry
point** (e.g. `index.js`, before anything else touches WebRTC):

```js
import { registerGlobals } from 'react-native-webrtc';
registerGlobals();
```

This installs `RTCPeerConnection`, `mediaDevices.getUserMedia`, `MediaStream`,
`RTCSessionDescription`, `RTCIceCandidate`, etc. as globals — without this call,
`@purplecallio/sdk`'s engine has nothing to run against on React Native.

### 2. iOS — Info.plist

iOS prompts for camera/microphone access automatically the first time `getUserMedia()` is
called, but only if your `Info.plist` declares why:

```xml
<key>NSCameraUsageDescription</key>
<string>Used for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>Used for audio in calls</string>
```

This is app-level native configuration this package cannot inject for you — without these keys,
`getUserMedia()` will reject at runtime instead of prompting.

### 3. Android — AndroidManifest.xml

Android requires an explicit *runtime* permission request (handled for you by
`requestMediaPermissions()` / the provider, see below) on top of declaring the permissions:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.BLUETOOTH" />
```

### 4. Optional: `react-native-incall-manager`

`react-native-webrtc` doesn't manage call audio routing (speaker/earpiece/Bluetooth) on its
own. If `react-native-incall-manager` is installed, `<PurpleCallioProvider>` automatically calls
its `start()`/`stop()` on `join()`/`leave()`, and `setSpeakerphoneOn()` becomes functional.
**If it isn't installed, nothing crashes** — audio routing is simply left to the OS default, and
a one-time console warning is logged the first time it would have been used.

### 5. Optional: `@react-native-community/netinfo`

If installed, `useNetworkState()` surfaces live connectivity info (`isConnected`,
`isInternetReachable`, `type`) for your own "you're offline" UI. If it isn't installed,
`useNetworkState()` returns `{ supported: false, isConnected: null, isInternetReachable: null,
type: null }` and logs a one-time console warning the first time it's used.

## Usage

```tsx
import React, { useCallback } from 'react';
import { View, Button, Text } from 'react-native';
import {
  PurpleCallioProvider,
  PurpleCallioVideoView,
  useMeeting,
  useParticipants,
  useConnection,
  useNetworkState,
} from '@purplecallio/react-native';

// `token` comes from YOUR OWN backend (a per-participant call token it
// mints via @purplecallio/sdk's server-side PurpleCallioClient) — never an
// API key, and never something this package or your client app generates.
function CallScreen({ token, callId, signalUrl }: { token: string; callId: string; signalUrl: string }) {
  return (
    <PurpleCallioProvider token={token} callId={callId} signalUrl={signalUrl} video audio>
      <CallUI />
    </PurpleCallioProvider>
  );
}

function CallUI() {
  const {
    join,
    leave,
    localStream,
    remoteStream,
    media,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    setSpeakerphoneOn,
  } = useMeeting();
  const participants = useParticipants();
  const connectionState = useConnection();
  const network = useNetworkState();

  const handleJoin = useCallback(async () => {
    // <PurpleCallioProvider> already calls requestMediaPermissions()
    // automatically before join() for you. Calling it earlier yourself
    // (e.g. on a "grant permissions" screen before showing the "Join"
    // button) is also fine and often better UX.
    await join();
  }, [join]);

  return (
    <View style={{ flex: 1 }}>
      {network.supported && network.isConnected === false && <Text>You're offline</Text>}
      <Text>Connection: {connectionState}</Text>
      <Text>Participants: {participants.length}</Text>

      <PurpleCallioVideoView stream={remoteStream} style={{ flex: 1 }} objectFit="cover" />
      <PurpleCallioVideoView
        stream={localStream}
        style={{ width: 120, height: 160, position: 'absolute', top: 16, right: 16 }}
        objectFit="cover"
        mirror
      />

      <Button title="Join" onPress={handleJoin} />
      <Button title={media.camera ? 'Camera off' : 'Camera on'} onPress={toggleCamera} />
      <Button title={media.microphone ? 'Mute' : 'Unmute'} onPress={toggleMicrophone} />
      <Button title="Switch camera" onPress={switchCamera} />
      <Button title="Speaker" onPress={() => setSpeakerphoneOn(true)} />
      <Button title="Leave" onPress={() => leave()} />
    </View>
  );
}
```

See [`examples/CallScreen.tsx`](./examples/CallScreen.tsx) for a fuller, self-contained version
of this flow.

## API

- **`<PurpleCallioProvider token callId signalUrl video? audio? iceServers? overrideIceServers?
  pauseVideoInBackground? children>`** — constructs and owns the `PurpleCallioMeeting` engine.
  `pauseVideoInBackground` (default `true`): automatically disables the camera when the app is
  backgrounded (via `AppState`) and restores it on foreground, but only if it was your app — not
  the user — that turned it off. Set to `false` to manage this yourself.
- **`useMeeting()`** — the full context value: `engine`, `connectionState`, `participants`,
  `media`, `localStream`, `remoteStream`, `permissionsGranted`, `join()`, `leave()`,
  `toggleCamera()`, `toggleMicrophone()`, `enableCamera()`/`disableCamera()`,
  `enableMicrophone()`/`disableMicrophone()`, `screenShare` (see Known Limitations),
  `switchCamera()`, `setSpeakerphoneOn()`.
- **`useParticipants()`** / **`useParticipant(id)`** / **`useConnection()`** — same names and
  meaning as `@purplecallio/react`, for cross-platform consistency.
- **`useDevices()`** — `{ audioInputs, videoInputs, audioOutputs, loading, refresh }` from
  `react-native-webrtc`'s `mediaDevices.enumerateDevices()`. `audioOutputs` is always `[]` — there
  is no meaningful `audiooutput` *device* to select on mobile the way there is on web; that's an
  OS-level speaker/earpiece/Bluetooth routing concern. Use `switchCamera()` (front/back camera)
  and `setSpeakerphoneOn()` (speaker vs. earpiece) instead.
- **`useNetworkState()`** — `{ supported, isConnected, isInternetReachable, type }` from the
  optional `@react-native-community/netinfo` peer dependency. Does **not** drive any
  reconnection logic — purely informational, for your own UI.
- **`<PurpleCallioVideoView stream={MediaStream | null} objectFit="cover"|"contain" mirror?
  style? />`** — renders a `MediaStream` via `react-native-webrtc`'s `RTCView` (which takes
  `stream.toURL()`, not `srcObject` like web's `<video>`). Renders an empty placeholder `View`
  when `stream` is `null`/`undefined`.
- **`requestMediaPermissions({ audio?, video? })`** — Android: requests `RECORD_AUDIO`/`CAMERA`
  via `PermissionsAndroid.requestMultiple`. iOS: no-op that resolves `true` (see above).
  `<PurpleCallioProvider>` calls this automatically before `join()`.
- **`switchCamera()`** — swaps the front/back camera on the live local video track
  (`react-native-webrtc`'s native `_switchCamera()`). This is a mobile-only concept; there is no
  equivalent in `@purplecallio/react`.
- **`setSpeakerphoneOn(enabled)`** — forces call audio to the loudspeaker or the earpiece/default
  route, via the optional `react-native-incall-manager` peer dependency.
- **`PurpleCallioUnsupportedFeatureError`** — thrown by `screenShare.start()` (see below).

## Known Limitations

### Screen sharing is not implemented on React Native

Mobile screen capture requires OS-level native integration entirely different from web's
`getDisplayMedia`: iOS needs a **Broadcast Upload Extension** target in your Xcode project;
Android needs a foreground **`MediaProjection`** service. That's real native-project scaffolding
outside the scope of a pure JS/TS adapter package.

Calling `screenShare.start()` (from `useMeeting()`) always rejects with a
`PurpleCallioUnsupportedFeatureError`, and `screenShare.isActive()` always returns `false`. This
is not silently no-op'd, and it is not "coming soon" — it is a real, currently-unimplemented gap.
If your app needs mobile screen sharing today, you'll need to build the native extension/service
yourself and integrate it directly with `@purplecallio/sdk`'s lower-level `screenShare` controller
in `packages/sdk`, or track this package for future support.

### The `'reconnecting'` connection state

`ConnectionState` includes `'reconnecting'`, but the current core engine
(`packages/sdk/src/meeting/meeting.ts`) never actually sets it — a `reconnected` server event
sets the state directly back to `'connected'`. This package deliberately does not paper over
that by inventing its own reconnection state machine on top of the engine (that would duplicate
core-SDK logic and could drift from what actually happened on the wire). `connectionState`
faithfully passes through whatever `@purplecallio/sdk` reports today. If/when the core engine
starts emitting `'reconnecting'`, it will show up here automatically, with no changes needed in
this package.

### `useNetworkState()` doesn't drive reconnection

It's a read-only signal for your own UI (e.g. an offline banner). Actual reconnection behavior
is entirely up to `@purplecallio/sdk`'s signaling transport.

## Testing scope (what was actually verified)

This package was built and unit-tested with `vitest` — `react-native`, `react-native-webrtc`,
and `@purplecallio/sdk` are all mocked at the module level (see `tests/mocks/` and
`tests/fake-meeting.ts`), so these run in plain Node with no native RN toolchain, simulator, or
physical device involved. Coverage includes: permission-request branching (Android vs. iOS,
granted/denied/"never ask again"), the provider's state wiring against a fake engine (join/leave,
correct `toggle()` semantics, permission gating before `join()`), `AppState` background/foreground
camera pause + restore logic, the screen-share rejection behavior, `PurpleCallioVideoView`'s
`RTCView`/placeholder rendering, the optional InCallManager/NetInfo bridges (both "installed" and
"not installed" branches, via dependency injection rather than relying on real module presence),
and the device-enumeration/network-state hooks.

There is no Xcode/Android Studio project, simulator, or physical device available in this
environment, so this has **not** been run in a real React Native app — only unit-tested in Node
and smoke-tested via `npm pack` + a plain `require()` of the packed tarball (see the build
process) to confirm the published entry point resolves and exposes the expected exports.

## Why `tsconfig.json` includes `"DOM"` in `lib`

There's no `window`/`document` in React Native's JS engine, so this package's runtime code never
uses DOM APIs. However, `@purplecallio/sdk`'s public types (`EngineConfig`, `MeetingSnapshot`,
etc.) reference a few raw ambient DOM lib types as-is (`MediaStream`, `RTCIceServer`,
`RTCPeerConnection`) rather than SDK-defined ones. Without `"DOM"` in `lib`, those names simply
wouldn't resolve during type-checking. Adding `"DOM"` only feeds the TypeScript compiler — it has
zero effect on what's actually available at runtime on-device (`react-native-webrtc`'s
`registerGlobals()` is what provides the real implementations). This is the same pragmatic
approach commonly used around `react-native-webrtc`'s own TypeScript types. `packages/sdk`'s
types are not modified to work around this.
