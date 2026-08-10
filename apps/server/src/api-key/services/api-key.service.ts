import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { randomBytes } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async createApiKey(
    projectId: string,
    name: string,
  ) {
    const apiKey =
      'bj_live_' +
      randomBytes(32).toString('hex');

    return this.prisma.apiKey.create({
      data: {
        key: apiKey,
        name,
        projectId,
      },
    });
  }

  async getProjectKeys(
    projectId: string,
  ) {
    return this.prisma.apiKey.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * List all API keys across all projects owned by the user.
   */
  async getAllKeys(
    userId: string,
  ) {
    return this.prisma.apiKey.findMany({
      where: {
        project: {
          ownerId: userId,
        },
      },
      select: {
        id: true,
        key: true,
        name: true,
        isActive: true,
        createdAt: true,
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update a key's active state or name. Only the owner of the
   * parent project may mutate it.
   */
  async updateKey(
    userId: string,
    keyId: string,
    data: { isActive?: boolean; name?: string },
  ) {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id: keyId, project: { ownerId: userId } },
    });
    if (!existing) throw new NotFoundException('API key not found');

    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        ...(typeof data.isActive === 'boolean' ? { isActive: data.isActive } : {}),
        ...(typeof data.name === 'string' ? { name: data.name } : {}),
      },
      select: {
        id: true,
        key: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  /**
   * Revoke (delete) a key. Only the owner of the parent project may do so.
   */
  async revokeKey(
    userId: string,
    keyId: string,
  ) {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id: keyId, project: { ownerId: userId } },
    });
    if (!existing) throw new NotFoundException('API key not found');

    await this.prisma.apiKey.delete({ where: { id: keyId } });
    return { success: true };
  }

  /**
   * Verify a key belongs to a project the user owns (used to guard
   * project-level operations where needed).
   */
  async assertOwnership(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
    });
    if (!project) throw new ForbiddenException('Not your project');
    return project;
  }
}
