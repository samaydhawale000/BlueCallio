import { describe, expect, it, vi } from 'vitest';
import { InCallManagerBridge, loadInCallManager } from '../src/optional/inCallManager';

// Note on approach: `InCallManagerBridge` loads the optional native module
// via a plain `require()` call (by design — see src/optional/inCallManager.ts),
// which bypasses vitest's `vi.mock` module-graph interception entirely (a
// bare `require()` resolves through real Node module resolution, not
// Vite/Vitest's ESM import graph). So instead of trying to mock the
// specifier, `InCallManagerBridge` accepts an injectable loader function —
// exactly the seam it needs for both "module present" and "module absent"
// to be real, deterministic, testable behavior instead of depending on
// whatever happens to be installed in this monorepo's node_modules.

describe('InCallManagerBridge', () => {
  it('no-ops and warns once when the module is not installed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bridge = new InCallManagerBridge(() => null);

    expect(() => bridge.start('video')).not.toThrow();
    expect(() => bridge.stop()).not.toThrow();
    expect(() => bridge.setSpeakerphoneOn(true)).not.toThrow();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/react-native-incall-manager is not installed/);

    warn.mockRestore();
  });

  it('start() forwards { media, auto: true } to the underlying module', () => {
    const start = vi.fn();
    const bridge = new InCallManagerBridge(() => ({ start, stop: vi.fn() }));

    bridge.start('audio');

    expect(start).toHaveBeenCalledWith({ media: 'audio', auto: true });
  });

  it('stop() forwards to the underlying module', () => {
    const stop = vi.fn();
    const bridge = new InCallManagerBridge(() => ({ start: vi.fn(), stop }));

    bridge.stop();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('setSpeakerphoneOn() prefers setForceSpeakerphoneOn() when available', () => {
    const setForceSpeakerphoneOn = vi.fn();
    const setSpeakerphoneOn = vi.fn();
    const bridge = new InCallManagerBridge(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      setForceSpeakerphoneOn,
      setSpeakerphoneOn,
    }));

    bridge.setSpeakerphoneOn(true);

    expect(setForceSpeakerphoneOn).toHaveBeenCalledWith(true);
    expect(setSpeakerphoneOn).not.toHaveBeenCalled();
  });

  it('setSpeakerphoneOn() falls back to setSpeakerphoneOn() when setForceSpeakerphoneOn is absent', () => {
    const setSpeakerphoneOn = vi.fn();
    const bridge = new InCallManagerBridge(() => ({ start: vi.fn(), stop: vi.fn(), setSpeakerphoneOn }));

    bridge.setSpeakerphoneOn(false);

    expect(setSpeakerphoneOn).toHaveBeenCalledWith(false);
  });

  it('default loadInCallManager() never throws, whatever is or isn\'t installed', () => {
    expect(() => loadInCallManager()).not.toThrow();
  });
});
