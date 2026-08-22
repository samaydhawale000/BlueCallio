import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { CallRoomService } from '../services/call-room.service';

import { CallSessionService } from '../../call-session/services/call-session.service';
import { UsageSegmentService } from '../../billing/usage-segment.service';
import { corsOriginCallback } from '../../common/config/cors';

@WebSocketGateway({
  cors: {
    origin: corsOriginCallback,
    credentials: true,
  },
})
export class CallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly callSessionService: CallSessionService,
    private readonly roomService: CallRoomService,
    private readonly segmentService: UsageSegmentService,
  ) {}

  @WebSocketServer()
  server!: Server;

  private authenticatedSockets = new Map<
    string,
    {
      socketId: string;
      callId: string;
      role: 'CALLER' | 'RECEIVER';
      token: string;
      participantId: string;
    }
  >();

  private getParticipantBySocketId(socketId: string) {
    for (const participant of this.authenticatedSockets.values()) {
      if (participant.socketId === socketId) {
        return participant;
      }
    }
    return null;
  }

  private getOtherParticipant(senderSocketId: string) {
    const sender = this.getParticipantBySocketId(senderSocketId);
    if (!sender) return null;

    for (const participant of this.authenticatedSockets.values()) {
      if (
        participant.callId === sender.callId &&
        participant.socketId !== senderSocketId
      ) {
        return participant;
      }
    }
    return null;
  }

  emitToParticipant(
    callId: string,
    role: 'CALLER' | 'RECEIVER',
    event: string,
    data: any,
  ) {
    for (const participant of this.authenticatedSockets.values()) {
      if (participant.callId === callId && participant.role === role) {
        this.server.to(participant.socketId).emit(event, data);
        return;
      }
    }
  }

handleConnection(client: Socket) {
    console.log('Socket Connected:', client.id);
  }

/** Live metrics for the admin health screen. */
  getMetrics() {
    return {
      // Total connected sockets (including unauthenticated).
      clients: this.server.sockets.sockets.size,
      // Authenticated participants currently in a call.
      inCall: this.authenticatedSockets.size,
      // Unique call rooms with at least one participant.
      rooms: this.roomService.getActiveRoomCount(),
    };
  }

  /** Number of sockets currently in a given call room. */
  getRoomParticipantCount(callId: string): number {
    return this.roomService.getParticipantCount(callId);
  }

  handleDisconnect(client: Socket) {
    for (const roomId of [...this.server.sockets.adapter.rooms.keys()]) {
      this.roomService.leaveRoom(roomId, client.id);
    }

    for (const [token, session] of this.authenticatedSockets.entries()) {
      if (session.socketId === client.id) {
        this.authenticatedSockets.delete(token);

        // Notify the other participant that this one left.
        const other = this.getOtherParticipant(client.id);
        this.roomService.removeParticipant(client.id);
        if (other) {
          this.server.to(other.socketId).emit('participant.left', {
            participantId: session.participantId,
            callId: session.callId,
          });
          const count = this.roomService.getParticipantCount(session.callId);
          this.server.to(session.callId).emit('participant-left', { participants: count });
        }
      }
    }
    console.log('Socket Disconnected:', client.id);
  }

  @SubscribeMessage('authenticate')
  async authenticate(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      token: string;
    },
  ) {
    const session = await this.callSessionService.getByToken(body.token);
    if (!session) return { success: false };

    const role: 'CALLER' | 'RECEIVER' =
      session.callerToken === body.token ? 'CALLER' : 'RECEIVER';
    const participantId =
      role === 'CALLER' ? session.call.callerId : session.call.receiverId;

    // Multi-tab: the same call-session token connecting from a second
    // socket (another tab/window) replaces the first, rather than leaving
    // two live sockets both claiming to be "the" caller/receiver for
    // signaling and room participation.
    const existing = this.authenticatedSockets.get(body.token);
    if (existing && existing.socketId !== client.id) {
      this.server.to(existing.socketId).emit('session-replaced', {
        callId: existing.callId,
      });
      this.roomService.leaveRoom(existing.callId, existing.socketId);
      this.roomService.removeParticipant(existing.socketId);
      this.server.sockets.sockets.get(existing.socketId)?.disconnect(true);
    }

    this.authenticatedSockets.set(body.token, {
      socketId: client.id,
      callId: session.call.id,
      role,
      token: body.token,
      participantId,
    });

    client.emit('connected', {
      callId: session.call.id,
      participantId,
      role,
    });

    if (role === 'RECEIVER') {
      // If the call has already left the RINGING state (e.g. auto-missed
      // while the receiver was connecting), do not show a stale incoming
      // screen with dead Accept/Decline buttons. Emit the terminal state
      // so the UI reflects reality.
      const status = session.call.status;
      if (status === 'MISSED') {
        client.emit('call-missed', { callId: session.call.id });
      } else if (status === 'ENDED') {
        client.emit('call-ended', { callId: session.call.id });
      } else if (status === 'REJECTED') {
        client.emit('call-rejected', { callId: session.call.id });
      } else if (status === 'CANCELLED') {
        client.emit('call-cancelled', { callId: session.call.id });
      } else if (status === 'BUSY') {
        client.emit('call-busy', { callId: session.call.id });
      } else {
        client.emit('incoming-call', {
          callId: session.call.id,
          callerId: session.call.callerId,
          callerName: session.call.callerName,
          callerAvatar: session.call.callerAvatar,
          type: session.call.type,
        });
      }
    }

    return { success: true, role };
  }

  @SubscribeMessage('offer')
  async offer(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      offer: RTCSessionDescriptionInit;
    },
  ) {
    const target = this.getOtherParticipant(client.id);
    if (!target) return;
    this.server.to(target.socketId).emit('offer', { offer: body.offer });
  }

  @SubscribeMessage('answer')
  async answer(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      answer: RTCSessionDescriptionInit;
    },
  ) {
    const target = this.getOtherParticipant(client.id);
    if (!target) return;
    this.server.to(target.socketId).emit('answer', { answer: body.answer });
  }

  @SubscribeMessage('ice-candidate')
  async iceCandidate(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      candidate: RTCIceCandidateInit;
    },
  ) {
    const target = this.getOtherParticipant(client.id);
    if (!target) return;
    this.server
      .to(target.socketId)
      .emit('ice-candidate', { candidate: body.candidate });
  }

  @SubscribeMessage('call-ended')
  async callEnded(
    @ConnectedSocket()
    client: Socket,
  ) {
    const target = this.getOtherParticipant(client.id);
    if (!target) return;
    this.server.to(target.socketId).emit('call-ended');
  }

  @SubscribeMessage('join-call')
  async joinCall(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      callId: string;
    },
  ) {
    const participant = this.getParticipantBySocketId(client.id);

    if (!participant) {
      return { success: false, error: 'Not authenticated' };
    }

    if (participant.callId !== body.callId) {
      return { success: false, error: 'Call access denied' };
    }

    client.join(body.callId);
    this.roomService.joinRoom(body.callId, client.id);
    this.roomService.addParticipant(body.callId, {
      socketId: client.id,
      participantId: participant.participantId,
      role: participant.role,
      media: { camera: false, microphone: false, screenShare: false },
    });

    const count = this.roomService.getParticipantCount(body.callId);

    // Standardized event + backward-compatible alias.
    this.server.to(body.callId).emit('participant.joined', {
      callId: body.callId,
      participantId: participant.participantId,
      participants: count,
    });
this.server.to(body.callId).emit('participant-joined', { participants: count });

    await this.safeRecordEvent(body.callId, 'PARTICIPANT_JOINED', participant.participantId);

    return { success: true, participants: count };
  }

  @SubscribeMessage('leave-call')
  async leaveCall(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      callId: string;
    },
  ) {
    const participant = this.roomService.getParticipant(client.id);

    client.leave(body.callId);
    this.roomService.leaveRoom(body.callId, client.id);
    this.roomService.removeParticipant(client.id);

    const count = this.roomService.getParticipantCount(body.callId);

if (participant) {
      this.server.to(body.callId).emit('participant.left', {
        callId: body.callId,
        participantId: participant.participantId,
        participants: count,
      });
      await this.safeRecordEvent(body.callId, 'PARTICIPANT_LEFT', participant.participantId);
    }
    this.server.to(body.callId).emit('participant-left', { participants: count });
  }

  @SubscribeMessage('call.started')
  async callStarted(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      callId: string;
    },
  ) {
    const participant = this.getParticipantBySocketId(client.id);
    if (!participant) return { success: false, error: 'Not authenticated' };
    this.server.to(body.callId).emit('call.started', { callId: body.callId });

    await this.safeRecordEvent(body.callId, 'CALL_STARTED', participant.participantId);

    return { success: true };
  }

  @SubscribeMessage('call.ended')
  async callEndedSignal(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      callId: string;
    },
  ) {
const participant = this.getParticipantBySocketId(client.id);
    if (!participant) return { success: false, error: 'Not authenticated' };
    this.server.to(body.callId).emit('call.ended', { callId: body.callId });

    return { success: true };
  }

  @SubscribeMessage('camera.enabled')
  async cameraEnabled(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      callId: string;
    },
  ) {
    return this.handleMediaChange(client, body.callId, { camera: true }, 'camera.enabled');
  }

  @SubscribeMessage('camera.disabled')
  async cameraDisabled(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      callId: string;
    },
  ) {
    return this.handleMediaChange(client, body.callId, { camera: false }, 'camera.disabled');
  }

  @SubscribeMessage('microphone.enabled')
  async microphoneEnabled(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      callId: string;
    },
  ) {
    return this.handleMediaChange(client, body.callId, { microphone: true }, 'microphone.enabled');
  }

  @SubscribeMessage('microphone.disabled')
  async microphoneDisabled(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      callId: string;
    },
  ) {
    return this.handleMediaChange(client, body.callId, { microphone: false }, 'microphone.disabled');
  }

  @SubscribeMessage('screenShare.started')
  async screenShareStarted(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      callId: string;
    },
  ) {
    return this.handleMediaChange(client, body.callId, { screenShare: true }, 'screenShare.started');
  }

  @SubscribeMessage('screenShare.stopped')
  async screenShareStopped(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    body: {
      callId: string;
    },
  ) {
    return this.handleMediaChange(client, body.callId, { screenShare: false }, 'screenShare.stopped');
  }

  private async handleMediaChange(
    client: Socket,
    callId: string,
    patch: { camera?: boolean; microphone?: boolean; screenShare?: boolean },
    event: string,
  ) {
    const participant = this.getParticipantBySocketId(client.id);
    if (!participant) return { success: false, error: 'Not authenticated' };

const updated = this.roomService.updateMedia(client.id, patch);
    if (!updated) return { success: false, error: 'Not in call room' };

    this.server.to(callId).emit(event, {
      callId,
      participantId: participant.participantId,
      media: updated.media,
    });
    this.server.to(callId).emit('participant.updated', {
      callId,
      participantId: participant.participantId,
      media: updated.media,
    });

// Persist a media event into the audit trail used by the segment builder.
    // These events are never priced at write-time — they are only ratings
    // inputs that the Rating Engine later converts into money.
    try {
      await this.segmentService.recordEvent(
        callId,
        this.toMediaEventName(event),
        participant.participantId,
        { media: updated.media },
      );

      // Rebuild segments for the call so the timeline stays current.
      await this.segmentService.rebuildSegmentsForCall(callId);
    } catch (err) {
      // Recording is best-effort and must never break a live call.
      console.error('Failed to record media event', err);
    }

    return { success: true };
  }

  private toMediaEventName(socketEvent: string): string {
    switch (socketEvent) {
      case 'camera.enabled':
        return 'CAMERA_ENABLED';
      case 'camera.disabled':
        return 'CAMERA_DISABLED';
      case 'microphone.enabled':
        return 'MIC_ENABLED';
      case 'microphone.disabled':
        return 'MIC_DISABLED';
      case 'screenShare.started':
        return 'SCREEN_SHARE_STARTED';
      case 'screenShare.stopped':
        return 'SCREEN_SHARE_STOPPED';
default:
        return socketEvent.replace(/[-.]/g, '_').toUpperCase();
    }
  }

  private async safeRecordEvent(
    callId: string,
    event: string,
    participantId?: string,
  ) {
    try {
      await this.segmentService.recordEvent(callId, event, participantId);
      await this.segmentService.rebuildSegmentsForCall(callId);
    } catch (err) {
      // Best-effort — never break a live call because of event recording.
      console.error('Failed to record event', event, err);
    }
  }
}
