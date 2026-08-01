import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CallSessionGuard } from '../../common/guards/call-session.guard';
import { CallService } from '../services/call.service';
import { CreateCallDto } from '../dto/create-call.dto';

@Controller('calls')
export class CallController {
  constructor(private callService: CallService) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  create(@Req() req: any, @Body() body: CreateCallDto) {
    return this.callService.createCall({
      ...body,
      projectId: req.project.id,
    });
  }

  @Post(':id/accept')
  @UseGuards(CallSessionGuard)
  accept(@Param('id') id: string) {
    return this.callService.acceptCall(id);
  }

  @Post(':id/reject')
  @UseGuards(CallSessionGuard)
  reject(@Param('id') id: string) {
    return this.callService.rejectCall(id);
  }

  @Post(':id/end')
  @UseGuards(CallSessionGuard)
  end(@Param('id') id: string) {
    return this.callService.endCall(id);
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
