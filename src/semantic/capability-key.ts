export interface KpCapabilityKeyInput {
  readonly library: string;
  readonly capability: string;
  readonly objectType?: string | undefined;
  readonly mode?: string | undefined;
}

export interface KpCapabilityKeyRecord {
  readonly key: string;
  readonly library: string;
  readonly capability: string;
  readonly objectType: string;
  readonly mode: string;
}

export function formatKpCapabilityKey(input: KpCapabilityKeyInput): string {
  const record = normalizeKpCapabilityKeyInput(input);

  return [
    record.library,
    record.capability,
    record.objectType,
    record.mode
  ].join(":");
}

export function parseKpCapabilityKey(value: string): KpCapabilityKeyRecord {
  const parts = value.split(":");

  if (parts.length !== 4) {
    throw new Error(`Capability key ${value} must have four segments.`);
  }

  return normalizeKpCapabilityKeyInput({
    library: parts[0] ?? "",
    capability: parts[1] ?? "",
    objectType: parts[2] ?? "",
    mode: parts[3] ?? ""
  });
}

function normalizeKpCapabilityKeyInput(
  input: KpCapabilityKeyInput
): KpCapabilityKeyRecord {
  const library = requiredSegment(input.library, "library");
  const capability = requiredSegment(input.capability, "capability");
  const objectType = optionalSegment(input.objectType, "objectType");
  const mode = optionalSegment(input.mode, "mode");
  const key = [library, capability, objectType, mode].join(":");

  return {
    key,
    library,
    capability,
    objectType,
    mode
  };
}

function requiredSegment(value: string, label: string): string {
  const trimmed = value.trim();

  if (trimmed === "") {
    throw new Error(`Capability key ${label} is required.`);
  }

  if (trimmed.includes(":")) {
    throw new Error(`Capability key ${label} must not contain ":".`);
  }

  return trimmed;
}

function optionalSegment(
  value: string | undefined,
  label: string
): string {
  const segment = value ?? "*";
  const trimmed = segment.trim();

  if (trimmed === "") {
    throw new Error(`Capability key ${label} is required.`);
  }

  if (trimmed.includes(":")) {
    throw new Error(`Capability key ${label} must not contain ":".`);
  }

  return trimmed;
}
