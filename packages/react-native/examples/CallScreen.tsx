/**
 * A realistic, self-contained example screen showing the full flow this
 * package supports: configure -> request permissions -> join -> render
 * local + remote video -> toggle camera/mic -> switch camera -> leave.
 *
 * This file is illustrative only (not built/exported by the package) — copy
 * it into your app and adapt styling/navigation as needed.
 *
 * IMPORTANT: `registerGlobals()` from 'react-native-webrtc' must be called
 * once, at your app's entry point (e.g. index.js), before any of this runs.
 * See the README for full setup (Info.plist / AndroidManifest.xml keys).
 */
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

import {
  PurpleCallioProvider,
  PurpleCallioVideoView,
  useConnection,
  useMeeting,
  useNetworkState,
  useParticipants,
} from '@purplecallio/react-native';

export interface CallScreenProps {
  /**
   * A per-participant call token minted by YOUR OWN backend (typically via
   * @purplecallio/sdk's server-side `PurpleCallioClient`). Never an API key,
   * and never generated on-device.
   */
  token: string;
  callId: string;
  signalUrl: string;
  onLeave?: () => void;
}

export function CallScreen(props: CallScreenProps) {
  return (
    <PurpleCallioProvider
      token={props.token}
      callId={props.callId}
      signalUrl={props.signalUrl}
      video
      audio
      pauseVideoInBackground
    >
      <CallUI onLeave={props.onLeave} />
    </PurpleCallioProvider>
  );
}

function CallUI({ onLeave }: { onLeave?: () => void }) {
  const {
    join,
    leave,
    localStream,
    remoteStream,
    media,
    permissionsGranted,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    setSpeakerphoneOn,
    screenShare,
  } = useMeeting();
  const participants = useParticipants();
  const connectionState = useConnection();
  const network = useNetworkState();

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    setError(null);
    try {
      // Requests camera/mic permissions internally (no-op on iOS, an
      // explicit PermissionsAndroid prompt on Android) before joining.
      await join();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join the call.');
    } finally {
      setJoining(false);
    }
  }, [join]);

  const handleLeave = useCallback(async () => {
    await leave();
    onLeave?.();
  }, [leave, onLeave]);

  const handleShareScreen = useCallback(async () => {
    try {
      // Always rejects on React Native today — see README "Known
      // Limitations". Surfacing the real error rather than pretending it
      // worked.
      await screenShare.start();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Screen sharing is unavailable.');
    }
  }, [screenShare]);

  const joined = connectionState === 'connected' || connectionState === 'joined';

  return (
    <View style={styles.container}>
      {network.supported && network.isConnected === false && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You're offline</Text>
        </View>
      )}

      <View style={styles.videoArea}>
        <PurpleCallioVideoView stream={remoteStream} objectFit="cover" style={StyleSheet.absoluteFill} />
        <PurpleCallioVideoView stream={localStream} objectFit="cover" mirror style={styles.localPreview} />
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>
          {connectionState} · {participants.length} participant{participants.length === 1 ? '' : 's'}
        </Text>
        {permissionsGranted === false && <Text style={styles.errorText}>Permissions were denied.</Text>}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.controls}>
        {!joined ? (
          <Button title={joining ? 'Joining…' : 'Join call'} onPress={handleJoin} disabled={joining} />
        ) : (
          <>
            <Button title={media.camera ? 'Turn camera off' : 'Turn camera on'} onPress={toggleCamera} />
            <Button title={media.microphone ? 'Mute' : 'Unmute'} onPress={toggleMicrophone} />
            <Button title="Switch camera" onPress={switchCamera} />
            <Button title="Speaker on" onPress={() => setSpeakerphoneOn(true)} />
            <Button title="Speaker off" onPress={() => setSpeakerphoneOn(false)} />
            <Button title="Share screen (unsupported)" onPress={handleShareScreen} />
            <Button title="Leave" color="#DC2626" onPress={handleLeave} />
          </>
        )}
        {joining && <ActivityIndicator />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1425',
  },
  videoArea: {
    flex: 1,
    position: 'relative',
  },
  localPreview: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusRow: {
    padding: 12,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    marginTop: 4,
  },
  offlineBanner: {
    backgroundColor: '#7C2D12',
    padding: 8,
  },
  offlineText: {
    color: '#FED7AA',
    textAlign: 'center',
    fontSize: 12,
  },
  controls: {
    padding: 12,
    gap: 8,
  },
});
