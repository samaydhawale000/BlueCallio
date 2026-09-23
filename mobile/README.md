# PurpleCallio native platform foundations (Flutter / iOS / Android)

**Status: architecture foundation only. Not functional. Not built. Not tested.**

Do not advertise any package in this directory as a supported SDK on the
website or in marketing copy. Nothing here should be published to pub.dev,
CocoaPods/SPM, or Maven.

## Why this is foundation-only, not a working SDK

`@purplecallio/sdk` (the core JS engine) is reused unmodified by
`@purplecallio/react-native` because React Native's JS runtime can load it
directly once `react-native-webrtc` polyfills the same global WebRTC API
surface (`RTCPeerConnection`, `mediaDevices`, `MediaStream`, ...) the engine
already calls. That trick has no equivalent for Flutter, iOS, or Android:
there is no shared JS runtime to reuse. Each of these requires the meeting
engine's logic — connection state machine, signaling event handling, peer
connection lifecycle, media control — to be **reimplemented natively** in
Dart, Swift, and Kotlin respectively, each wired to a native WebRTC binding
(`flutter_webrtc` / GoogleWebRTC or `WebRTC.xcframework` / `org.webrtc`).

That is a substantial, independent engineering effort per platform —
realistically each is its own multi-week native SDK project requiring:
- a real WebRTC binary dependency (large, fetched via CocoaPods/SPM/Gradle/pub)
- a real Xcode project + iOS simulator/device to build and test against
- a real Android Studio project + emulator/device to build and test against
- a real Flutter SDK + platform channel wiring to native code on both sides

**None of these toolchains are available in the environment this was built
in** (no Xcode.app — only Command Line Tools, no Android SDK/Gradle/JDK, no
Flutter SDK installed). Nothing under `mobile/` has been compiled, run, or
verified. Treat every file here as a design/scaffold artifact, not working
code.

## What's actually here

For each platform: a real, idiomatic project skeleton (the file layout a
real SDK would use) and an API surface designed against the same
conceptual model used by every other PurpleCallio package (client
config → room/call → participants → connection state → media
controls → events) — see each platform's own `STATUS.md` for exactly
what's stubbed vs. designed.

## Consistent conceptual model (mirrors every JS/TS package)

- Configuration: participant token (never an API key) + call id + signaling URL.
- `ConnectionState`: idle → connecting → joining → joined/connected →
  leaving → disconnected (+ error/reconnecting).
- `Participant`: id, role (caller/receiver), media flags (camera/mic/screen).
- Local media controls: camera enable/disable/toggle, microphone
  enable/disable/toggle. Screen share is out of scope for all three
  platforms in this foundation (it requires its own native OS integration —
  Broadcast Upload Extension on iOS, MediaProjection on Android/Flutter —
  layered on top of a working call engine that doesn't exist yet here).
- Events: connected, disconnected, reconnected, participant joined/left/updated,
  remote stream received/ended.

## Recommended next step

Hand each platform to an engineer with the matching native toolchain
(Xcode, Android Studio, Flutter SDK) to implement the WebRTC binding and
signaling client against the same backend protocol `@purplecallio/sdk`
uses (`packages/sdk/src/transport/socket.ts` — socket.io events — and
`packages/sdk/src/signaling/events.ts` for the exact event/payload
contract), verify against real devices, then publish under the naming
convention: "PurpleCallio Flutter SDK", "PurpleCallio iOS SDK",
"PurpleCallio Android SDK".
