/** Call type — audio-only or audio + video. */
export type CallType = 'AUDIO' | 'VIDEO';

export type CallStatus =
  | 'INITIATED'
  | 'RINGING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'MISSED'
  | 'ENDED';

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

export type ParticipantRole = 'CALLER' | 'RECEIVER';

export interface Participant {
  participantId: string;
  role: ParticipantRole;
  token: string;
  hostedUrl: string;
  expiresAt: string;
  /** Live media state (available after join). */
  media?: {
    camera: boolean;
    microphone: boolean;
    screenShare: boolean;
  };
}

export interface Call {
  id: string;
  projectId: string;
  callerId: string;
  receiverId: string;
  type: CallType;
  status: CallStatus;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Branding {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  theme: 'LIGHT' | 'DARK';
  waitingRoom: boolean;
}

export interface CreateCallParams {
  callerId: string;
  receiverId: string;
  type?: CallType;
}

export interface CreateCallResult {
  callId: string;
  hostedUrl: string;
  participants: Participant[];
  /** Backwards-compatible fields. */
  call: Call;
  callerToken: string;
  receiverToken: string;
  callerUrl: string;
  receiverUrl: string;
}

export interface CallDetails {
  callId: string;
  type: CallType;
  status: CallStatus;
  callerId: string;
  receiverId: string;
  participantId: string;
  token: string;
  hostedUrl: string;
  expiresAt: string | null;
  branding: Branding;
}

export interface JoinCallResult {
  callId: string;
  status: CallStatus;
  joined: boolean;
  participantId: string;
}

export interface BlueJoinetConfig {
  apiKey: string;
  /** BlueJoinet API base URL. Default: https://api.bluejoinet.com */
  baseUrl?: string;
  /** Hosted call UI base URL. Default: https://call.bluejoinet.com */
  callBaseUrl?: string;
}

/** Config for the headless engine (client-side). */
export interface EngineConfig {
  token: string;
  callId: string;
  signalUrl: string;
  /** Default: video on. */
  video?: boolean;
  /** Default: audio on. */
  audio?: boolean;
  iceServers?: RTCIceServer[];
}

export interface MeetingSnapshot {
  callId: string;
  participantId: string;
  participants: Participant[];
  connectionState: ConnectionState;
  media: {
    camera: boolean;
    microphone: boolean;
    screenShare: boolean;
  };
  remoteStream: MediaStream | null;
}

export interface EngineEvents {
  connected: (payload: { callId: string; participantId: string; role: ParticipantRole }) => void;
  reconnected: (payload: { callId: string }) => void;
  disconnected: (payload: { reason?: string }) => void;
  'participant.joined': (payload: { callId: string; participantId: string; participants: number }) => void;
  'participant.left': (payload: { callId: string; participantId: string; participants: number }) => void;
  'participant.updated': (payload: { callId: string; participantId: string; media: Participant['media'] }) => void;
  'camera.enabled': (payload: { callId: string; participantId: string }) => void;
  'camera.disabled': (payload: { callId: string; participantId: string }) => void;
  'microphone.enabled': (payload: { callId: string; participantId: string }) => void;
  'microphone.disabled': (payload: { callId: string; participantId: string }) => void;
  'screenShare.started': (payload: { callId: string; participantId: string }) => void;
  'screenShare.stopped': (payload: { callId: string; participantId: string }) => void;
  'call.started': (payload: { callId: string }) => void;
  'call.ended': (payload: { callId: string }) => void;
  'remote.stream': (stream: MediaStream) => void;
  'remote.stream.ended': () => void;
  offer: (payload: { offer: RTCSessionDescriptionInit }) => void;
  answer: (payload: { answer: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (payload: { candidate: RTCIceCandidateInit }) => void;
}

