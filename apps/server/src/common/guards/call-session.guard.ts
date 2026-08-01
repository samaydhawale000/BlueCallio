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

    const session =
      (await this.callSessionService.getByCallerToken(token)) ??
      (await this.callSessionService.getByReceiverToken(token));

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session token');
    }

    request.callSession = session;
    return true;
  }
}
