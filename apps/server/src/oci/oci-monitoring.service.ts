import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as common from 'oci-common';
import * as monitoring from 'oci-monitoring';

import {
  OciDiskMetric,
  OciMetricsSnapshot,
  OciNetworkMetric,
  OciScalarMetric,
} from './oci-monitoring.types';

const NAMESPACE = 'oci_computeagent';

// A single fetch's outcome, kept internal to this service. `ok` tracks
// "did the OCI API call itself succeed" independently of "did it return a
// data point" — an empty result for a valid metric name is not the same
// thing as an auth/network failure, and only the latter should ever mark
// the whole snapshot as disconnected.
interface RawMetricResult {
  ok: boolean;
  value: number | null;
  unit?: string;
  error?: string;
}

@Injectable()
export class OciMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(OciMonitoringService.name);

  private client: monitoring.MonitoringClient | null = null;
  private initError: string | null = null;

  private readonly region?: string;
  private readonly compartmentId?: string;
  private readonly instanceId?: string;
  private readonly cacheTtlMs: number;
  private readonly requestTimeoutMs: number;

  private cached: { snapshot: OciMetricsSnapshot; expiresAt: number } | null =
    null;
  // Serializes concurrent refreshes (e.g. two admin dashboards polling at
  // once right as the cache expires) into a single in-flight OCI call.
  private refreshing: Promise<OciMetricsSnapshot> | null = null;

  constructor(private config: ConfigService) {
    this.region = this.config.get<string>('OCI_REGION');
    this.compartmentId = this.config.get<string>('OCI_COMPARTMENT_OCID');
    this.instanceId = this.config.get<string>('OCI_INSTANCE_OCID');
    this.cacheTtlMs =
      Number(this.config.get<string>('OCI_METRICS_CACHE_TTL_MS')) || 20_000;
    this.requestTimeoutMs =
      Number(this.config.get<string>('OCI_METRICS_TIMEOUT_MS')) || 8_000;
  }

  /**
   * Instance Principal auth only — no API key, no ~/.oci/config, no
   * OCI_USER_OCID/OCI_FINGERPRINT/OCI_PRIVATE_KEY/OCI_TENANCY. This only
   * works when actually running on the OCI compute instance the Dynamic
   * Group's matching rule names; it will fail fast (and stay unavailable,
   * not crash) anywhere else — a laptop, CI, or a differently-provisioned
   * host.
   */
  async onModuleInit() {
    if (!this.compartmentId || !this.instanceId) {
      this.logger.warn(
        'OCI monitoring not configured (OCI_COMPARTMENT_OCID / OCI_INSTANCE_OCID missing) — ' +
          'server infra metrics will report unavailable.',
      );
      return;
    }

    try {
      const provider =
        await new common.InstancePrincipalsAuthenticationDetailsProviderBuilder().build();
      const client = new monitoring.MonitoringClient({
        authenticationDetailsProvider: provider,
      });
      // Instance Principal already carries its own region (detected from
      // instance metadata) — only override it if OCI_REGION was explicitly
      // set, rather than requiring it.
      if (this.region) client.regionId = this.region;
      this.client = client;
      this.logger.log(
        'OCI Monitoring client initialized via Instance Principal.',
      );
    } catch (err) {
      this.initError = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to initialize OCI Instance Principal auth — server infra metrics will report unavailable: ${this.initError}`,
      );
    }
  }

  /** Cached snapshot of the OCI infra metrics, refreshed at most once per TTL. */
  async getSnapshot(): Promise<OciMetricsSnapshot> {
    if (this.cached && this.cached.expiresAt > Date.now()) {
      return this.cached.snapshot;
    }
    if (this.refreshing) return this.refreshing;

    this.refreshing = this.refresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async refresh(): Promise<OciMetricsSnapshot> {
    const checkedAt = new Date().toISOString();

    if (!this.client) {
      const snapshot = this.unavailableSnapshot(
        checkedAt,
        this.initError ?? 'OCI monitoring not configured',
      );
      this.cached = { snapshot, expiresAt: Date.now() + this.cacheTtlMs };
      return snapshot;
    }

    const [cpu, memory, netIn, netOut, diskRead, diskWrite] = await Promise.all(
      [
        this.fetchMetric('CpuUtilization', 'mean'),
        this.fetchMetric('MemoryUtilization', 'mean'),
        this.fetchMetric('NetworksBytesIn', 'sum'),
        this.fetchMetric('NetworksBytesOut', 'sum'),
        this.fetchMetric('DiskBytesRead', 'sum'),
        this.fetchMetric('DiskBytesWritten', 'sum'),
      ],
    );

    // Any one successful call proves OCI Monitoring is reachable and this
    // instance is authorized — that's "connected", regardless of whether
    // every individual metric happened to have data this minute.
    const results = [cpu, memory, netIn, netOut, diskRead, diskWrite];
    const connected = results.some((r) => r.ok);
    const firstError = results.find((r) => !r.ok)?.error ?? null;

    if (!connected) {
      this.logger.error(`OCI Monitoring API call failed: ${firstError}`);
    }

    const snapshot: OciMetricsSnapshot = {
      cpu: this.toScalar(cpu),
      memory: this.toScalar(memory),
      network: this.toNetwork(netIn, netOut),
      disk: this.toDisk(diskRead, diskWrite),
      connected,
      checkedAt,
      error: connected ? null : firstError,
    };

    this.cached = { snapshot, expiresAt: Date.now() + this.cacheTtlMs };
    return snapshot;
  }

  private toScalar(r: RawMetricResult): OciScalarMetric {
    return {
      value: r.ok ? r.value : null,
      available: r.ok && r.value != null,
      source: 'oci',
      unit: r.unit,
    };
  }

  // NetworksBytesIn/Out are reported by the compute agent as bytes
  // transferred DURING each ~1-minute sampling interval (confirmed against
  // Oracle's own oci_computeagent metrics reference), not a since-boot
  // running total — so dividing by the interval length converts directly
  // to a rate. See this class's doc comment for the caveat: Oracle's own
  // page also labels these "cumulative counter" as a metric *type*, which
  // is a different (and confusingly overlapping) concept from "the value
  // you get back is a running total" — this has not been confirmed against
  // two live, known-different readings on the real instance. Treat the
  // resulting Mbps as best-effort until that's done.
  private toNetwork(
    rxRaw: RawMetricResult,
    txRaw: RawMetricResult,
  ): OciNetworkMetric {
    const available =
      rxRaw.ok && txRaw.ok && rxRaw.value != null && txRaw.value != null;
    return {
      rxMbps: available ? this.bytesPerIntervalToMbps(rxRaw.value!) : null,
      txMbps: available ? this.bytesPerIntervalToMbps(txRaw.value!) : null,
      available,
      source: 'oci',
    };
  }

  private toDisk(
    readRaw: RawMetricResult,
    writeRaw: RawMetricResult,
  ): OciDiskMetric {
    const available =
      readRaw.ok &&
      writeRaw.ok &&
      readRaw.value != null &&
      writeRaw.value != null;
    return {
      readMBps: available ? this.bytesPerIntervalToMBps(readRaw.value!) : null,
      writeMBps: available
        ? this.bytesPerIntervalToMBps(writeRaw.value!)
        : null,
      available,
      source: 'oci',
    };
  }

  private bytesPerIntervalToMbps(bytes: number): number {
    // bytes over a 60s window → bits/sec → Mbps
    return Math.round((((bytes / 60) * 8) / 1_000_000) * 100) / 100;
  }

  private bytesPerIntervalToMBps(bytes: number): number {
    return Math.round((bytes / 60 / 1_000_000) * 100) / 100;
  }

  private unavailableSnapshot(
    checkedAt: string,
    error: string,
  ): OciMetricsSnapshot {
    return {
      cpu: { value: null, available: false, source: 'oci' },
      memory: { value: null, available: false, source: 'oci' },
      network: { rxMbps: null, txMbps: null, available: false, source: 'oci' },
      disk: {
        readMBps: null,
        writeMBps: null,
        available: false,
        source: 'oci',
      },
      connected: false,
      checkedAt,
      error,
    };
  }

  private buildQuery(metricName: string, stat: 'mean' | 'sum'): string {
    // resourceId is an OCID (fixed alphanumeric/dot/hyphen charset — no
    // quotes or backslashes to escape) interpolated into an MQL string
    // literal, matching the exact query shape already verified via the OCI
    // CLI: `CpuUtilization[1m]{resourceId = "<ocid>"}.mean()`.
    return `${metricName}[1m]{resourceId = "${this.instanceId}"}.${stat}()`;
  }

  private async fetchMetric(
    metricName: string,
    stat: 'mean' | 'sum',
  ): Promise<RawMetricResult> {
    try {
      const request: monitoring.requests.SummarizeMetricsDataRequest = {
        compartmentId: this.compartmentId!,
        summarizeMetricsDataDetails: {
          namespace: NAMESPACE,
          query: this.buildQuery(metricName, stat),
        },
      };

      const response = await this.withTimeout(
        this.client!.summarizeMetricsData(request),
        this.requestTimeoutMs,
        metricName,
      );

      const series = response.items?.[0];
      const points = series?.aggregatedDatapoints ?? [];
      if (points.length === 0) {
        // A successful call with no data points for this metric/resource —
        // reachable and authorized, just nothing to report right now.
        return { ok: true, value: null, unit: series?.metadata?.unit };
      }
      const latest = points[points.length - 1];
      return { ok: true, value: latest.value, unit: series?.metadata?.unit };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`OCI metric '${metricName}' fetch failed: ${message}`);
      return { ok: false, value: null, error: message };
    }
  }

  private withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error(
              `OCI Monitoring request for '${label}' timed out after ${ms}ms`,
            ),
          ),
        ms,
      );
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err: unknown) => {
          clearTimeout(timer);
          reject(err instanceof Error ? err : new Error(String(err)));
        },
      );
    });
  }
}
