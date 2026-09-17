// Shared "measured vs not-available" shapes for OCI-sourced infrastructure
// metrics — matches the convention already used by AdminService.getMonitoring
// (see its doc comment): `available: false` + a null value, never a
// fabricated 0. `source: 'oci'` distinguishes these from Node-process-level
// or future host-agent ('infra-monitor') readings so different sources are
// never silently mixed into one number.

export interface OciScalarMetric {
  value: number | null;
  available: boolean;
  source: 'oci';
  unit?: string;
}

export interface OciNetworkMetric {
  rxMbps: number | null;
  txMbps: number | null;
  available: boolean;
  source: 'oci';
}

export interface OciDiskMetric {
  readMBps: number | null;
  writeMBps: number | null;
  available: boolean;
  source: 'oci';
}

export interface OciMetricsSnapshot {
  cpu: OciScalarMetric;
  memory: OciScalarMetric;
  network: OciNetworkMetric;
  disk: OciDiskMetric;
  // Whether the last refresh actually completed a successful OCI Monitoring
  // API call — never inferred from "env vars are set". See
  // OciMonitoringService.refresh().
  connected: boolean;
  checkedAt: string;
  error: string | null;
}
