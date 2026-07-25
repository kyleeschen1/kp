export function readableOperation(operationId: string): string {
  return operationId.split(".").at(-1)!.replaceAll("-", " ");
}

export function formatDuration(durationMs: number): string {
  const seconds = durationMs / 1_000;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}
