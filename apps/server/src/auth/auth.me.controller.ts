import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtGuard } from './guards/jwt.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthMeController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  async me(@Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
      },
    });

    if (!user) {
      return { userId: req.user.userId };
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
    };
  }
}
