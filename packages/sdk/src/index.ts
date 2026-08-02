export { BlueJoinetClient } from './client';
export { BlueJoinetEngine } from './engine';
export type { EngineEventMap, EngineEvents } from './engine';

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
  ParticipantRole,
} from './types';

