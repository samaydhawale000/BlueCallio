import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class TurnService {
  constructor(private config: ConfigService) {}

  getCredentials() {
    const secret = this.config.get<string>('TURN_SECRET');
    const server = this.config.get<string>('TURN_SERVER') ?? 'localhost';

    // Time-limited credential — expires in 24 h
    // Format understood by coturn --use-auth-secret mode (RFC 5766)
    const ttl = 86400;
    const expires = Math.floor(Date.now() / 1000) + ttl;
    const username = `${expires}:bluecall`;

    const credential = secret
      ? createHmac('sha1', secret).update(username).digest('base64')
      : '';

    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
    ];

    if (secret) {
      iceServers.push(
        {
          urls: `turn:${server}:3478`,
          username,
          credential,
        },
        {
          urls: `turns:${server}:5349`,
          username,
          credential,
        },
      );
    }

    return { iceServers };
  }
}
