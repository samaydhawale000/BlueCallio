import type {
  BlueCallConfig,
  Call,
  CreateCallParams,
  CreateCallResult,
} from './types';

export class BlueCall {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly callBaseUrl: string;

  constructor(config: BlueCallConfig) {
    if (!config.apiKey) throw new Error('BlueCall: apiKey is required');
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://api.bluecall.com';
    this.callBaseUrl = config.callBaseUrl ?? 'https://call.bluecall.com';
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? `BlueCall error ${res.status}: ${path}`);
    }

    return res.json() as Promise<T>;
  }

  private callUrl(callId: string, token: string): string {
    const params = new URLSearchParams({ callId, token });
    return `${this.callBaseUrl}/call?${params}`;
  }

  /**
   * Create a new call.
   * Returns the call object plus ready-to-redirect URLs for both participants.
   *
   * @example
   * const { callerUrl, receiverUrl } = await bluecall.createCall({
   *   callerId: 'user_123',
   *   receiverId: 'user_456',
   *   type: 'VIDEO',
   * });
   * // redirect caller  → callerUrl
   * // notify receiver  → receiverUrl (via your own push/SMS/email)
   */
  async createCall(params: CreateCallParams): Promise<CreateCallResult> {
    const data = await this.request<{
      call: Call;
      callerToken: string;
      receiverToken: string;
    }>('POST', '/calls', {
      callerId: params.callerId,
      receiverId: params.receiverId,
      type: params.type ?? 'VIDEO',
    });

    return {
      ...data,
      callerUrl: this.callUrl(data.call.id, data.callerToken),
      receiverUrl: this.callUrl(data.call.id, data.receiverToken),
    };
  }

  /** Accept a pending call (typically called by your server on receiver's behalf). */
  async acceptCall(callId: string): Promise<Call> {
    return this.request<Call>('POST', `/calls/${callId}/accept`);
  }

  /** Reject a pending call. */
  async rejectCall(callId: string): Promise<Call> {
    return this.request<Call>('POST', `/calls/${callId}/reject`);
  }

  /** End an active call. */
  async endCall(callId: string): Promise<Call> {
    return this.request<Call>('POST', `/calls/${callId}/end`);
  }

  /** Fetch details for a specific call. */
  async getCall(callId: string): Promise<Call> {
    return this.request<Call>('GET', `/calls/${callId}`);
  }

  /** List all calls for this project. */
  async getCalls(): Promise<Call[]> {
    return this.request<Call[]>('GET', '/calls');
  }
}
