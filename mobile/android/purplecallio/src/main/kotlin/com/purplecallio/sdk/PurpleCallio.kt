package com.purplecallio.sdk

/**
 * PurpleCallio Android SDK — public API design (FOUNDATION ONLY).
 *
 * See ../../../../../../STATUS.md. Unlike the iOS foundation file, this
 * one has NOT been compiled or type-checked — no Kotlin compiler is
 * available in this environment. Treat it as a design sketch: plausible
 * Kotlin, not verified Kotlin.
 *
 * Conceptual model mirrors every other PurpleCallio package: configuration
 * (participant token, never an API key) -> join -> connection state ->
 * participants -> local/remote media -> events -> leave/cleanup.
 */

enum class PurpleCallioConnectionState {
    IDLE, CONNECTING, AUTHENTICATING, AUTHENTICATED, JOINING, JOINED,
    CONNECTED, RECONNECTING, LEAVING, DISCONNECTED, CLOSED, ERROR,
}

enum class PurpleCallioParticipantRole { CALLER, RECEIVER }

data class PurpleCallioParticipantMedia(
    val camera: Boolean,
    val microphone: Boolean,
)

data class PurpleCallioParticipant(
    val participantId: String,
    val role: PurpleCallioParticipantRole,
    val media: PurpleCallioParticipantMedia? = null,
)

/**
 * Configuration for [PurpleCallioMeeting]. [token] MUST be a short-lived
 * **participant token** minted by your own backend (which calls the
 * PurpleCallio REST API server-side with your API key). Never embed an
 * API key in an Android app.
 */
data class PurpleCallioMeetingConfig(
    val token: String,
    val callId: String,
    val signalUrl: String,
    val video: Boolean = true,
    val audio: Boolean = true,
)

/** Mirrors the JS SDK's `on(event, listener)` surface as a listener interface. */
interface PurpleCallioMeetingListener {
    fun onConnectionStateChanged(state: PurpleCallioConnectionState)
    fun onParticipantsChanged(participants: List<PurpleCallioParticipant>)
    fun onRemoteStreamReceived()
    fun onRemoteStreamEnded()
}

class PurpleCallioNotImplementedError(feature: String) : Exception(
    "$feature is not implemented — this is an architecture foundation only. " +
        "See mobile/android/STATUS.md."
)

/**
 * Headless meeting engine — the Kotlin equivalent of
 * `packages/sdk/src/meeting/meeting.ts`'s `PurpleCallioMeeting`.
 *
 * NOT IMPLEMENTED. A real implementation requires:
 *  - a native `PeerConnection` (via `org.webrtc:google-webrtc` or a
 *    maintained fork),
 *  - a signaling client speaking the exact event contract in
 *    `packages/sdk/src/signaling/events.ts` (a Kotlin socket.io client,
 *    e.g. `io.socket:socket.io-client`),
 *  - `Manifest.permission.CAMERA`/`RECORD_AUDIO` runtime permission
 *    handling,
 *  - `AudioManager` configuration for call audio routing
 *    (speaker/earpiece/Bluetooth) and `PhoneStateListener`/
 *    `TelephonyCallback` handling for interruption by real phone calls,
 *  - lifecycle handling via `ProcessLifecycleOwner` (foreground/background),
 *  - and real-device/emulator testing before this can be considered a
 *    working SDK.
 */
class PurpleCallioMeeting(private val config: PurpleCallioMeetingConfig) {

    var listener: PurpleCallioMeetingListener? = null

    suspend fun join() {
        throw PurpleCallioNotImplementedError("PurpleCallioMeeting.join()")
    }

    suspend fun leave() {
        throw PurpleCallioNotImplementedError("PurpleCallioMeeting.leave()")
    }

    fun connectionState(): PurpleCallioConnectionState = PurpleCallioConnectionState.IDLE

    fun participants(): List<PurpleCallioParticipant> = emptyList()

    /** Would enable/disable/toggle the local camera track, mirroring `engine.camera`. */
    fun setCameraEnabled(enabled: Boolean) {
        throw PurpleCallioNotImplementedError("Camera control")
    }

    /** Would enable/disable/toggle the local microphone track, mirroring `engine.microphone`. */
    fun setMicrophoneEnabled(enabled: Boolean) {
        throw PurpleCallioNotImplementedError("Microphone control")
    }
}
