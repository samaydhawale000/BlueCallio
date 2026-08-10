import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [JwtModule.register({}), SocketModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
