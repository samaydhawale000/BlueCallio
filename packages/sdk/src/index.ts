export { BlueJoinetClient } from './client';
export { BlueJoinetMeeting } from './meeting/meeting';

// Default export = REST client for server-side convenience.
import { BlueJoinetClient } from './client';
export default BlueJoinetClient;

export type {
  BlueJoinetConfig,
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
