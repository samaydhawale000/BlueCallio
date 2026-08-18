import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { JwtGuard } from '../../auth/guards/jwt.guard';

import { ApiKeyService } from '../services/api-key.service';

import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@Controller('api-keys')
@UseGuards(JwtGuard)
export class ApiKeyController {
  constructor(
    private apiKeyService: ApiKeyService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  create(
    @Req() req: any,
    @Body()
    body: CreateApiKeyDto,
  ) {
    return this.apiKeyService.createApiKey(
      body.projectId,
      body.name,
    );
  }

  @Get()
  getAll(
    @Req() req: any,
  ) {
    return this.apiKeyService.getAllKeys(
      req.user.userId,
    );
  }

  @Get(':projectId')
  getKeys(
    @Req() req: any,
    @Param('projectId')
    projectId: string,
  ) {
    return this.apiKeyService.getProjectKeys(
      projectId,
    );
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; name?: string },
  ) {
    return this.apiKeyService.updateKey(
      req.user.userId,
      id,
      body,
    );
  }

  @Delete(':id')
  revoke(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.apiKeyService.revokeKey(
      req.user.userId,
      id,
    );
  }
}
