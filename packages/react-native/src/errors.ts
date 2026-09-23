/**
 * Thrown when a feature exposed by `@purplecallio/sdk`'s engine has no real
 * implementation on React Native yet.
 *
 * Today this is used exclusively for screen sharing: mobile screen capture
 * requires OS-level native integration (iOS Broadcast Upload Extension,
 * Android foreground MediaProjection service) that is out of scope for a
 * pure JS/TS adapter package. See the README's "Known Limitations" section.
 */
export class PurpleCallioUnsupportedFeatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PurpleCallioUnsupportedFeatureError';

    // Restore the prototype chain — needed because TypeScript's `target`
    // (ES2020) plus extending a built-in like Error can otherwise break
    // `instanceof` checks when transpiled down for older engines.
    Object.setPrototypeOf(this, PurpleCallioUnsupportedFeatureError.prototype);
  }
}
