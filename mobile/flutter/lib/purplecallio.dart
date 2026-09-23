/// PurpleCallio Flutter SDK — public API design (FOUNDATION ONLY).
///
/// See ../STATUS.md. Every method below documents what it *would* do;
/// none of them are implemented — each throws [UnimplementedError] so
/// that accidentally depending on this package fails loudly instead of
/// silently pretending to work.
///
/// The conceptual model mirrors every other PurpleCallio package
/// (see ../../README.md "Consistent conceptual model"): configuration
/// (participant token, never an API key) → join → connection state →
/// participants → local/remote media → events → leave/cleanup.
library purplecallio_flutter;

/// Connection state machine — mirrors `ConnectionState` in
/// `packages/sdk/src/types/index.ts`, so app code reasons about state
/// identically across every PurpleCallio platform.
enum PurpleCallioConnectionState {
  idle,
  connecting,
  authenticating,
  authenticated,
  joining,
  joined,
  connected,
  reconnecting,
  leaving,
  disconnected,
  closed,
  error,
}

enum PurpleCallioParticipantRole { caller, receiver }

class PurpleCallioParticipantMedia {
  final bool camera;
  final bool microphone;

  const PurpleCallioParticipantMedia({
    required this.camera,
    required this.microphone,
  });
}

class PurpleCallioParticipant {
  final String participantId;
  final PurpleCallioParticipantRole role;
  final PurpleCallioParticipantMedia? media;

  const PurpleCallioParticipant({
    required this.participantId,
    required this.role,
    this.media,
  });
}

/// Configuration for [PurpleCallioMeeting]. `token` MUST be a short-lived
/// **participant token** minted by your own backend (which calls the
/// PurpleCallio REST API server-side with your API key). Never embed an
/// API key in a mobile app.
class PurpleCallioMeetingConfig {
  final String token;
  final String callId;
  final String signalUrl;
  final bool video;
  final bool audio;

  const PurpleCallioMeetingConfig({
    required this.token,
    required this.callId,
    required this.signalUrl,
    this.video = true,
    this.audio = true,
  });
}

/// Headless meeting engine — the Dart equivalent of
/// `packages/sdk/src/meeting/meeting.ts`'s `PurpleCallioMeeting`.
///
/// NOT IMPLEMENTED. A real implementation requires:
///  - a native WebRTC peer connection (via `flutter_webrtc` platform
///    channels to GoogleWebRTC on both iOS and Android),
///  - a socket.io signaling client speaking the exact event contract in
///    `packages/sdk/src/signaling/events.ts` (connected, participant.*,
///    camera.*/microphone.*, offer/answer/ice-candidate, call.started/ended),
///  - device permission handling (camera/microphone) via Flutter's
///    permission plugins on both platforms,
///  - and real-device testing on both iOS and Android before this can be
///    considered a working SDK.
class PurpleCallioMeeting {
  // ignore: unused_field
  final PurpleCallioMeetingConfig _config;

  PurpleCallioMeeting(this._config);

  Future<void> join() {
    throw UnimplementedError(
      'PurpleCallioMeeting.join() is not implemented — this is an '
      'architecture foundation only. See mobile/flutter/STATUS.md.',
    );
  }

  Future<void> leave() {
    throw UnimplementedError(
      'PurpleCallioMeeting.leave() is not implemented — this is an '
      'architecture foundation only. See mobile/flutter/STATUS.md.',
    );
  }

  PurpleCallioConnectionState connectionState() =>
      PurpleCallioConnectionState.idle;

  List<PurpleCallioParticipant> participants() => const [];

  /// Would enable/disable/toggle the local camera track, mirroring
  /// `engine.camera` in the JS SDK.
  Future<void> setCameraEnabled(bool enabled) {
    throw UnimplementedError(
      'Camera control is not implemented — see mobile/flutter/STATUS.md.',
    );
  }

  /// Would enable/disable/toggle the local microphone track, mirroring
  /// `engine.microphone` in the JS SDK.
  Future<void> setMicrophoneEnabled(bool enabled) {
    throw UnimplementedError(
      'Microphone control is not implemented — see mobile/flutter/STATUS.md.',
    );
  }
}
