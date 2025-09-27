// CJS entry with top-level await to force __commonJS wrapper in bundle
await Promise.resolve();
// Side-effect marker
globalThis.__unwrap_test__ = (globalThis.__unwrap_test__ || 0) + 1;
