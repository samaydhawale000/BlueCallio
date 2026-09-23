import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Explicit unmount + DOM cleanup between tests — each `it()` in
// toggle.spec.tsx renders its own <MeetingProvider>, and without this the
// previous test's DOM (and duplicate data-testid nodes) would still be
// present when the next test queries the document.
afterEach(() => {
  cleanup();
});
