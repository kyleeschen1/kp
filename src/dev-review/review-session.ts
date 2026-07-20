const sessionKeyPrefix = "kp.dev-review.session.v1";

export interface KpDevReviewSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface KpDevReviewSessionOptions {
  readonly buildFingerprint: string;
  readonly storage: KpDevReviewSessionStorage;
  readonly nowMs?: number;
  readonly random?: () => number;
}

export function getOrCreateKpDevReviewSessionId(options: KpDevReviewSessionOptions): string {
  const fingerprint = safeSegment(options.buildFingerprint, "unknown");
  const key = `${sessionKeyPrefix}.${fingerprint}`;
  const existing = options.storage.getItem(key);
  if (existing !== null && isReviewSessionId(existing)) return existing;

  const sessionId = [
    "review",
    fingerprint,
    Math.max(0, Math.trunc(options.nowMs ?? Date.now())).toString(36),
    randomSegment(options.random ?? Math.random)
  ].join(".");
  options.storage.setItem(key, sessionId);
  return sessionId;
}

export function isReviewSessionId(value: string): boolean {
  return value.length <= 192 && /^review\.[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value);
}

function safeSegment(value: string, fallback: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return normalized || fallback;
}

function randomSegment(random: () => number): string {
  const value = random();
  const normalized = Number.isFinite(value) ? Math.min(0.999999999999, Math.max(0, value)) : 0;
  return Math.floor(normalized * Number.MAX_SAFE_INTEGER).toString(36).padStart(10, "0");
}
