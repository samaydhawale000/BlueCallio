import { describe, expect, it, vi } from 'vitest';
import { NetInfoBridge, loadNetInfo } from '../src/optional/netInfo';

// Same rationale as tests/inCallManager.spec.ts: the real module is loaded
// via `require()`, which vi.mock cannot intercept, so `NetInfoBridge` takes
// an injectable loader instead.

describe('NetInfoBridge', () => {
  it('reports unsupported and warns once when the module is not installed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bridge = new NetInfoBridge(() => null);

    expect(bridge.isSupported()).toBe(false);
    expect(bridge.subscribe(() => {})).not.toThrow;
    await expect(bridge.fetch()).resolves.toBeNull();

    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0][0]).toMatch(/@react-native-community\/netinfo is not installed/);

    warn.mockRestore();
  });

  it('subscribe() forwards to addEventListener() and returns its unsubscribe', () => {
    const unsubscribe = vi.fn();
    const addEventListener = vi.fn(() => unsubscribe);
    const bridge = new NetInfoBridge(() => ({ addEventListener, fetch: vi.fn() }));

    const listener = vi.fn();
    const returned = bridge.subscribe(listener);

    expect(addEventListener).toHaveBeenCalledWith(listener);
    expect(returned).toBe(unsubscribe);
  });

  it('fetch() forwards to the underlying module and resolves its state', async () => {
    const state = { type: 'wifi', isConnected: true, isInternetReachable: true };
    const bridge = new NetInfoBridge(() => ({ addEventListener: vi.fn(), fetch: vi.fn(async () => state) }));

    await expect(bridge.fetch()).resolves.toEqual(state);
  });

  it('isSupported() reflects whether the loader resolves a module', () => {
    expect(new NetInfoBridge(() => null).isSupported()).toBe(false);
    expect(new NetInfoBridge(() => ({ addEventListener: vi.fn(), fetch: vi.fn() })).isSupported()).toBe(true);
  });

  it('default loadNetInfo() never throws, whatever is or isn\'t installed', () => {
    expect(() => loadNetInfo()).not.toThrow();
  });
});
