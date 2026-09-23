/*
 * Public API surface of `@purplecallio/angular`.
 */

export {
  PurpleCallioService,
  type PurpleCallioServiceConfig,
} from './lib/purplecallio.service';

export { PurpleCallioVideoDirective } from './lib/purplecallio-video.directive';

// Re-exported for convenience so consumers don't need a direct
// `@purplecallio/sdk` dependency just to type their own components.
export type {
  ConnectionState,
  Participant,
  ParticipantMedia,
  ParticipantRole,
} from '@purplecallio/sdk';
