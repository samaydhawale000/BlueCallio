export type CallType = 'AUDIO' | 'VIDEO';

export type CallStatus =
  | 'INITIATED'
  | 'RINGING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'MISSED'
  | 'ENDED';

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

export interface CreateCallParams {
  callerId: string;
  receiverId: string;
  type?: CallType;
}

export interface CreateCallResult {
  call: Call;
  callerToken: string;
  receiverToken: string;
  /** Ready-to-redirect URL for the caller */
  callerUrl: string;
  /** Ready-to-redirect URL for the receiver */
  receiverUrl: string;
}

export interface BlueCallConfig {
  apiKey: string;
  /** BlueCall API base URL. Default: https://api.bluecall.com */
  baseUrl?: string;
  /** Hosted call UI base URL. Default: https://call.bluecall.com */
  callBaseUrl?: string;
}
