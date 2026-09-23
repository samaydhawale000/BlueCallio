import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { RTCView } from 'react-native-webrtc';

export interface PurpleCallioVideoViewProps {
  /**
   * The stream to render — typically `localStream` or a participant's
   * remote stream from `useMeeting()`. When `null`/`undefined`, nothing is
   * rendered (an empty placeholder `View` keeping `style`'s layout box, so
   * surrounding layouts don't jump around while a stream is still loading).
   */
  stream: MediaStream | null | undefined;
  /** Matches the CSS `object-fit` semantics. Default: 'cover'. */
  objectFit?: 'cover' | 'contain';
  /** Mirror the video horizontally — typically used for the front camera. */
  mirror?: boolean;
  /** z-order among overlapping `PurpleCallioVideoView`s (see react-native-webrtc's `RTCView`). */
  zOrder?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Renders a `MediaStream` on React Native.
 *
 * Unlike web, where a stream is attached via `<video srcObject={stream} />`,
 * `react-native-webrtc` renders via its native `<RTCView streamURL={...} />`
 * component, which takes the stream's `.toURL()` id rather than the stream
 * object itself. This component wraps that difference away so consumers can
 * work with the same `MediaStream` objects `@purplecallio/sdk` already
 * exposes (`localStreamRef`, `remoteStream`, `on('remote.stream', ...)`).
 */
export function PurpleCallioVideoView({
  stream,
  objectFit = 'cover',
  mirror = false,
  zOrder,
  style,
  testID,
}: PurpleCallioVideoViewProps) {
  if (!stream) {
    return <View style={[styles.placeholder, style]} testID={testID} />;
  }

  // `stream` is typed as the ambient DOM `MediaStream` (that's what
  // @purplecallio/sdk's public types use — see tsconfig.json's note on the
  // "DOM" lib). At runtime on React Native it is always actually a
  // react-native-webrtc `MediaStream` instance (once `registerGlobals()`
  // has run), which additionally exposes `.toURL()` for `RTCView`. That
  // extra method isn't part of the DOM lib's `MediaStream` shape, hence the
  // cast.
  const streamURL = (stream as unknown as { toURL(): string }).toURL();

  return (
    <RTCView
      streamURL={streamURL}
      objectFit={objectFit}
      mirror={mirror}
      zOrder={zOrder}
      style={[styles.video, style]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D1425',
  },
});
