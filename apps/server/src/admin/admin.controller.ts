import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('customers')
  getCustomers(@Query('page') page?: string) {
    return this.adminService.getCustomers(page);
  }

  @Patch('customers/:id/status')
  updateCustomerStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'SUSPENDED' },
  ) {
    return this.adminService.updateCustomerStatus(id, body.status);
  }

  @Get('calls')
  getLiveCalls(@Query('page') page?: string) {
    return this.adminService.getLiveCalls(page);
  }

  @Patch('calls/:id/end')
  endCall(@Param('id') id: string) {
    return this.adminService.endCall(id);
  }

  @Get('usage')
  getUsage() {
    return this.adminService.getUsage();
  }

  @Get('health')
  getHealth() {
    return this.adminService.getHealth();
  }

  @Get('alerts')
  getAlerts() {
    return this.adminService.getAlerts();
  }

  @Get('audit-logs')
  getAuditLogs(@Query('page') page?: string) {
    return this.adminService.getAuditLogs(page);
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() body: any) {
    return this.adminService.updateSettings(body);
  }
}
