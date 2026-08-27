export { BlueCallioClient } from './client';
export { BlueCallioMeeting } from './meeting/meeting';

// Default export = REST client for server-side convenience.
import { BlueCallioClient } from './client';
export default BlueCallioClient;

export type {
  BlueCallioConfig,
  Branding,
  Call,
  CallDetails,
  CallStatus,
  CallType,
  ConnectionState,
  CreateCallParams,
  CreateCallResult,
  EngineConfig,
  JoinCallResult,
  MeetingSnapshot,
  Participant,
  ParticipantMedia,
  ParticipantRole,
  ParticipantToken,
} from './types';
