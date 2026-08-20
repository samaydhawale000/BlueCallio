import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { BillingGuard } from '../../common/guards/billing.guard';
import { CallSessionGuard } from '../../common/guards/call-session.guard';
import { CallService } from '../services/call.service';
import { CreateCallDto } from '../dto/create-call.dto';

@Controller('calls')
export class CallController {
  constructor(private callService: CallService) {}

  // Prevents an abused/leaked API key from mass-creating call sessions.
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post()
  @UseGuards(ApiKeyGuard, BillingGuard)
  create(@Req() req: any, @Body() body: CreateCallDto) {
    return this.callService.createCall({
      ...body,
      projectId: req.project.id,
    });
  }

  @Post(':id/accept')
  @UseGuards(CallSessionGuard)
  accept(@Req() req: any, @Param('id') id: string) {
    return this.callService.acceptCall(id, req.callSession);
  }

  @Post(':id/reject')
  @UseGuards(CallSessionGuard)
  reject(@Req() req: any, @Param('id') id: string) {
    return this.callService.rejectCall(id, req.callSession);
  }

  // Distinct from /reject: the CALLER ending a still-ringing call, vs the
  // RECEIVER declining it.
  @Post(':id/cancel')
  @UseGuards(CallSessionGuard)
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.callService.cancelCall(id, req.callSession);
  }

  @Post(':id/join')
  @UseGuards(CallSessionGuard)
  join(@Req() req: any, @Param('id') id: string) {
    return this.callService.joinCall(id, req.callSession);
  }

  @Post(':id/leave')
  @UseGuards(CallSessionGuard)
  leave(@Req() req: any, @Param('id') id: string) {
    return this.callService.leaveCall(id, req.callSession);
  }

  @Post(':id/end')
  @UseGuards(CallSessionGuard)
  end(@Param('id') id: string) {
    return this.callService.endCall(id);
  }

  @Get(':id/details')
  @UseGuards(CallSessionGuard)
  getDetails(@Req() req: any, @Param('id') id: string) {
    return this.callService.getCallDetails(id, req.callSession);
  }

  @Get(':id')
  @UseGuards(ApiKeyGuard)
  getCall(@Param('id') id: string) {
    return this.callService.getCall(id);
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  getCalls(@Req() req: any) {
    return this.callService.getCalls(req.project.id);
  }
}
