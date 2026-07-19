import {
  publishedConceptArtifactSchema,
  verifyPublishedConceptArtifact,
  type KpPublishedConceptArtifact
} from "./publish-concept.ts";

export interface KpCapabilityAvailability {
  readonly id: string;
  readonly major: number;
  readonly implementationVersion: string;
}

export interface KpProviderAvailability {
  readonly id: string;
  readonly protocol: string;
  readonly versions: readonly string[];
}

export interface KpPublicationEnvironment {
  readonly capabilities: readonly KpCapabilityAvailability[];
  readonly providers: readonly KpProviderAvailability[];
  readonly styleRoles: readonly string[];
}

export type KpPublicationFitnessIssueCode =
  | "artifact-invalid"
  | "integrity-mismatch"
  | "capability-unavailable"
  | "provider-incompatible"
  | "style-role-unavailable";

export interface KpPublicationFitnessIssue {
  readonly code: KpPublicationFitnessIssueCode;
  readonly path: string;
  readonly message: string;
}

export interface KpPublicationFitnessReport {
  readonly status: "passed" | "rejected";
  readonly issues: readonly KpPublicationFitnessIssue[];
}

export class KpPublicationFitnessError extends Error {
  readonly report: KpPublicationFitnessReport;

  constructor(report: KpPublicationFitnessReport) {
    super(report.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    this.name = "KpPublicationFitnessError";
    this.report = report;
  }
}

export function definePublicationEnvironment<const Environment extends KpPublicationEnvironment>(
  environment: Environment
): Readonly<Environment> {
  const capabilityKeys = environment.capabilities.map((item) => `${item.id}@${item.major}`);
  const providerKeys = environment.providers.map((item) => `${item.id}:${item.protocol}`);
  requireUnique(capabilityKeys, "capability implementations");
  requireUnique(providerKeys, "provider protocols");
  requireUnique(environment.styleRoles, "style roles");
  for (const capability of environment.capabilities) {
    if (!Number.isInteger(capability.major) || capability.major <= 0 ||
      !/^\d+\.\d+\.\d+$/.test(capability.implementationVersion)) {
      throw new Error(`Invalid capability availability ${capability.id}@${capability.major}.`);
    }
  }
  for (const provider of environment.providers) {
    if (provider.versions.length === 0 ||
      provider.versions.some((version) => !/^\d+\.\d+\.\d+$/.test(version))) {
      throw new Error(`Invalid provider availability ${provider.id}:${provider.protocol}.`);
    }
    requireUnique(provider.versions, `versions for ${provider.id}:${provider.protocol}`);
  }
  deepFreeze(environment);
  return environment;
}

export async function evaluateConceptPublicationFitness(
  input: unknown,
  environment: KpPublicationEnvironment
): Promise<KpPublicationFitnessReport> {
  const parsed = publishedConceptArtifactSchema.safeParse(input);
  if (!parsed.success) {
    return report([{
      code: "artifact-invalid",
      path: parsed.issues[0]?.path ?? "$",
      message: parsed.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")
    }]);
  }

  const artifact = parsed.value;
  const issues: KpPublicationFitnessIssue[] = [];
  if (!await verifyPublishedConceptArtifact(artifact)) {
    issues.push({
      code: "integrity-mismatch",
      path: "$.integrity",
      message: "Artifact content does not match its integrity digest."
    });
  }
  const capabilityKeys = new Set(environment.capabilities.map((item) => `${item.id}@${item.major}`));
  artifact.dependencies.capabilities.forEach((capability, index) => {
    if (!capabilityKeys.has(`${capability.id}@${capability.major}`)) {
      issues.push({
        code: "capability-unavailable",
        path: `$.dependencies.capabilities[${index}]`,
        message: `Capability ${capability.id}@${capability.major} is unavailable.`
      });
    }
  });
  artifact.dependencies.providers.forEach((provider, index) => {
    const available = environment.providers.find((item) =>
      item.id === provider.id && item.protocol === provider.protocol
    );
    if (available === undefined || !available.versions.includes(provider.version)) {
      issues.push({
        code: "provider-incompatible",
        path: `$.dependencies.providers[${index}]`,
        message: `Provider ${provider.id} does not expose ${provider.protocol}@${provider.version}.`
      });
    }
  });
  const styleRoles = new Set(environment.styleRoles);
  artifact.manifest.styleRoles.forEach((styleRole, index) => {
    if (!styleRoles.has(styleRole)) {
      issues.push({
        code: "style-role-unavailable",
        path: `$.manifest.styleRoles[${index}]`,
        message: `Style role ${styleRole} is unavailable.`
      });
    }
  });
  return report(issues);
}

export async function assertConceptPublicationFit(
  input: unknown,
  environment: KpPublicationEnvironment
): Promise<KpPublishedConceptArtifact> {
  const fitness = await evaluateConceptPublicationFitness(input, environment);
  if (fitness.status === "rejected") throw new KpPublicationFitnessError(fitness);
  return publishedConceptArtifactSchema.parse(input);
}

function report(issues: readonly KpPublicationFitnessIssue[]): KpPublicationFitnessReport {
  return deepFreeze({ status: issues.length === 0 ? "passed" as const : "rejected" as const, issues });
}

function requireUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}.`);
}

type DeepReadonly<Value> = Value extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : Value extends object
    ? { readonly [Key in keyof Value]: DeepReadonly<Value[Key]> }
    : Value;

function deepFreeze<Value>(value: Value): DeepReadonly<Value> {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value as DeepReadonly<Value>;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value) as DeepReadonly<Value>;
}
