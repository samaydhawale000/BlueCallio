import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtGuard } from '../../auth/guards/jwt.guard';

import { ProjectService } from '../services/project.service';

import { CreateProjectDto } from '../dto/create-project.dto';

@Controller('projects')
export class ProjectController {
  constructor(
    private projectService: ProjectService,
  ) {}

  @UseGuards(JwtGuard)
  @Post()
  create(
    @Req() req: any,
    @Body() body: CreateProjectDto,
  ) {
    return this.projectService.createProject(req.user.userId, body);
  }

  @UseGuards(JwtGuard)
  @Get()
  getProjects(@Req() req: any) {
    return this.projectService.getProjects(req.user.userId);
  }

  @UseGuards(JwtGuard)
  @Patch(':id/webhook')
  updateWebhook(
    @Req() req: any,
    @Param('id') id: string,
    @Body('webhookUrl') webhookUrl: string | null,
  ) {
    return this.projectService.updateWebhook(id, req.user.userId, webhookUrl ?? null);
  }
}