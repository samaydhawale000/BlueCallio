# Status: PurpleCallio Flutter SDK

**Foundation only. Not functional. Not built. Not tested. Do not publish.**

## What exists

- `pubspec.yaml` — real package manifest shape, with `flutter_webrtc` and
  `socket_io_client` declared as the intended dependencies (not resolved —
  no Flutter SDK available in this environment to run `flutter pub get`).
- `lib/purplecallio.dart` — the intended public Dart API surface
  (`PurpleCallioMeeting`, `PurpleCallioMeetingConfig`,
  `PurpleCallioConnectionState`, `PurpleCallioParticipant`), matching the
  same concepts as every other PurpleCallio package. Every method throws
  `UnimplementedError` with a message pointing back here — this is
  intentional, so misuse fails loudly instead of silently no-op'ing.

## What does NOT exist (the actual SDK)

- No WebRTC peer connection wiring (`flutter_webrtc` platform channel
  usage).
- No signaling client implementing the socket.io event contract from
  `packages/sdk/src/signaling/events.ts` / `transport/socket.ts`.
- No camera/microphone permission handling.
- No Android or iOS platform-specific configuration (`AndroidManifest.xml`
  permissions, `Info.plist` usage-description keys, Gradle/CocoaPods
  wiring for the WebRTC binary).
- No tests, no example app, nothing run on a device or simulator.

## Why

Building this for real requires the Flutter SDK, an Android toolchain
(Android Studio/Gradle/JDK/emulator or device), and an iOS toolchain
(Xcode with a real `Xcode.app` install, not just Command Line Tools,
plus a simulator or device) — none of which are present in the
environment this was authored in (verified: `flutter`, `gradle`, `adb`,
and a full `xcodebuild` are all absent; only Command Line Tools' bare
`swift` compiler is present, which is not sufficient to build or test an
iOS framework).

## Recommended next step

A Flutter engineer with a real toolchain should: add `flutter_webrtc`,
implement the signaling client against the event contract referenced
above, wire camera/mic permissions via `permission_handler`, build a
minimal example app, and test on both an Android emulator/device and an
iOS simulator/device before this is published or advertised anywhere.
