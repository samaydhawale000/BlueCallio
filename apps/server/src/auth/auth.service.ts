import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';

import { OAuth2Client } from 'google-auth-library';

import { BillingService } from '../billing/billing.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private billingService: BillingService,
  ) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
  }

  async loginWithGoogle(idToken: string) {
    // Verify the Google ID token.
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException(
        'Invalid Google token',
      );
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException(
        'Invalid Google token payload',
      );
    }

    const email = payload.email;
    const googleId = payload.sub;
    const name =
      payload.name ?? null;
    const avatarUrl =
      payload.picture ?? null;

    // Find an existing user by googleId, then by email.
    let user =
      await this.prisma.user.findUnique({
        where: { googleId },
      });

    if (!user) {
      user =
        await this.prisma.user.findUnique({
          where: { email },
        });

      // New user — create one.
      if (!user) {
        user =
          await this.prisma.user.create({
            data: {
              email,
              googleId,
              name,
              avatarUrl,
            },
          });
} else {
        // Existing email user — link the Google account.
        user =
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              googleId,
              name: name ?? user.name,
              avatarUrl: avatarUrl ?? user.avatarUrl,
            },
          });
      }
    }

    // Ensure the user has a subscription + usage record (Free plan by default).
    this.billingService.getOrCreateFreeSubscription(user.id).catch(() => {
      // Non-fatal: subscription assignment should not block login.
    });

    const tokens =
      await this.generateTokens(user.id);

    await this.saveRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    return {
      user,
      ...tokens,
    };
  }

  private async generateTokens(
    userId: string,
  ) {
    const accessToken =
      await this.jwtService.signAsync(
        {
          sub: userId,
        },
        {
          secret:
            process.env.JWT_ACCESS_SECRET,
          expiresIn: '15m',
        },
      );

    const refreshToken =
      await this.jwtService.signAsync(
        {
          sub: userId,
        },
        {
          secret:
            process.env.JWT_REFRESH_SECRET,
          expiresIn: '30d',
        },
      );

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ) {
    const hash =
      await bcrypt.hash(
        refreshToken,
        10,
      );

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash: hash,
      },
    });
  }

  async refreshToken(
    refreshToken: string,
  ) {
    const payload =
      await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret:
            process.env.JWT_REFRESH_SECRET,
        },
      );

    const user =
      await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

    if (!user) {
      throw new UnauthorizedException();
    }

    const valid =
      await bcrypt.compare(
        refreshToken,
        user.refreshTokenHash || '',
      );

    if (!valid) {
      throw new UnauthorizedException();
    }

    const tokens =
      await this.generateTokens(user.id);

    await this.saveRefreshToken(
      user.id,
      tokens.refreshToken,
    );

    return tokens;
  }

  /**
   * Contact number, collected once right after login (not re-asked later,
   * e.g. when saving a card) — see BillingService.setContactPhone for why
   * Razorpay needs this synced onto the payment-provider customer too.
   */
  async setPhone(userId: string, phone: string) {
    return this.billingService.setContactPhone(userId, phone);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash: null,
      },
    });

    return {
      success: true,
    };
  }
}
