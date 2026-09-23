# Status: PurpleCallio iOS SDK

**Foundation only. Not functional. Not built into a real framework. Do not publish.**

## What exists (and was actually verified)

- `Package.swift` — real SPM manifest shape, targeting iOS 13+.
- `Sources/PurpleCallio/PurpleCallio.swift` — the intended public Swift
  API (`PurpleCallioMeeting`, `PurpleCallioMeetingConfig`,
  `PurpleCallioConnectionState`, `PurpleCallioParticipant`,
  `PurpleCallioMeetingDelegate`), matching the same concepts as every
  other PurpleCallio package. Every method throws
  `PurpleCallioError.notImplemented` — intentional, so misuse fails
  loudly instead of silently no-op'ing.
- **This file was actually type-checked** with the standalone Swift
  compiler available in this environment: `swiftc -typecheck
  Sources/PurpleCallio/PurpleCallio.swift` — passed with zero errors.
  That confirms the Swift syntax/types are valid, nothing more — it was
  not compiled as part of an Xcode project, not linked, not run.

## What does NOT exist (the actual SDK)

- No WebRTC dependency (no `RTCPeerConnection` wiring) — this repo has no
  network-fetched `WebRTC.xcframework`/CocoaPods `GoogleWebRTC` pod
  resolved anywhere.
- No signaling client implementing the event contract from
  `packages/sdk/src/signaling/events.ts` / `transport/socket.ts`.
- No `AVCaptureDevice`/`AVAudioSession` permission or audio-routing code.
- No Xcode project, no `Info.plist`, no example app, nothing run on a
  simulator or device.

## Why

This environment has Command Line Tools' standalone `swift`/`swiftc`
compiler (confirmed working, used above) but **not** a full `Xcode.app`
install (`xcodebuild -version` fails: "requires Xcode, but active
developer directory is a command line tools instance") — so there is no
iOS SDK, no simulator, and no way to build an actual `.xcframework` or
run anything against `UIKit`/`AVFoundation`/WebRTC here.

## Recommended next step

An iOS engineer with a full Xcode install should: add a WebRTC binary
dependency, implement the signaling client against the event contract
referenced above, wire `AVCaptureDevice`/`AVAudioSession` permission and
routing logic, add the required Info.plist usage-description keys, build
a minimal example app, and test on a simulator and real device before
this is published or advertised anywhere.
