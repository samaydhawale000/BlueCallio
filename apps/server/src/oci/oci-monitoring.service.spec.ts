// Mocked at the module level — onModuleInit() would otherwise make a real
// network call to the OCI instance metadata service (169.254.169.254) to
// build an Instance Principal provider, which hangs/fails off an actual OCI
// VM. No real OCI credentials or network access are needed for these tests.
jest.mock('oci-common', () => ({
  InstancePrincipalsAuthenticationDetailsProviderBuilder: jest
    .fn()
    .mockImplementation(() => ({
      build: jest.fn().mockResolvedValue({}),
    })),
}));

jest.mock('oci-monitoring', () => ({
  MonitoringClient: jest.fn().mockImplementation(() => ({
    summarizeMetricsData: jest.fn(),
  })),
}));

import { OciMonitoringService } from './oci-monitoring.service';

// A minimal fake ConfigService — matches how UsageSegmentService's spec
// passes plain fakes rather than spinning up a NestJS TestingModule.
function fakeConfig(values: Record<string, string>) {
  return { get: (key: string) => values[key] } as any;
}

const configured = {
  OCI_COMPARTMENT_OCID: 'ocid1.tenancy.oc1..aaa',
  OCI_INSTANCE_OCID: 'ocid1.instance.oc1.ap-mumbai-1.bbb',
};

// Builds a MetricData-shaped response the way oci-monitoring's
// SummarizeMetricsDataResponse actually looks, for one metric.
function metricResponse(value: number | null, unit = 'Percent') {
  return {
    items:
      value == null
        ? []
        : [
            {
              namespace: 'oci_computeagent',
              compartmentId: 'ocid1.tenancy.oc1..aaa',
              name: 'CpuUtilization',
              dimensions: {},
              metadata: { unit },
              aggregatedDatapoints: [{ timestamp: new Date(), value }],
            },
          ],
  };
}

// Every test that needs OCI "configured" goes through onModuleInit() (which
// builds the mocked client above), then swaps in its own
// summarizeMetricsData behavior on that same mocked client.
async function buildConfiguredService(
  impl: (req: any) => Promise<any>,
  extraConfig: Record<string, string> = {},
) {
  const service = new OciMonitoringService(
    fakeConfig({ ...configured, ...extraConfig }),
  );
  await service.onModuleInit();
  (service as any).client.summarizeMetricsData = jest.fn(impl);
  return service;
}

describe('OciMonitoringService', () => {
  it('reports unavailable (not a crash, not a 0) when OCI_COMPARTMENT_OCID/OCI_INSTANCE_OCID are missing', async () => {
    const service = new OciMonitoringService(fakeConfig({}));
    await service.onModuleInit();

    const snapshot = await service.getSnapshot();

    expect(snapshot.connected).toBe(false);
    expect(snapshot.cpu).toEqual({
      value: null,
      available: false,
      source: 'oci',
      capacity: null,
    });
    expect(snapshot.memory.available).toBe(false);
    expect(snapshot.network.available).toBe(false);
    expect(snapshot.disk.available).toBe(false);
  });

  it('initializes via Instance Principal (no OCI API key/config), and only then holds a client', async () => {
    const { InstancePrincipalsAuthenticationDetailsProviderBuilder } =
      jest.requireMock('oci-common');

    const service = new OciMonitoringService(fakeConfig(configured));
    expect((service as any).client).toBeNull();

    await service.onModuleInit();

    expect(
      InstancePrincipalsAuthenticationDetailsProviderBuilder,
    ).toHaveBeenCalled();
    expect((service as any).client).not.toBeNull();
  });

  it('parses a successful CPU/memory response into a real percentage, with its unit preserved', async () => {
    const service = await buildConfiguredService((req: any) => {
      const q = req.summarizeMetricsDataDetails.query;
      if (q.startsWith('CpuUtilization'))
        return Promise.resolve(metricResponse(18.4));
      if (q.startsWith('MemoryUtilization'))
        return Promise.resolve(metricResponse(21.7));
      return Promise.resolve(metricResponse(null));
    });

    const snapshot = await service.getSnapshot();

    expect(snapshot.connected).toBe(true);
    expect(snapshot.cpu).toEqual({
      value: 18.4,
      available: true,
      source: 'oci',
      unit: 'Percent',
      capacity: null,
    });
    expect(snapshot.memory).toEqual({
      value: 21.7,
      available: true,
      source: 'oci',
      unit: 'Percent',
      capacity: null,
    });
  });

  it('reports the configured capacity ceilings alongside the measured value', async () => {
    const service = await buildConfiguredService(
      (req: any) => {
        const q = req.summarizeMetricsDataDetails.query;
        if (q.startsWith('CpuUtilization'))
          return Promise.resolve(metricResponse(18.4));
        if (q.startsWith('MemoryUtilization'))
          return Promise.resolve(metricResponse(21.7));
        return Promise.resolve(metricResponse(null));
      },
      {
        OCI_CPU_SAFE_LIMIT_PERCENT: '90',
        OCI_INSTANCE_MEMORY_GB: '6',
        OCI_INSTANCE_NETWORK_MBPS: '1000',
      },
    );

    const snapshot = await service.getSnapshot();

    expect(snapshot.cpu.capacity).toEqual({ limit: 90, unit: 'Percent' });
    expect(snapshot.memory.capacity).toEqual({ limit: 6, unit: 'GB' });
    expect(snapshot.network.capacityMbps).toBe(1000);
  });

  it('reports disk storage (filesystem space, distinct from throughput) as permanently unavailable — not exposed by oci_computeagent', async () => {
    const service = await buildConfiguredService((req: any) => {
      const q = req.summarizeMetricsDataDetails.query;
      if (q.startsWith('DiskBytesRead'))
        return Promise.resolve(metricResponse(1_000_000));
      if (q.startsWith('DiskBytesWritten'))
        return Promise.resolve(metricResponse(500_000));
      return Promise.resolve(metricResponse(null));
    });

    const snapshot = await service.getSnapshot();

    expect(snapshot.disk.storage).toEqual({
      usedBytes: null,
      totalBytes: null,
      available: false,
    });
  });

  it('uses MQL rate() for the cumulative-counter metrics, and converts its bytes/sec directly into Mbps', async () => {
    // rate() already returns bytes/sec: 1,000,000 bytes/sec -> 8 Mbps.
    // (An earlier version used sum() and divided by 60, which is wrong for
    // a cumulative counter — it produced a physically-impossible ~10 Gbps
    // reading against this metric's real semantics.)
    const service = await buildConfiguredService((req: any) => {
      const q = req.summarizeMetricsDataDetails.query;
      expect(q).not.toContain('.sum()');
      if (q.startsWith('NetworksBytesIn'))
        return Promise.resolve(metricResponse(1_000_000, 'Bytes'));
      if (q.startsWith('NetworksBytesOut'))
        return Promise.resolve(metricResponse(500_000, 'Bytes'));
      return Promise.resolve(metricResponse(null));
    });

    const snapshot = await service.getSnapshot();

    expect(snapshot.network.available).toBe(true);
    expect(snapshot.network.rxMbps).toBe(8);
    expect(snapshot.network.txMbps).toBe(4);
  });

  it('converts DiskBytesRead/Written rate() bytes/sec directly into MB/s', async () => {
    // 1,000,000 bytes/sec -> 1 MB/s.
    const service = await buildConfiguredService((req: any) => {
      const q = req.summarizeMetricsDataDetails.query;
      if (q.startsWith('DiskBytesRead'))
        return Promise.resolve(metricResponse(1_000_000, 'Bytes'));
      if (q.startsWith('DiskBytesWritten'))
        return Promise.resolve(metricResponse(500_000, 'Bytes'));
      return Promise.resolve(metricResponse(null));
    });

    const snapshot = await service.getSnapshot();

    expect(snapshot.disk.available).toBe(true);
    expect(snapshot.disk.readMBps).toBe(1);
    expect(snapshot.disk.writeMBps).toBe(0.5);
  });

  it('treats an empty datapoint array as unavailable for that metric, not zero', async () => {
    const service = await buildConfiguredService(() =>
      Promise.resolve(metricResponse(null)),
    );

    const snapshot = await service.getSnapshot();

    // The calls all succeeded (empty result is a valid response, not an
    // error) — connected stays true — but every metric is still unavailable
    // because none of them actually returned a data point.
    expect(snapshot.connected).toBe(true);
    expect(snapshot.cpu).toEqual({
      value: null,
      available: false,
      source: 'oci',
      unit: undefined,
      capacity: null,
    });
  });

  it('reports unavailable rather than crashing when the OCI API call throws (auth/network failure)', async () => {
    const service = await buildConfiguredService(() =>
      Promise.reject(new Error('NotAuthorizedOrNotFound')),
    );

    const snapshot = await service.getSnapshot();

    expect(snapshot.connected).toBe(false);
    expect(snapshot.error).toContain('NotAuthorizedOrNotFound');
    expect(snapshot.cpu.available).toBe(false);
  });

  it('is "connected" once ANY single metric call succeeds, even if others fail', async () => {
    const service = await buildConfiguredService((req: any) => {
      if (req.summarizeMetricsDataDetails.query.startsWith('CpuUtilization')) {
        return Promise.resolve(metricResponse(10));
      }
      return Promise.reject(new Error('boom'));
    });

    const snapshot = await service.getSnapshot();

    expect(snapshot.connected).toBe(true);
    expect(snapshot.cpu.available).toBe(true);
    expect(snapshot.memory.available).toBe(false);
  });

  it('caches the snapshot instead of calling OCI again within the TTL window', async () => {
    const service = await buildConfiguredService(
      () => Promise.resolve(metricResponse(5)),
      { OCI_METRICS_CACHE_TTL_MS: '60000' },
    );
    const summarizeMetricsData = (service as any).client.summarizeMetricsData;

    await service.getSnapshot();
    await service.getSnapshot();
    await service.getSnapshot();

    // 6 metrics per refresh, and only one refresh should have happened.
    expect(summarizeMetricsData).toHaveBeenCalledTimes(6);
  });

  it('times out a hung OCI call instead of waiting forever', async () => {
    const service = await buildConfiguredService(
      () => new Promise(() => {}), // never resolves
      { OCI_METRICS_TIMEOUT_MS: '50' },
    );

    const snapshot = await service.getSnapshot();

    expect(snapshot.connected).toBe(false);
    expect(snapshot.error).toMatch(/timed out/);
  }, 2000);
});
