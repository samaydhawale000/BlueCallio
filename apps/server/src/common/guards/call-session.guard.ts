import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { CallSessionService } from '../../call-session/services/call-session.service';

@Injectable()
export class CallSessionGuard implements CanActivate {
  constructor(private callSessionService: CallSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader: string | undefined = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Session token required');
    }

    const token = authHeader.slice(7);

    const session = await this.callSessionService.getByToken(token);

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session token');
    }

    // The session row always carries BOTH tokens regardless of which one
    // was presented — resolve the actual role from the token that matched,
    // rather than assuming CALLER whenever a callerToken field is present
    // (it always is, on every session row).
    const role: 'CALLER' | 'RECEIVER' =
      session.callerToken === token ? 'CALLER' : 'RECEIVER';

    request.callSession = { ...session, role };
    return true;
  }
}
