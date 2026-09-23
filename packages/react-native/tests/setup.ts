// React 19 + react-test-renderer require every render/update to happen
// inside `act()` and expect the environment to explicitly opt in; without
// this flag, react-test-renderer's `create()` can flush/unmount before test
// code gets a chance to inspect `.root`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
