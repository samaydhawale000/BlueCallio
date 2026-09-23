import { PermissionsAndroid, Platform } from 'react-native';

export interface RequestMediaPermissionsOptions {
  /** Request microphone (RECORD_AUDIO) access. Default: true. */
  audio?: boolean;
  /** Request camera access. Default: true. */
  video?: boolean;
}

/**
 * Requests the runtime OS permissions needed for `getUserMedia()` to
 * succeed on-device.
 *
 * - **Android** requires an explicit runtime permission request before
 *   camera/microphone access (`PermissionsAndroid.requestMultiple`), on top
 *   of declaring the permissions in AndroidManifest.xml (see README).
 * - **iOS** has no equivalent upfront JS-level permission API: the system
 *   prompt appears automatically the first time `getUserMedia()` is called,
 *   *provided* the app's Info.plist declares `NSCameraUsageDescription`
 *   and/or `NSMicrophoneUsageDescription` (an app-level native config this
 *   package cannot inject — see README). So on iOS this function is a
 *   deliberate no-op that resolves `true`; if Info.plist is missing the
 *   required keys, `getUserMedia()` itself will reject when called, not
 *   this function.
 *
 * `<PurpleCallioProvider>` calls this automatically before `join()` for
 * whichever of `audio`/`video` are requested, but it's also exported
 * standalone for apps that want to prompt earlier (e.g. on a "join call"
 * button) for better UX.
 */
export async function requestMediaPermissions(
  options: RequestMediaPermissionsOptions = {},
): Promise<boolean> {
  const { audio = true, video = true } = options;

  if (Platform.OS !== 'android') {
    return true;
  }

  const permissions: Array<(typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS]> = [];
  if (audio) permissions.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  if (video) permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);

  if (permissions.length === 0) return true;

  const results = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every((permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED);
}
