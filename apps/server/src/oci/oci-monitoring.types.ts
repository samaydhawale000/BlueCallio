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
  // A capacity ceiling for this metric, so the dashboard can show "how
  // close to the limit" rather than a bare number. This is NOT measured —
  // OCI Monitoring only exposes utilization, not the instance's actual
  // shape config (that's the Compute API, a different service/permission
  // this integration doesn't have) — it's an operator-supplied constant via
  // config (OCI_CPU_SAFE_LIMIT_PERCENT / OCI_INSTANCE_MEMORY_GB). null when
  // not configured; never guessed.
  capacity?: { limit: number; unit: string } | null;
}

export interface OciNetworkMetric {
  rxMbps: number | null;
  txMbps: number | null;
  available: boolean;
  source: 'oci';
  // Configured bandwidth ceiling (OCI_INSTANCE_NETWORK_MBPS) — same caveat
  // as OciScalarMetric.capacity.
  capacityMbps?: number | null;
}

export interface OciDiskMetric {
  readMBps: number | null;
  writeMBps: number | null;
  available: boolean;
  source: 'oci';
  // Filesystem space usage (bytes used / total) — NOT the same thing as the
  // throughput above. oci_computeagent has no such metric at all (confirmed
  // against Oracle's own metrics reference); it lives in the separate
  // oci_blockstore namespace, which this integration doesn't query. Always
  // unavailable today — kept as an explicit field so the dashboard can show
  // "not available" rather than omitting the row.
  storage: {
    usedBytes: number | null;
    totalBytes: number | null;
    available: false;
  };
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
