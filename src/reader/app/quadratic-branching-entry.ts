// Keep route registration stable while the route-owned runtime stays out of
// unrelated reader closures.
await import("./quadratic-branching-runtime.ts");
