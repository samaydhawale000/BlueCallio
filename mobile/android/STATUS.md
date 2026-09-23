# Status: PurpleCallio Android SDK

**Foundation only. Not functional. Not compiled. Not verified. Do not publish.**

## What exists

- `purplecallio/build.gradle.kts` — real Gradle module manifest shape
  (Android library module, `org.webrtc:google-webrtc` dependency
  commented in as the intended real dependency).
- `purplecallio/src/main/kotlin/com/purplecallio/sdk/PurpleCallio.kt` —
  the intended public Kotlin API (`PurpleCallioMeeting`,
  `PurpleCallioMeetingConfig`, `PurpleCallioConnectionState`,
  `PurpleCallioParticipant`, `PurpleCallioMeetingListener`), matching the
  same concepts as every other PurpleCallio package. Every method throws
  `PurpleCallioNotImplementedError` — intentional, so misuse fails loudly
  instead of silently no-op'ing.

## Unlike the iOS foundation, this Kotlin file was NOT type-checked

No Kotlin compiler (`kotlinc`), Gradle, Android SDK, or JDK is available
in this environment (`java -version` fails: "Unable to locate a Java
Runtime"; `gradle`/`adb`/`kotlinc` are all absent). The Swift foundation
file in `../ios/` was actually run through `swiftc -typecheck` and
verified — this Kotlin file could not be given the same treatment.
Treat it as a plausible design sketch, not verified code, until someone
with a real Android toolchain compiles it.

## What does NOT exist (the actual SDK)

- No WebRTC dependency resolved or wired (`PeerConnection` usage).
- No signaling client implementing the event contract from
  `packages/sdk/src/signaling/events.ts` / `transport/socket.ts`.
- No runtime permission request flow, no `AudioManager` routing, no
  `ProcessLifecycleOwner` background/foreground handling, no telephony
  interruption handling.
- No Gradle wrapper, no full Android project, no example app, nothing
  built or run on an emulator or device.

## Recommended next step

An Android engineer with a real toolchain (Android Studio, JDK, Gradle,
an emulator or device) should: verify this file actually compiles, add
the WebRTC dependency, implement the signaling client against the event
contract referenced above, wire runtime permissions and audio routing,
build a minimal example app, and test on an emulator/device before this
is published or advertised anywhere.
