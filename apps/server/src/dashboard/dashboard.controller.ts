import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('calls')
  getCalls(@Req() req: any, @Query('projectId') projectId?: string) {
    return this.dashboardService.getCalls(req.user.userId, projectId);
  }

  @Get('calls/:id')
  getCallDetails(@Req() req: any, @Param('id') id: string) {
    return this.dashboardService.getCallDetails(req.user.userId, id);
  }

  @Get('usage')
  getUsage(@Req() req: any) {
    return this.dashboardService.getUsage(req.user.userId);
  }
}

