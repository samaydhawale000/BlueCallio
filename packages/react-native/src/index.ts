// Provider
export { PurpleCallioProvider, useMeetingContext } from './context';
export type { PurpleCallioProviderProps, MeetingContextValue, ScreenShareControls } from './context';

// Hooks
export { useMeeting, useParticipants, useParticipant, useConnection, useDevices, useNetworkState } from './hooks';
export type { DeviceInfo, DevicesResult, NetworkState } from './hooks';

// Rendering
export { PurpleCallioVideoView } from './components/VideoView';
export type { PurpleCallioVideoViewProps } from './components/VideoView';

// Permissions
export { requestMediaPermissions } from './permissions';
export type { RequestMediaPermissionsOptions } from './permissions';

// Errors
export { PurpleCallioUnsupportedFeatureError } from './errors';

// Standalone audio-routing helper (also available via useMeeting().setSpeakerphoneOn,
// which is the same underlying bridge instance).
import { inCallManager } from './optional/inCallManager';
export function setSpeakerphoneOn(enabled: boolean): void {
  inCallManager.setSpeakerphoneOn(enabled);
}
