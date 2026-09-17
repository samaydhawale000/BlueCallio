import { Module } from '@nestjs/common';
import { OciMonitoringService } from './oci-monitoring.service';

@Module({
  providers: [OciMonitoringService],
  exports: [OciMonitoringService],
})
export class OciMonitoringModule {}
