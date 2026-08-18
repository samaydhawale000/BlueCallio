import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard
  implements CanActivate
{
  constructor(
    private prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context
        .switchToHttp()
        .getRequest();

    const apiKey =
      request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException(
        'API key required',
      );
    }

    // Only the hash is ever stored — never look up by (or store) plaintext.
    const keyHash = createHash('sha256').update(String(apiKey)).digest('hex');

    const key =
      await this.prisma.apiKey.findFirst({
        where: {
          keyHash,
          isActive: true,
        },
        include: {
          project: true,
        },
      });

    if (!key) {
      throw new UnauthorizedException(
        'Invalid API key',
      );
    }

    request.project =
      key.project;

    request.apiKey =
      key;

    return true;
  }
}