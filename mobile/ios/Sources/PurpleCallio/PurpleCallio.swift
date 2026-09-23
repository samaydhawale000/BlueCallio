import Foundation

// PurpleCallio iOS SDK — public API design (FOUNDATION ONLY).
//
// See ../../STATUS.md. This file type-checks in isolation (pure
// Foundation, no WebRTC dependency yet) but implements nothing — every
// method throws `PurpleCallioError.notImplemented` so misuse fails
// loudly instead of silently no-op'ing.
//
// Conceptual model mirrors every other PurpleCallio package (see
// ../../../README.md "Consistent conceptual model"): configuration
// (participant token, never an API key) → join → connection state →
// participants → local/remote media → events → leave/cleanup.

public enum PurpleCallioConnectionState: String {
    case idle, connecting, authenticating, authenticated, joining, joined
    case connected, reconnecting, leaving, disconnected, closed, error
}

public enum PurpleCallioParticipantRole: String {
    case caller = "CALLER"
    case receiver = "RECEIVER"
}

public struct PurpleCallioParticipantMedia {
    public let camera: Bool
    public let microphone: Bool

    public init(camera: Bool, microphone: Bool) {
        self.camera = camera
        self.microphone = microphone
    }
}

public struct PurpleCallioParticipant {
    public let participantId: String
    public let role: PurpleCallioParticipantRole
    public let media: PurpleCallioParticipantMedia?

    public init(participantId: String, role: PurpleCallioParticipantRole, media: PurpleCallioParticipantMedia? = nil) {
        self.participantId = participantId
        self.role = role
        self.media = media
    }
}

public enum PurpleCallioError: Error, CustomStringConvertible {
    case notImplemented(String)

    public var description: String {
        switch self {
        case .notImplemented(let feature):
            return "\(feature) is not implemented — this is an architecture " +
                "foundation only. See mobile/ios/STATUS.md."
        }
    }
}

/// Configuration for `PurpleCallioMeeting`. `token` MUST be a short-lived
/// **participant token** minted by your own backend (which calls the
/// PurpleCallio REST API server-side with your API key). Never embed an
/// API key in an iOS app.
public struct PurpleCallioMeetingConfig {
    public let token: String
    public let callId: String
    public let signalUrl: String
    public let video: Bool
    public let audio: Bool

    public init(token: String, callId: String, signalUrl: String, video: Bool = true, audio: Bool = true) {
        self.token = token
        self.callId = callId
        self.signalUrl = signalUrl
        self.video = video
        self.audio = audio
    }
}

/// Delegate protocol mirroring the JS SDK's `on(event, listener)` surface
/// (`packages/sdk/src/signaling/events.ts`), expressed idiomatically for
/// Swift as delegate callbacks instead of a generic event emitter.
public protocol PurpleCallioMeetingDelegate: AnyObject {
    func meeting(_ meeting: PurpleCallioMeeting, didChangeConnectionState state: PurpleCallioConnectionState)
    func meeting(_ meeting: PurpleCallioMeeting, didUpdateParticipants participants: [PurpleCallioParticipant])
    func meeting(_ meeting: PurpleCallioMeeting, didReceiveRemoteStreamID streamID: String)
    func meetingDidEndRemoteStream(_ meeting: PurpleCallioMeeting)
}

/// Headless meeting engine — the Swift equivalent of
/// `packages/sdk/src/meeting/meeting.ts`'s `PurpleCallioMeeting`.
///
/// NOT IMPLEMENTED. A real implementation requires:
///  - a native `RTCPeerConnection` (via a WebRTC binary dependency —
///    e.g. Google's `WebRTC.xcframework` through an SPM/CocoaPods
///    package),
///  - a signaling client (WebSocket, e.g. `URLSessionWebSocketTask` or a
///    socket.io-compatible Swift client) speaking the exact event
///    contract in `packages/sdk/src/signaling/events.ts`,
///  - `AVCaptureDevice` permission handling for camera/microphone
///    (`NSCameraUsageDescription`/`NSMicrophoneUsageDescription` in
///    Info.plist, requested via `AVCaptureDevice.requestAccess`),
///  - `AVAudioSession` configuration for call audio routing
///    (speaker/earpiece, interruption handling for incoming phone calls),
///  - background/foreground lifecycle handling via
///    `UIApplication.willResignActiveNotification` etc.,
///  - and real-device/simulator testing before this can be considered a
///    working SDK.
public final class PurpleCallioMeeting {
    public weak var delegate: PurpleCallioMeetingDelegate?

    private let config: PurpleCallioMeetingConfig

    public init(config: PurpleCallioMeetingConfig) {
        self.config = config
    }

    public func join() async throws {
        throw PurpleCallioError.notImplemented("PurpleCallioMeeting.join()")
    }

    public func leave() async throws {
        throw PurpleCallioError.notImplemented("PurpleCallioMeeting.leave()")
    }

    public func connectionState() -> PurpleCallioConnectionState {
        .idle
    }

    public func participants() -> [PurpleCallioParticipant] {
        []
    }

    /// Would enable/disable/toggle the local camera track, mirroring
    /// `engine.camera` in the JS SDK.
    public func setCameraEnabled(_ enabled: Bool) throws {
        throw PurpleCallioError.notImplemented("Camera control")
    }

    /// Would enable/disable/toggle the local microphone track, mirroring
    /// `engine.microphone` in the JS SDK.
    public func setMicrophoneEnabled(_ enabled: Bool) throws {
        throw PurpleCallioError.notImplemented("Microphone control")
    }
}
